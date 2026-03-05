<template>
  <div class="menu-editor">
    <!-- Loading / Error -->
    <div class="me-status" v-if="loading">불러오는 중...</div>
    <div class="me-status error" v-else-if="loadError">{{ loadError }}</div>

    <template v-else>
      <!-- Toolbar -->
      <div class="me-toolbar">
        <button class="btn btn-sm" @click="addGroup">+ 그룹 추가</button>
        <div class="me-toolbar-right">
          <span class="save-status" :class="{ saved: saveMsg === '저장됨', error: saveMsg.includes('오류') }">{{ saveMsg }}</span>
          <button class="btn btn-primary" @click="save" :disabled="saving">{{ saving ? '저장 중...' : '저장' }}</button>
        </div>
      </div>

      <!-- Groups -->
      <div class="me-groups">
        <div
          v-for="(group, gi) in sidebar"
          :key="gi"
          class="me-group"
          :class="{ dragging: dragGroup === gi, 'drag-over': dragOverGroup === gi && dragType === 'group' }"
          draggable="true"
          @dragstart="onGroupDragStart($event, gi)"
          @dragend="onGroupDragEnd"
          @dragover.prevent="onGroupDragOver($event, gi)"
          @drop.prevent="onGroupDrop($event, gi)"
        >
          <!-- Group header -->
          <div class="me-group-header">
            <span class="drag-handle" title="드래그하여 순서 변경">&#9776;</span>
            <input
              class="me-input group-name"
              v-model="group.text"
              placeholder="그룹 이름"
            />
            <label class="me-toggle" title="접힘 상태">
              <input type="checkbox" v-model="group.collapsed" />
              <span class="toggle-label">접힘</span>
            </label>
            <button class="btn-icon" @click="toggleGroupExpand(gi)" :title="expandedGroups[gi] ? '접기' : '펼치기'">
              <span class="arrow" :class="{ open: expandedGroups[gi] }">&#9654;</span>
            </button>
            <button class="btn-icon danger" @click="removeGroup(gi)" title="그룹 삭제">&times;</button>
          </div>

          <!-- Group items (recursive) -->
          <div class="me-items" v-show="expandedGroups[gi]">
            <MenuItemTree :items="group.items" :depth="0" />
            <div class="me-add-buttons">
              <button class="btn btn-sm add-item" @click="addItem(gi)">+ 항목 추가</button>
              <button class="btn btn-sm add-item" @click="addSubgroup(gi)">+ 하위그룹 추가</button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import MenuItemTree from './MenuItemTree.vue'

const props = defineProps({ token: String })
const emit = defineEmits(['logout'])

const API = 'http://localhost:3001'

const sidebar = ref([])
const loading = ref(true)
const loadError = ref('')
const saving = ref(false)
const saveMsg = ref('')
const expandedGroups = reactive({})

// Drag state - groups
const dragType = ref(null) // 'group' | 'item'
const dragGroup = ref(null)
const dragOverGroup = ref(null)


function authHeaders() {
  return { Authorization: `Bearer ${props.token}` }
}

async function fetchSidebar() {
  loading.value = true
  loadError.value = ''
  try {
    const res = await fetch(`${API}/api/sidebar`, { headers: authHeaders() })
    if (res.status === 401) { emit('logout'); return }
    if (res.status === 404) {
      loadError.value = 'sidebar.json 파일을 찾을 수 없습니다. 서버를 재시작해주세요.'
      return
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || `HTTP ${res.status}`)
    }
    sidebar.value = await res.json()
    // Expand all groups by default
    sidebar.value.forEach((_, i) => { expandedGroups[i] = true })
  } catch (e) {
    if (!loadError.value) {
      loadError.value = e.message === 'Failed to fetch'
        ? '서버에 연결할 수 없습니다. admin 서버(localhost:3001)가 실행 중인지 확인해주세요.'
        : '사이드바 데이터를 불러오지 못했습니다: ' + e.message
    }
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  saveMsg.value = ''
  try {
    const res = await fetch(`${API}/api/sidebar`, {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(sidebar.value)
    })
    if (res.status === 401) { emit('logout'); return }
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Save failed')
    }
    saveMsg.value = '저장됨'
  } catch (e) {
    saveMsg.value = '저장 오류: ' + e.message
  } finally {
    saving.value = false
  }
}

// Group operations
function addGroup() {
  sidebar.value.push({ text: '새 그룹', collapsed: true, items: [] })
  expandedGroups[sidebar.value.length - 1] = true
}

function removeGroup(gi) {
  if (!confirm(`"${sidebar.value[gi].text}" 그룹을 삭제하시겠습니까?`)) return
  sidebar.value.splice(gi, 1)
}

function toggleGroupExpand(gi) {
  expandedGroups[gi] = !expandedGroups[gi]
}

// Item operations
function addItem(gi) {
  sidebar.value[gi].items.push({ text: '새 항목', link: '/' })
}

function addSubgroup(gi) {
  sidebar.value[gi].items.push({ text: '새 하위그룹', collapsed: true, items: [] })
}

// Group drag & drop
function onGroupDragStart(e, gi) {
  dragType.value = 'group'
  dragGroup.value = gi
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', `group:${gi}`)
}

function onGroupDragEnd() {
  dragGroup.value = null
  dragOverGroup.value = null
  dragType.value = null
}

function onGroupDragOver(e, gi) {
  if (dragType.value !== 'group') return
  dragOverGroup.value = gi
}

function onGroupDrop(e, targetGi) {
  if (dragType.value !== 'group' || dragGroup.value === null) return
  const sourceGi = dragGroup.value
  if (sourceGi === targetGi) return

  const [moved] = sidebar.value.splice(sourceGi, 1)
  sidebar.value.splice(targetGi, 0, moved)

  dragGroup.value = null
  dragOverGroup.value = null
  dragType.value = null
}

onMounted(fetchSidebar)
</script>

<style scoped>
.menu-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.me-status {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: var(--vp-c-text-3);
  font-size: 15px;
}
.me-status.error { color: #ef4444; }

/* Toolbar */
.me-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg-soft);
  flex-shrink: 0;
}
.me-toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.save-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}
.save-status.saved { color: #22c55e; }
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

/* Groups container */
.me-groups {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
}

/* Group */
.me-group {
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  margin-bottom: 10px;
  background: var(--vp-c-bg);
  transition: box-shadow 0.15s, border-color 0.15s;
}
.me-group.dragging { opacity: 0.5; }
.me-group.drag-over { border-color: var(--vp-c-brand-1); box-shadow: 0 0 0 2px var(--vp-c-brand-soft); }

.me-group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--vp-c-bg-soft);
  border-radius: 8px 8px 0 0;
}

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

/* Inputs */
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
.group-name { flex: 1; font-weight: 600; }

/* Toggle */
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

/* Items */
.me-items {
  padding: 8px 12px 8px 32px;
}


.me-add-buttons {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}
.add-item {
  margin-top: 0;
}

</style>
