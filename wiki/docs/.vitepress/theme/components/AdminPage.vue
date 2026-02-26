<template>
  <AdminLogin v-if="!authenticated" @login-success="onLogin" />
  <AdminEditor v-else :token="token" @logout="logout" />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AdminLogin from './AdminLogin.vue'
import AdminEditor from './AdminEditor.vue'

const authenticated = ref(false)
const token = ref('')

function onLogin(t) {
  token.value = t
  authenticated.value = true
}

function logout() {
  token.value = ''
  authenticated.value = false
  localStorage.removeItem('admin_token')
}

onMounted(() => {
  const saved = localStorage.getItem('admin_token')
  if (saved) {
    // Validate token by trying a quick API call
    fetch('http://localhost:3001/api/files', {
      headers: { Authorization: `Bearer ${saved}` }
    }).then(res => {
      if (res.ok) {
        token.value = saved
        authenticated.value = true
      } else {
        localStorage.removeItem('admin_token')
      }
    }).catch(() => {
      localStorage.removeItem('admin_token')
    })
  }
})
</script>
