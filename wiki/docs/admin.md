---
layout: page
title: 관리자
sidebar: false
aside: false
---

<script setup>
import { onMounted, onUnmounted } from 'vue'

onMounted(() => {
  document.documentElement.classList.add('admin-mode')
})
onUnmounted(() => {
  document.documentElement.classList.remove('admin-mode')
})
</script>

<style>
html.admin-mode .VPNav,
html.admin-mode .VPNavBar,
html.admin-mode .VPSidebar,
html.admin-mode .VPFooter,
html.admin-mode .VPLocalNav { display: none !important; }
html.admin-mode .VPContent { padding-top: 0 !important; }
html.admin-mode .VPContent .container { max-width: 100% !important; width: 100% !important; }
html.admin-mode .VPPage { padding: 0 !important; }
html.admin-mode main { margin: 0 !important; padding: 0 !important; }
html.admin-mode body { overflow: hidden; }
</style>

<AdminPage />
