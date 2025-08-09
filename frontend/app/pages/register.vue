<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">
    <div class="mx-auto w-full max-w-md">
      <!-- ヘッダー -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          美容室予約システム
        </h1>
        <p class="text-gray-600">新規アカウント作成</p>
      </div>

      <!-- 登録フォーム -->
      <div class="bg-white shadow rounded-lg px-6 py-8">
        <form @submit.prevent="handleRegister" class="space-y-6">
          <!-- エラーメッセージ -->
          <div v-if="errorMessage" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {{ errorMessage }}
          </div>

          <!-- 名前 -->
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
              お名前
            </label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="お名前を入力"
            />
          </div>

          <!-- メールアドレス -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="メールアドレスを入力"
            />
          </div>

          <!-- パスワード -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
              パスワード
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              minlength="6"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="パスワードを入力（6文字以上）"
            />
          </div>

          <!-- パスワード確認 -->
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
              パスワード確認
            </label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="パスワードを再入力"
            />
          </div>

          <!-- 利用規約同意 -->
          <div class="flex items-start">
            <input
              id="acceptTerms"
              v-model="form.acceptTerms"
              type="checkbox"
              required
              class="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label for="acceptTerms" class="ml-2 block text-sm text-gray-700">
              利用規約に同意します
            </label>
          </div>

          <!-- 登録ボタン -->
          <button
            type="submit"
            :disabled="loading || !isFormValid"
            class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="loading">登録中...</span>
            <span v-else>アカウント作成</span>
          </button>
        </form>

        <!-- ログインリンク -->
        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600">
            すでにアカウントをお持ちの方は
            <NuxtLink to="/login" class="text-blue-600 hover:text-blue-500 font-medium">
              ログイン
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { getFirebaseInstances } from '../stores/auth'

definePageMeta({
  layout: 'auth',
  ssr: false
})

useHead({
  title: '新規登録 - 美容室予約システム'
})

const loading = ref(false)
const errorMessage = ref('')

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false
})

const isFormValid = computed(() => {
  return form.name.trim().length > 0 &&
         form.email.trim().length > 0 &&
         form.password.length >= 6 &&
         form.password === form.confirmPassword &&
         form.acceptTerms
})

const handleRegister = async () => {
  if (!isFormValid.value) {
    errorMessage.value = '入力内容を確認してください'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    console.log('🔐 Starting registration process...')
    const { auth, firestore } = getFirebaseInstances()

    // ユーザー作成
    console.log('🔐 Creating user with email and password...')
    const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password)
    const user = userCredential.user
    console.log('🔐 User created:', user.uid)

    // プロフィール更新
    console.log('🔐 Updating user profile...')
    await updateProfile(user, {
      displayName: form.name
    })

    // Firestoreにユーザー情報を保存
    console.log('🔐 Saving user data to Firestore...')
    await setDoc(doc(firestore, 'users', user.uid), {
      displayName: form.name, // Firestoreルールで要求されるフィールド
      email: form.email,
      role: 'admin', // MVPでは全員admin
      createdAt: new Date()
    })

    console.log('🔐 Registration completed successfully')

    // AuthStoreの状態を更新
    const authStore = useAuthStore()
    authStore.setUser(user)

    // セッション活動記録を更新（重要！）
    localStorage.setItem('lastActivity', Date.now().toString())
    console.log('🔐 Session activity updated:', Date.now())

    // 認証状態の完全な同期を確認
    await authStore.checkAuthState()

    // VueFireの認証状態が更新されるまで少し待機
    console.log('🔐 Waiting for VueFire auth sync...')
    await new Promise(resolve => setTimeout(resolve, 500))

    // VueFireの認証状態を確認
    const { getCurrentUser } = await import('vuefire')
    const vueFireUser = await getCurrentUser()
    console.log('🔐 VueFire auth state:', {
      user: !!vueFireUser,
      uid: vueFireUser?.uid
    })

    // 登録成功後、カレンダーページへ
    console.log('🔐 Redirecting to calendar...')
    await navigateTo('/calendar')
  } catch (error) {
    console.error('🔐 Registration error:', error)
    errorMessage.value = getErrorMessage(error.code)
  } finally {
    loading.value = false
  }
}

const getErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'このメールアドレスは既に使用されています'
    case 'auth/invalid-email':
      return 'メールアドレスの形式が正しくありません'
    case 'auth/weak-password':
      return 'パスワードが弱すぎます。6文字以上で入力してください'
    case 'auth/operation-not-allowed':
      return 'メール/パスワード認証が無効化されています'
    default:
      return '登録に失敗しました。もう一度お試しください。'
  }
}
</script>
