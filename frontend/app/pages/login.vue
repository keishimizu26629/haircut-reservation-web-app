<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">
    <div class="mx-auto w-full max-w-md">
      <!-- ヘッダー -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          美容室予約システム
        </h1>
        <p class="text-gray-600">
          スタッフログイン
        </p>
      </div>

      <!-- ログインフォーム -->
      <div class="bg-white shadow rounded-lg px-6 py-8">
        <form
          class="space-y-6"
          @submit.prevent="handleLogin"
        >
          <!-- エラーメッセージ -->
          <div
            v-if="errorMessage"
            class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded"
          >
            {{ errorMessage }}
          </div>

          <!-- メールアドレス -->
          <div>
            <label
              for="email"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              メールアドレス
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="メールアドレスを入力"
            >
          </div>

          <!-- パスワード -->
          <div>
            <label
              for="password"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              パスワード
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="パスワードを入力"
            >
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
        <!--
        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600">
            アカウントをお持ちでない方は
            <NuxtLink
              to="/register"
              class="text-blue-600 hover:text-blue-500 font-medium"
            >
              新規登録
            </NuxtLink>
          </p>
        </div>
        -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { signInWithEmailAndPassword } from 'firebase/auth'
import { getAuth } from 'firebase/auth'

definePageMeta({
  layout: 'auth',
  ssr: false
})

useHead({
  title: 'ログイン - 美容室予約システム'
})

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
    console.log('🔐 Starting login process...')
    console.log('🔐 Login timestamp:', new Date().toISOString())
    console.log('🔐 Form data:', { email: form.email, passwordLength: form.password.length })

    const auth = getAuth()
    console.log('🔐 Auth instance obtained:', !!auth)

    // 認証永続化を確実にする（Docker環境対応）
    try {
      const { setPersistence, browserLocalPersistence } = await import('firebase/auth')
      await setPersistence(auth, browserLocalPersistence)
      console.log('🔐 Auth persistence confirmed for login')
    } catch (persistenceError) {
      console.warn('🔐 Auth persistence warning:', persistenceError)
    }

    console.log('🔐 Attempting login with:', form.email)
    const userCredential = await signInWithEmailAndPassword(auth, form.email, form.password)

    console.log('🔐 Login successful:', userCredential.user.uid)

            // AuthStoreの状態を更新
    const authStore = useAuthStore()
    authStore.setUser(userCredential.user)

    // セッション活動記録を更新（重要！）
    localStorage.setItem('lastActivity', Date.now().toString())
    console.log('🔐 Session activity updated:', Date.now())

    // 認証状態の完全な同期を確認
    await authStore.checkAuthState()

    // Firebase Authの認証状態が更新されるまで少し待機
    // 本番環境では同期により時間がかかることがある
    const syncWaitTime = import.meta.env.PROD ? 2000 : 1000
    console.log(`🔐 Waiting for Firebase auth sync... (${syncWaitTime}ms)`)
    await new Promise(resolve => setTimeout(resolve, syncWaitTime))

    // Firebase Authの認証状態を確認
    const currentUser = auth.currentUser
    console.log('🔐 Firebase auth state:', {
      user: !!currentUser,
      uid: currentUser?.uid
    })

    console.log('🔐 AuthStore updated, redirecting to calendar...')
    // メインページにリダイレクト（認証ミドルウェアが適切に処理）
    await navigateTo('/')
  } catch (error) {
    console.error('🔐 Login error:', error)
    errorMessage.value = getErrorMessage(error.code)
  } finally {
    loading.value = false
  }
}

const getErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'メールアドレスが見つかりません'
    case 'auth/wrong-password':
      return 'パスワードが正しくありません'
    case 'auth/invalid-email':
      return 'メールアドレスの形式が正しくありません'
    case 'auth/user-disabled':
      return 'このアカウントは無効化されています'
    default:
      return 'ログインに失敗しました。もう一度お試しください。'
  }
}
</script>
