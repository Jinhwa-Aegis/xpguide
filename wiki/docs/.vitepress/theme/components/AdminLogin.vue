<template>
  <div class="admin-login-wrapper">
    <div class="admin-login-card">
      <div class="admin-login-header">
        <svg class="admin-login-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <h1 class="admin-login-title">관리자 로그인</h1>
        <p class="admin-login-subtitle">XP Guide 위키 관리자 페이지</p>
      </div>

      <form class="admin-login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label" for="username">사용자명</label>
          <input
            id="username"
            v-model="username"
            class="form-input"
            type="text"
            placeholder="사용자명을 입력하세요"
            autocomplete="username"
            :disabled="loading"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="password">비밀번호</label>
          <input
            id="password"
            v-model="password"
            class="form-input"
            type="password"
            placeholder="비밀번호를 입력하세요"
            autocomplete="current-password"
            :disabled="loading"
            required
          />
        </div>

        <div v-if="error" class="form-error" role="alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="error-icon">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {{ error }}
        </div>

        <button
          type="submit"
          class="login-button"
          :class="{ loading }"
          :disabled="loading"
        >
          <span v-if="loading" class="spinner" aria-hidden="true"></span>
          <span>{{ loading ? '로그인 중...' : '로그인' }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'login-success', token: string): void
}>()

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  if (!username.value.trim() || !password.value.trim()) {
    error.value = '사용자명과 비밀번호를 모두 입력해주세요.'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await fetch('http://localhost:3001/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.value,
        password: password.value
      })
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.message || '로그인에 실패했습니다. 자격 증명을 확인해주세요.')
    }

    const data = await response.json()

    if (!data.token) {
      throw new Error('서버에서 유효한 토큰을 받지 못했습니다.')
    }

    localStorage.setItem('admin_token', data.token)
    emit('login-success', data.token)
  } catch (err: any) {
    if (err instanceof TypeError && err.message.includes('fetch')) {
      error.value = '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.'
    } else {
      error.value = err.message || '알 수 없는 오류가 발생했습니다.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.admin-login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--vp-c-bg);
  padding: 24px;
}

.admin-login-card {
  width: 100%;
  max-width: 400px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  padding: 40px 36px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.admin-login-header {
  text-align: center;
  margin-bottom: 32px;
}

.admin-login-icon {
  width: 48px;
  height: 48px;
  color: var(--vp-c-brand-1);
  margin: 0 auto 16px;
  display: block;
}

.admin-login-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 0 0 6px;
  line-height: 1.3;
  border: none;
  padding: 0;
}

.admin-login-subtitle {
  font-size: 14px;
  color: var(--vp-c-text-2);
  margin: 0;
}

.admin-login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-2);
  letter-spacing: 0.01em;
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  font-size: 15px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--vp-c-brand-1) 15%, transparent);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-error {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 14px;
  background: color-mix(in srgb, #ef4444 10%, transparent);
  border: 1px solid color-mix(in srgb, #ef4444 30%, transparent);
  border-radius: 8px;
  font-size: 13px;
  color: #dc2626;
  line-height: 1.5;
}

.error-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 1px;
}

.login-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 11px 20px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  background: var(--vp-c-brand-1);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s, opacity 0.2s;
  margin-top: 4px;
}

.login-button:hover:not(:disabled) {
  background: var(--vp-c-brand-2);
}

.login-button:active:not(:disabled) {
  transform: scale(0.98);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
