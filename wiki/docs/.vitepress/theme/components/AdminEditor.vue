<template>
  <div class="admin-editor">
    <!-- Header -->
    <div class="editor-header">
      <div class="header-left">
        <button class="btn btn-ghost" @click="toggleSidebar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <span class="current-file" v-if="currentFile">{{ currentFile }}</span>
        <span class="current-file placeholder" v-else>파일을 선택하세요</span>
      </div>
      <div class="header-right">
        <span class="save-status" :class="saveStatusClass">{{ saveStatus }}</span>
        <button class="btn btn-primary" @click="saveFile" :disabled="!currentFile || saving">
          {{ saving ? '저장 중...' : '저장' }}
        </button>
        <button class="btn btn-ghost" @click="$emit('logout')">로그아웃</button>
      </div>
    </div>

    <div class="editor-body">
      <!-- Sidebar: File tree -->
      <aside class="file-sidebar" :class="{ collapsed: sidebarCollapsed }">
        <div class="sidebar-header">
          <h3>파일 목록</h3>
          <button class="btn btn-sm" @click="showNewFileDialog = true" title="새 파일">+ 새 파일</button>
        </div>
        <div class="file-tree">
          <template v-for="(files, dir) in groupedFiles" :key="dir">
            <div class="dir-group">
              <div class="dir-name" @click="toggleDir(dir)">
                <span class="dir-arrow" :class="{ open: openDirs[dir] }">&#9654;</span>
                {{ dir || '/' }}
              </div>
              <div v-show="openDirs[dir]" class="dir-files">
                <div
                  v-for="f in files" :key="f"
                  class="file-item"
                  :class="{ active: f === currentFile }"
                  @click="openFile(f)"
                  :title="f"
                >
                  {{ fileName(f) }}
                </div>
              </div>
            </div>
          </template>
        </div>
      </aside>

      <!-- Main editor area -->
      <div class="editor-main">
        <!-- Toolbar -->
        <div class="toolbar" v-if="currentFile">
          <button class="tb-btn" @click="insertMd('**', '**')" title="굵게 (Ctrl+B)"><b>B</b></button>
          <button class="tb-btn" @click="insertMd('*', '*')" title="기울임 (Ctrl+I)"><i>I</i></button>
          <span class="tb-sep"></span>
          <button class="tb-btn" @click="insertLine('# ')" title="제목 1">H1</button>
          <button class="tb-btn" @click="insertLine('## ')" title="제목 2">H2</button>
          <button class="tb-btn" @click="insertLine('### ')" title="제목 3">H3</button>
          <span class="tb-sep"></span>
          <button class="tb-btn" @click="insertLine('- ')" title="목록">목록</button>
          <button class="tb-btn" @click="insertLine('1. ')" title="번호 목록">번호</button>
          <button class="tb-btn" @click="insertMd('[', '](url)')" title="링크">링크</button>
          <button class="tb-btn" @click="insertMd('\n```\n', '\n```\n')" title="코드 블록">코드</button>
          <button class="tb-btn" @click="insertTable" title="표">표</button>
          <span class="tb-sep"></span>
          <button class="tb-btn" @click="insertMd('> ')" title="인용">인용</button>
          <button class="tb-btn" @click="insertMd('\n::: tip 팁\n', '\n:::\n')" title="팁">팁</button>
          <button class="tb-btn" @click="insertMd('\n::: warning 주의\n', '\n:::\n')" title="주의">주의</button>
          <span class="tb-sep"></span>
          <label class="tb-btn upload-btn" title="이미지 업로드">
            이미지
            <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" @change="uploadImage" hidden />
          </label>
        </div>

        <!-- Editor + Preview split -->
        <div class="editor-split" v-if="currentFile">
          <div class="editor-pane">
            <textarea
              ref="editorRef"
              v-model="content"
              class="editor-textarea"
              spellcheck="false"
              @keydown="handleKeydown"
            ></textarea>
          </div>
          <div class="preview-pane">
            <div class="preview-label">미리보기</div>
            <div class="preview-content vp-doc" v-html="renderedHtml"></div>
          </div>
        </div>

        <!-- Empty state -->
        <div class="empty-state" v-else>
          <p>왼쪽 파일 목록에서 편집할 파일을 선택하세요.</p>
        </div>
      </div>
    </div>

    <!-- New file dialog -->
    <div class="dialog-overlay" v-if="showNewFileDialog" @click.self="showNewFileDialog = false">
      <div class="dialog">
        <h3>새 파일 만들기</h3>
        <div class="field">
          <label>파일 경로 (예: guide/new-page.md)</label>
          <input v-model="newFilePath" placeholder="경로/파일명.md" @keydown.enter="createFile" />
        </div>
        <div class="dialog-actions">
          <button class="btn btn-ghost" @click="showNewFileDialog = false">취소</button>
          <button class="btn btn-primary" @click="createFile">만들기</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'

const props = defineProps({ token: String })
const emit = defineEmits(['logout'])

const API = 'http://localhost:3001'

// State
const files = ref([])
const currentFile = ref('')
const content = ref('')
const originalContent = ref('')
const saving = ref(false)
const saveStatus = ref('')
const sidebarCollapsed = ref(false)
const openDirs = ref({})
const showNewFileDialog = ref(false)
const newFilePath = ref('')
const editorRef = ref(null)

const saveStatusClass = computed(() => ({
  saved: saveStatus.value === '저장됨',
  modified: saveStatus.value === '수정됨',
  error: saveStatus.value.includes('오류')
}))

// Watch for content changes
watch(content, (val) => {
  if (currentFile.value) {
    saveStatus.value = val !== originalContent.value ? '수정됨' : '저장됨'
  }
})

// Simple markdown → HTML rendering
const renderedHtml = computed(() => {
  if (!content.value) return ''
  return renderMarkdown(content.value)
})

function renderMarkdown(md) {
  let html = md
    // Escape HTML
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // Code blocks (``` ... ```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
    `<pre><code class="language-${lang}">${code}</code></pre>`)

  // VitePress containers ::: tip/warning/danger
  html = html.replace(/^::: (tip|warning|danger)\s*(.*)\n([\s\S]*?)^:::/gm, (_, type, title, body) =>
    `<div class="custom-block ${type}"><p class="custom-block-title">${title || type}</p>${body.split('\n').map(l => `<p>${l}</p>`).join('')}</div>`)

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // Bold / Italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" style="max-width:100%"/>')

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Blockquotes
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote><p>$1</p></blockquote>')

  // Unordered list
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')

  // Tables (basic)
  html = html.replace(/^(\|.+\|)\n(\|[-| :]+\|)\n((?:\|.+\|\n?)*)/gm, (_, headerRow, _sep, bodyRows) => {
    const headers = headerRow.split('|').filter(c => c.trim())
    const rows = bodyRows.trim().split('\n').map(r => r.split('|').filter(c => c.trim()))
    return `<table><thead><tr>${headers.map(h => `<th>${h.trim()}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c.trim()}</td>`).join('')}</tr>`).join('')}</tbody></table>`
  })

  // Paragraphs
  html = html.replace(/^(?!<[a-z])((?!^\s*$).+)$/gm, '<p>$1</p>')

  return html
}

// API helpers
function authHeaders() {
  return { Authorization: `Bearer ${props.token}` }
}

async function fetchFiles() {
  try {
    const res = await fetch(`${API}/api/files`, { headers: authHeaders() })
    if (res.status === 401) { emit('logout'); return }
    const data = await res.json()
    files.value = data.files || []
    // Auto-open all directories
    const dirs = new Set(files.value.map(f => f.split('/').slice(0, -1).join('/') || '/'))
    dirs.forEach(d => { if (openDirs.value[d] === undefined) openDirs.value[d] = true })
  } catch {
    console.error('Failed to fetch files')
  }
}

async function openFile(filePath) {
  if (currentFile.value === filePath) return
  if (content.value !== originalContent.value) {
    if (!confirm('저장하지 않은 변경 사항이 있습니다. 그래도 이동하시겠습니까?')) return
  }
  try {
    const res = await fetch(`${API}/api/files/${encodeURIComponent(filePath)}`, { headers: authHeaders() })
    if (res.status === 401) { emit('logout'); return }
    const data = await res.json()
    currentFile.value = filePath
    content.value = data.content
    originalContent.value = data.content
    saveStatus.value = '저장됨'
    // Close sidebar on mobile
    if (window.innerWidth < 768) sidebarCollapsed.value = true
  } catch {
    alert('파일을 불러오는 데 실패했습니다.')
  }
}

async function saveFile() {
  if (!currentFile.value || saving.value) return
  saving.value = true
  try {
    const res = await fetch(`${API}/api/files/${encodeURIComponent(currentFile.value)}`, {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: content.value })
    })
    if (res.status === 401) { emit('logout'); return }
    if (!res.ok) throw new Error()
    originalContent.value = content.value
    saveStatus.value = '저장됨'
  } catch {
    saveStatus.value = '저장 오류!'
  } finally {
    saving.value = false
  }
}

async function createFile() {
  let p = newFilePath.value.trim()
  if (!p) return
  if (!p.endsWith('.md')) p += '.md'
  try {
    const res = await fetch(`${API}/api/files`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: p, content: `# ${p.split('/').pop().replace('.md', '')}\n\n` })
    })
    if (!res.ok) {
      const data = await res.json()
      alert(data.error || '파일 생성 실패')
      return
    }
    showNewFileDialog.value = false
    newFilePath.value = ''
    await fetchFiles()
    await openFile(p)
  } catch {
    alert('파일 생성에 실패했습니다.')
  }
}

async function uploadImage(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const formData = new FormData()
  formData.append('image', file)
  try {
    const res = await fetch(`${API}/api/upload`, {
      method: 'POST',
      headers: authHeaders(),
      body: formData
    })
    if (!res.ok) throw new Error()
    const data = await res.json()
    const mdImg = `![${file.name}](${data.url})`
    insertAtCursor(mdImg)
  } catch {
    alert('이미지 업로드에 실패했습니다.')
  }
  e.target.value = ''
}

// File tree helpers
const groupedFiles = computed(() => {
  const groups = {}
  files.value.forEach(f => {
    const parts = f.split('/')
    const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : '/'
    if (!groups[dir]) groups[dir] = []
    groups[dir].push(f)
  })
  // Sort directories
  const sorted = {}
  Object.keys(groups).sort().forEach(k => { sorted[k] = groups[k] })
  return sorted
})

function fileName(f) {
  return f.split('/').pop()
}

function toggleDir(dir) {
  openDirs.value[dir] = !openDirs.value[dir]
}

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

// Editor helpers
function insertAtCursor(text) {
  const ta = editorRef.value
  if (!ta) return
  const start = ta.selectionStart
  const end = ta.selectionEnd
  content.value = content.value.slice(0, start) + text + content.value.slice(end)
  nextTick(() => {
    ta.selectionStart = ta.selectionEnd = start + text.length
    ta.focus()
  })
}

function insertMd(before, after = '') {
  const ta = editorRef.value
  if (!ta) return
  const start = ta.selectionStart
  const end = ta.selectionEnd
  const selected = content.value.slice(start, end)
  const replacement = before + selected + after
  content.value = content.value.slice(0, start) + replacement + content.value.slice(end)
  nextTick(() => {
    if (selected) {
      ta.selectionStart = start
      ta.selectionEnd = start + replacement.length
    } else {
      ta.selectionStart = ta.selectionEnd = start + before.length
    }
    ta.focus()
  })
}

function insertLine(prefix) {
  const ta = editorRef.value
  if (!ta) return
  const start = ta.selectionStart
  // Find line start
  const lineStart = content.value.lastIndexOf('\n', start - 1) + 1
  content.value = content.value.slice(0, lineStart) + prefix + content.value.slice(lineStart)
  nextTick(() => {
    ta.selectionStart = ta.selectionEnd = start + prefix.length
    ta.focus()
  })
}

function insertTable() {
  insertAtCursor('\n| 항목 | 설명 |\n|------|------|\n| | |\n')
}

function handleKeydown(e) {
  // Ctrl+S → save
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    saveFile()
  }
  // Ctrl+B → bold
  if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
    e.preventDefault()
    insertMd('**', '**')
  }
  // Ctrl+I → italic
  if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
    e.preventDefault()
    insertMd('*', '*')
  }
  // Tab → indent
  if (e.key === 'Tab') {
    e.preventDefault()
    insertAtCursor('  ')
  }
}

onMounted(fetchFiles)
</script>

<style scoped>
.admin-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
  background: var(--vp-c-bg);
}

/* Header */
.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  border-bottom: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg-soft);
  flex-shrink: 0;
  gap: 12px;
}
.header-left, .header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.current-file {
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  font-family: monospace;
}
.current-file.placeholder {
  color: var(--vp-c-text-3);
  font-weight: 400;
}
.save-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}
.save-status.saved { color: #22c55e; }
.save-status.modified { color: #f59e0b; }
.save-status.error { color: #ef4444; }

/* Buttons */
.btn {
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.btn-primary {
  background: var(--vp-c-brand-1);
  color: #fff;
}
.btn-primary:hover:not(:disabled) { opacity: 0.9; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-ghost {
  background: transparent;
  color: var(--vp-c-text-2);
  display: flex;
  align-items: center;
  gap: 4px;
}
.btn-ghost:hover { color: var(--vp-c-text-1); background: var(--vp-c-bg-soft); }
.btn-sm { padding: 4px 10px; font-size: 12px; }

/* Body layout */
.editor-body {
  display: flex;
  flex: 1;
  min-height: 0;
}

/* Sidebar */
.file-sidebar {
  width: 260px;
  min-width: 260px;
  border-right: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg-soft);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.2s, min-width 0.2s;
}
.file-sidebar.collapsed {
  width: 0;
  min-width: 0;
  border-right: none;
}
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid var(--vp-c-border);
}
.sidebar-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}
.file-tree {
  overflow-y: auto;
  flex: 1;
  padding: 4px 0;
}
.dir-group { margin-bottom: 2px; }
.dir-name {
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
  color: var(--vp-c-text-2);
  text-transform: uppercase;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 6px;
}
.dir-name:hover { color: var(--vp-c-text-1); }
.dir-arrow {
  font-size: 8px;
  transition: transform 0.15s;
  display: inline-block;
}
.dir-arrow.open { transform: rotate(90deg); }
.file-item {
  padding: 5px 12px 5px 28px;
  font-size: 13px;
  color: var(--vp-c-text-2);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.file-item:hover { background: var(--vp-c-bg); color: var(--vp-c-text-1); }
.file-item.active {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

/* Main area */
.editor-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* Toolbar */
.toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px 12px;
  border-bottom: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg-soft);
  flex-wrap: wrap;
  flex-shrink: 0;
}
.tb-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--vp-c-text-2);
  font-size: 13px;
  cursor: pointer;
  font-family: inherit;
}
.tb-btn:hover { background: var(--vp-c-bg); color: var(--vp-c-text-1); }
.tb-sep {
  width: 1px;
  height: 18px;
  background: var(--vp-c-border);
  margin: 0 4px;
}
.upload-btn { cursor: pointer; }

/* Editor split */
.editor-split {
  flex: 1;
  display: flex;
  min-height: 0;
}
.editor-pane {
  flex: 1;
  display: flex;
  border-right: 1px solid var(--vp-c-border);
}
.editor-textarea {
  flex: 1;
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  padding: 16px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.7;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  tab-size: 2;
}
.preview-pane {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: var(--vp-c-bg);
}
.preview-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
  margin-bottom: 12px;
  letter-spacing: 0.05em;
}
.preview-content {
  font-size: 14px;
  line-height: 1.7;
}
.preview-content :deep(h1) { font-size: 1.6em; margin: 0.6em 0 0.4em; border-bottom: 1px solid var(--vp-c-border); padding-bottom: 0.3em; }
.preview-content :deep(h2) { font-size: 1.3em; margin: 0.6em 0 0.3em; }
.preview-content :deep(h3) { font-size: 1.1em; margin: 0.5em 0 0.3em; }
.preview-content :deep(pre) { background: var(--vp-c-bg-soft); padding: 12px; border-radius: 6px; overflow-x: auto; }
.preview-content :deep(code) { background: var(--vp-c-bg-soft); padding: 2px 6px; border-radius: 3px; font-size: 0.9em; }
.preview-content :deep(pre code) { background: none; padding: 0; }
.preview-content :deep(blockquote) { border-left: 3px solid var(--vp-c-brand-1); margin: 8px 0; padding: 4px 16px; color: var(--vp-c-text-2); }
.preview-content :deep(table) { border-collapse: collapse; width: 100%; margin: 8px 0; }
.preview-content :deep(th), .preview-content :deep(td) { border: 1px solid var(--vp-c-border); padding: 8px 12px; text-align: left; }
.preview-content :deep(th) { background: var(--vp-c-bg-soft); font-weight: 600; }
.preview-content :deep(img) { max-width: 100%; border-radius: 4px; margin: 8px 0; }
.preview-content :deep(.custom-block) { padding: 12px 16px; border-radius: 6px; margin: 8px 0; }
.preview-content :deep(.custom-block.tip) { background: #e6f6e6; border-left: 4px solid #42b883; }
.preview-content :deep(.custom-block.warning) { background: #fff8e6; border-left: 4px solid #e6a700; }
.preview-content :deep(.custom-block.danger) { background: #ffe6e6; border-left: 4px solid #cc0000; }
.preview-content :deep(.custom-block-title) { font-weight: 700; margin-bottom: 4px; }

/* Empty state */
.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--vp-c-text-3);
  font-size: 15px;
}

/* Dialog */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.dialog {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 420px;
}
.dialog h3 { margin: 0 0 16px; font-size: 1.1em; }
.dialog .field { margin-bottom: 16px; }
.dialog .field label { display: block; font-size: 13px; color: var(--vp-c-text-2); margin-bottom: 6px; }
.dialog .field input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 14px;
  box-sizing: border-box;
}
.dialog .field input:focus { outline: none; border-color: var(--vp-c-brand-1); }
.dialog-actions { display: flex; justify-content: flex-end; gap: 8px; }

/* Responsive */
@media (max-width: 768px) {
  .file-sidebar { position: absolute; z-index: 50; height: 100%; }
  .file-sidebar.collapsed { width: 0; min-width: 0; }
  .editor-split { flex-direction: column; }
  .editor-pane { border-right: none; border-bottom: 1px solid var(--vp-c-border); min-height: 40%; }
  .preview-pane { min-height: 30%; }
}
</style>
