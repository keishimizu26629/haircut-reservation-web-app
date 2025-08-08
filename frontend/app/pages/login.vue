<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">
    <div class="mx-auto w-full max-w-md">
      <!-- ヘッダー -->
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">
          美容室予約システム
        </h1>
        <p class="text-gray-600">スタッフログイン</p>
      </div>

      <!-- ログインフォーム -->
      <div class="bg-white shadow-lg rounded-lg px-6 py-8">
        <form @submit.prevent="handleLogin" class="space-y-4">
          <!-- エラーメッセージ -->
          <div v-if="errorMessage" class="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
            {{ errorMessage }}
          </div>

          <!-- メールアドレス -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="メールアドレスを入力"
            />
          </div>

          <!-- パスワード -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
              パスワード
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="パスワードを入力"
            />
          </div>

          <!-- ログインボタン -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="loading">ログイン中...</span>
            <span v-else>ログイン</span>
          </button>
        </form>

        <!-- 新規登録リンク -->
        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600">
            アカウントをお持ちでない方は
            <NuxtLink to="/register" class="text-blue-600 hover:text-blue-500 font-medium">
              新規登録
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useAuth } from '../composables/useAuth'

definePageMeta({
  layout: 'auth',
  middleware: 'guest'
})

useHead({
  title: 'ログイン - 美容室予約システム'
})

const { signInWithEmailAndPassword } = useAuth()

const loading = ref(false)
const errorMessage = ref('')

const form = reactive({
  email: '',
  password: ''
})

const handleLogin = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    await signInWithEmailAndPassword(form.email, form.password)
    await navigateTo('/')
  } catch (error) {
    console.error('ログインエラー:', error)
    errorMessage.value = getErrorMessage(error.code)
  } finally {
    loading.value = false
  }
}

const getErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'このメールアドレスで登録されたアカウントが見つかりません'
    case 'auth/wrong-password':
      return 'パスワードが正しくありません'
    case 'auth/invalid-email':
      return 'メールアドレスの形式が正しくありません'
    case 'auth/too-many-requests':
      return 'ログイン試行回数が多すぎます。しばらく時間をおいてから再試行してください'
    default:
      return 'ログインに失敗しました。もう一度お試しください'
  }
}
</script>
