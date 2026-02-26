import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import multer from "multer";
import { readdir, readFile, writeFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PORT = 3001;
const JWT_SECRET = crypto.randomBytes(32).toString("hex"); // rotated on restart
const JWT_EXPIRES_IN = "8h";
const ADMIN_USER = "admin";
const ADMIN_PASS = "a123456789";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_ROOT = path.resolve(__dirname, "..", "docs");
const SCREENSHOTS_DIR = path.join(DOCS_ROOT, "public", "screenshots");

const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve a user-supplied relative path to an absolute path within DOCS_ROOT.
 *  Throws if the resolved path escapes the docs directory. */
function safePath(relativePath) {
  // Normalise separators and strip leading slashes / dots
  const cleaned = relativePath.replace(/\\/g, "/").replace(/^[./]+/, "");
  const resolved = path.resolve(DOCS_ROOT, cleaned);

  if (!resolved.startsWith(DOCS_ROOT)) {
    const err = new Error("Path traversal detected");
    err.status = 403;
    throw err;
  }
  return resolved;
}

/** Recursively list all .md files under a directory, returning paths relative
 *  to DOCS_ROOT with forward slashes. */
async function listMarkdownFiles(dir, base = DOCS_ROOT) {
  const entries = await readdir(dir, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules, .vitepress cache, and other non-content dirs
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      results.push(...(await listMarkdownFiles(full, base)));
    } else if (entry.name.endsWith(".md")) {
      results.push(path.relative(base, full).replace(/\\/g, "/"));
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "5mb" }));

// ---------------------------------------------------------------------------
// Auth - login (unprotected)
// ---------------------------------------------------------------------------

app.post("/api/login", (req, res) => {
  const { username, password } = req.body ?? {};

  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ sub: username }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  return res.json({ token });
});

// ---------------------------------------------------------------------------
// JWT middleware - protects everything below
// ---------------------------------------------------------------------------

app.use("/api", (req, res, next) => {
  // login is already handled above, skip if somehow reached here
  if (req.path === "/login") return next();

  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed token" });
  }

  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
});

// ---------------------------------------------------------------------------
// File API
// ---------------------------------------------------------------------------

// GET /api/files - list all .md files
app.get("/api/files", async (_req, res, next) => {
  try {
    const files = await listMarkdownFiles(DOCS_ROOT);
    files.sort();
    return res.json({ files });
  } catch (err) {
    next(err);
  }
});

// GET /api/files/:path(*) - read a specific .md file
app.get("/api/files/:path(*)", async (req, res, next) => {
  try {
    const filePath = safePath(req.params.path);

    if (!filePath.endsWith(".md")) {
      return res.status(400).json({ error: "Only .md files can be read" });
    }

    const content = await readFile(filePath, "utf-8");
    return res.json({
      path: req.params.path,
      content,
    });
  } catch (err) {
    if (err.code === "ENOENT") {
      return res.status(404).json({ error: "File not found" });
    }
    next(err);
  }
});

// PUT /api/files/:path(*) - update an existing .md file
app.put("/api/files/:path(*)", async (req, res, next) => {
  try {
    const filePath = safePath(req.params.path);

    if (!filePath.endsWith(".md")) {
      return res.status(400).json({ error: "Only .md files can be written" });
    }

    // Verify file exists before overwriting
    await stat(filePath);

    const { content } = req.body ?? {};
    if (typeof content !== "string") {
      return res.status(400).json({ error: "Body must include 'content' string" });
    }

    await writeFile(filePath, content, "utf-8");
    return res.json({ path: req.params.path, message: "File updated" });
  } catch (err) {
    if (err.code === "ENOENT") {
      return res.status(404).json({ error: "File not found. Use POST to create." });
    }
    next(err);
  }
});

// POST /api/files - create a new .md file
app.post("/api/files", async (req, res, next) => {
  try {
    const { path: filePath, content } = req.body ?? {};

    if (typeof filePath !== "string" || !filePath.trim()) {
      return res.status(400).json({ error: "Body must include 'path' string" });
    }
    if (typeof content !== "string") {
      return res.status(400).json({ error: "Body must include 'content' string" });
    }

    const absPath = safePath(filePath);

    if (!absPath.endsWith(".md")) {
      return res.status(400).json({ error: "Only .md files can be created" });
    }

    // Prevent overwriting existing files
    try {
      await stat(absPath);
      return res.status(409).json({ error: "File already exists. Use PUT to update." });
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
    }

    // Ensure parent directory exists
    await mkdir(path.dirname(absPath), { recursive: true });
    await writeFile(absPath, content, "utf-8");

    return res.status(201).json({ path: filePath, message: "File created" });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Image upload
// ---------------------------------------------------------------------------

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, SCREENSHOTS_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const name = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`;
      cb(null, name);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported image type. Allowed: PNG, JPG, GIF, WebP."));
    }
  },
});

app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image file provided (field: 'image')" });
  }

  // VitePress serves docs/public/* at the site root
  const urlPath = `/screenshots/${req.file.filename}`;
  return res.status(201).json({
    filename: req.file.filename,
    url: urlPath,
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

// Multer errors
app.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

// General errors
app.use((err, _req, res, _next) => {
  const status = err.status ?? 500;
  console.error(`[${new Date().toISOString()}] ${err.message}`);
  return res.status(status).json({
    error: status === 500 ? "Internal server error" : err.message,
  });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`Admin API server running on http://localhost:${PORT}`);
  console.log(`Docs root: ${DOCS_ROOT}`);
  console.log(`Screenshots: ${SCREENSHOTS_DIR}`);
});
