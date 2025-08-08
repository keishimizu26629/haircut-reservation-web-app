<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { useHead } from 'nuxt/app'
import { useAuthStore } from './stores/auth'

// 認証ストア初期化
const authStore = useAuthStore()

// アプリ起動時に認証状態を初期化
onMounted(async () => {
  console.log('🚀 App: Initializing auth state')
  await authStore.checkAuthState()
})

// Meta設定
useHead({
  title: 'Beauty Salon Reservation System',
  meta: [
    { name: 'description', content: '美容院の予約システム' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
  ]
})
</script>
