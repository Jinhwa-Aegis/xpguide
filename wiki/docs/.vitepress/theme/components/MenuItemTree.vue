<template>
  <div class="mt-items">
    <div
      v-for="(item, i) in items"
      :key="i"
      class="mt-entry"
    >
      <!-- Sub-group: has items array -->
      <template v-if="item.items">
        <!-- BROWSE mode: simple collapsible text -->
        <template v-if="mode === 'browse'">
          <div class="mt-subgroup-browse" @click="toggleExpand(i)">
            <span class="arrow" :class="{ open: expanded[i] }">&#9654;</span>
            <span class="subgroup-label">{{ item.text }}</span>
          </div>
          <div v-show="expanded[i]" class="mt-children browse-children">
            <MenuItemTree
              :items="item.items"
              :depth="depth + 1"
              mode="browse"
              :activeFile="activeFile"
              @open-file="(link) => $emit('open-file', link)"
            />
          </div>
        </template>

        <!-- EDIT mode: full editing UI -->
        <template v-else>
          <div
            class="mt-subgroup"
            :class="{ 'drag-over': dragOver === i }"
            draggable="true"
            @dragstart.stop="onDragStart($event, i)"
            @dragend="onDragEnd"
            @dragover.prevent.stop="onDragOver($event, i)"
            @drop.prevent.stop="onDrop($event, i)"
          >
            <span class="drag-handle small">&#9776;</span>
            <input class="me-input subgroup-name" v-model="item.text" placeholder="하위그룹 이름" />
            <label class="me-toggle">
              <input type="checkbox" v-model="item.collapsed" />
              <span class="toggle-label">접힘</span>
            </label>
            <button class="btn-icon" @click="toggleExpand(i)">
              <span class="arrow" :class="{ open: expanded[i] }">&#9654;</span>
            </button>
            <button class="btn-icon danger" @click="removeItem(i)" title="삭제">&times;</button>
          </div>
          <div v-show="expanded[i]" class="mt-children">
            <MenuItemTree
              :items="item.items"
              :depth="depth + 1"
              mode="edit"
              :activeFile="activeFile"
              @open-file="(link) => $emit('open-file', link)"
            />
            <div class="mt-add-row">
              <button class="btn btn-sm" @click="addChildLink(i)">+ 항목</button>
              <button class="btn btn-sm" @click="addChildGroup(i)">+ 하위그룹</button>
            </div>
          </div>
        </template>
      </template>

      <!-- Leaf: has link -->
      <template v-else>
        <!-- BROWSE mode: clickable item -->
        <template v-if="mode === 'browse'">
          <div
            class="mt-leaf-browse"
            :class="{ active: activeFile && isActiveLink(item.link) }"
            @click="$emit('open-file', item.link)"
            :title="item.link"
          >
            {{ item.text }}
          </div>
        </template>

        <!-- EDIT mode: editable inputs -->
        <template v-else>
          <div
            class="mt-leaf"
            :class="{ 'drag-over': dragOver === i }"
            draggable="true"
            @dragstart.stop="onDragStart($event, i)"
            @dragend="onDragEnd"
            @dragover.prevent.stop="onDragOver($event, i)"
            @drop.prevent.stop="onDrop($event, i)"
          >
            <span class="drag-handle small">&#9776;</span>
            <input class="me-input item-text" v-model="item.text" placeholder="메뉴 이름" />
            <input class="me-input item-link" v-model="item.link" placeholder="/path/" />
            <button class="btn-icon danger" @click="removeItem(i)" title="삭제">&times;</button>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'

const props = defineProps({
  items: { type: Array, required: true },
  depth: { type: Number, default: 0 },
  mode: { type: String, default: 'edit' }, // 'browse' | 'edit'
  activeFile: { type: String, default: '' }
})

const emit = defineEmits(['open-file'])

const expanded = reactive({})
// Expand all by default
props.items.forEach((item, i) => {
  if (item.items) expanded[i] = true
})

const dragSrc = ref(null)
const dragOver = ref(null)

function isActiveLink(link) {
  if (!props.activeFile || !link) return false
  // Convert link to file path: /guide/getting-started → guide/getting-started.md or guide/getting-started/index.md
  const cleaned = link.replace(/^\//, '').replace(/\/$/, '')
  if (!cleaned) return props.activeFile === 'index.md'
  const fp = props.activeFile
  return fp === cleaned + '.md' || fp === cleaned + '/index.md'
}

function toggleExpand(i) {
  expanded[i] = !expanded[i]
}

function removeItem(i) {
  const item = props.items[i]
  const label = item.text || '이 항목'
  if (!confirm(`"${label}"을(를) 삭제하시겠습니까?`)) return
  props.items.splice(i, 1)
}

function addChildLink(i) {
  props.items[i].items.push({ text: '새 항목', link: '/' })
}

function addChildGroup(i) {
  props.items[i].items.push({ text: '새 하위그룹', collapsed: true, items: [] })
  // Ensure parent is expanded
  expanded[i] = true
}

// Drag & drop (same-level only)
function onDragStart(e, i) {
  dragSrc.value = i
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', String(i))
}

function onDragEnd() {
  dragSrc.value = null
  dragOver.value = null
}

function onDragOver(e, i) {
  dragOver.value = i
}

function onDrop(e, targetI) {
  if (dragSrc.value === null || dragSrc.value === targetI) {
    dragOver.value = null
    return
  }
  const [moved] = props.items.splice(dragSrc.value, 1)
  props.items.splice(targetI, 0, moved)
  dragSrc.value = null
  dragOver.value = null
}
</script>

<style scoped>
.mt-items {
  padding-left: 20px;
}

.mt-entry {
  margin-bottom: 2px;
}

/* Sub-group header (edit mode) */
.mt-subgroup {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  margin-top: 4px;
  transition: border-color 0.15s;
}
.mt-subgroup.drag-over {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 1px var(--vp-c-brand-soft);
}

.subgroup-name {
  flex: 1;
  font-weight: 600;
}

/* Sub-group header (browse mode) */
.mt-subgroup-browse {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  cursor: pointer;
  user-select: none;
  border-radius: 4px;
  margin-top: 2px;
}
.mt-subgroup-browse:hover {
  background: var(--vp-c-bg-soft);
}
.subgroup-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-2);
}

/* Leaf item (edit mode) */
.mt-leaf {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  transition: background 0.1s;
}
.mt-leaf.drag-over {
  background: var(--vp-c-brand-soft);
  border-radius: 4px;
}

/* Leaf item (browse mode) */
.mt-leaf-browse {
  padding: 4px 8px;
  font-size: 13px;
  color: var(--vp-c-text-2);
  cursor: pointer;
  border-radius: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mt-leaf-browse:hover {
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}
.mt-leaf-browse.active {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

/* Children container */
.mt-children {
  padding-left: 4px;
  border-left: 2px solid var(--vp-c-border);
  margin-left: 12px;
  margin-top: 2px;
  margin-bottom: 4px;
}
.browse-children {
  border-left-color: transparent;
  margin-left: 6px;
}

.mt-add-row {
  display: flex;
  gap: 6px;
  padding: 4px 0 4px 20px;
}

/* Shared styles */
.drag-handle {
  cursor: grab;
  color: var(--vp-c-text-3);
  font-size: 14px;
  user-select: none;
  flex-shrink: 0;
}
.drag-handle:active { cursor: grabbing; }
.drag-handle.small { font-size: 12px; }

.arrow {
  display: inline-block;
  font-size: 10px;
  transition: transform 0.15s;
  color: var(--vp-c-text-3);
}
.arrow.open { transform: rotate(90deg); }

.me-input {
  padding: 4px 8px;
  border: 1px solid var(--vp-c-border);
  border-radius: 4px;
  font-size: 13px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  outline: none;
}
.me-input:focus { border-color: var(--vp-c-brand-1); }

.item-text { width: 160px; flex-shrink: 0; }
.item-link { flex: 1; font-family: monospace; font-size: 12px; color: var(--vp-c-text-2); }

.me-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--vp-c-text-3);
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
}
.me-toggle input { margin: 0; }
.toggle-label { white-space: nowrap; }

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
.btn-sm { padding: 4px 10px; font-size: 12px; background: var(--vp-c-bg); border: 1px solid var(--vp-c-border); color: var(--vp-c-text-2); }
.btn-sm:hover { border-color: var(--vp-c-brand-1); color: var(--vp-c-brand-1); }

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: var(--vp-c-text-3);
  padding: 2px 6px;
  border-radius: 4px;
  line-height: 1;
}
.btn-icon:hover { background: var(--vp-c-bg); color: var(--vp-c-text-1); }
.btn-icon.danger:hover { color: #ef4444; background: #fef2f2; }

@media (max-width: 640px) {
  .mt-leaf { flex-wrap: wrap; }
  .item-text { width: 100%; }
  .item-link { width: 100%; }
}
</style>
