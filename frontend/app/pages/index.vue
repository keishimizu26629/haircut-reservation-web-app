<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 認証確認中のローディング -->
    <div v-if="authStore.isLoading" class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">認証状態を確認中...</p>
      </div>
    </div>

    <!-- 認証済みの場合のみカレンダーを表示 -->
    <CalendarGrid v-else-if="authStore.isAuthenticated" />

    <!-- 認証エラーの場合 -->
    <div v-else class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <p class="text-red-600">認証が必要です</p>
        <button @click="$router.push('/login')" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          ログインページへ
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'

// 認証ストア
const authStore = useAuthStore()

definePageMeta({
  title: 'カレンダー予約管理',
  layout: 'default',
  // middleware: ['auth'], // 一時的に無効化してページレベルで制御
  ssr: false
})

useHead({
  title: 'カレンダー予約管理 | 美容室予約システム',
  meta: [
    { name: 'description', content: '美容室の予約をカレンダーで管理するシンプルなシステム' }
  ]
})

// 認証状態の監視
onMounted(async () => {
  console.log('🔒 Index page: Checking auth state')
  const isAuthenticated = await authStore.checkAuthState()

  // 未認証の場合はログインページにリダイレクト
  if (!isAuthenticated) {
    console.log('🔒 Index page: User not authenticated, redirecting to login')
    await navigateTo('/login')
  }
})
</script>
