<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
      <p class="mt-4 text-gray-600">
        認証状態を確認中...
      </p>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  ssr: false
})

const authStore = useAuthStore()

onMounted(async () => {
  console.log('🔒 Root page: Checking auth state')
  const isAuthenticated = await authStore.checkAuthState()

  if (isAuthenticated) {
    console.log('🔒 Root page: User authenticated, redirecting to calendar')
    await navigateTo('/calendar')
  } else {
    console.log('🔒 Root page: User not authenticated, redirecting to login')
    await navigateTo('/login')
  }
})
</script>
