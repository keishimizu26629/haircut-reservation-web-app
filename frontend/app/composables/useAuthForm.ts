/**
 * 認証フォーム用 Composable
 * ログイン・登録フォームで共通する機能を提供
 */

import { useAuthStore } from '~/stores/auth'
import { useFormValidation, validators } from '~/composables/useFormValidation'

// =====================================
// Types
// =====================================

export interface LoginFormData {
  email: string
  password: string
  remember: boolean
}

export interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  displayName: string
  terms: boolean
}

export interface AuthFormReturn<T> {
  formData: Ref<T>
  errors: Ref<Record<string, string>>
  isValid: ComputedRef<boolean>
  isLoading: Ref<boolean>
  globalError: Ref<string>
  showPassword: Ref<boolean>
  validate: (field?: string) => Promise<boolean>
  validateAll: () => Promise<boolean>
  clearError: (field: string) => void
  togglePasswordVisibility: () => void
  handleSubmit: () => Promise<void>
  reset: () => void
}

// =====================================
// useLoginForm Composable
// =====================================

export function useLoginForm(): AuthFormReturn<LoginFormData> {
  const authStore = useAuthStore()
  const router = useRouter()

  // フォームデータ
  const formData = ref<LoginFormData>({
    email: '',
    password: '',
    remember: false
  })

  // バリデーションスキーマ
  const validationSchema = {
    email: [
      validators.required('メールアドレスは必須です'),
      validators.email('有効なメールアドレスを入力してください')
    ],
    password: [
      validators.required('パスワードは必須です'),
      validators.minLength(6, 'パスワードは6文字以上で入力してください')
    ]
  }

  // バリデーション機能
  const {
    errors,
    isValid,
    validate,
    validateAll,
    clearError,
    reset: resetValidation
  } = useFormValidation(formData, validationSchema)

  // 状態管理
  const isLoading = ref(false)
  const globalError = ref('')
  const showPassword = ref(false)

  // パスワード表示切り替え
  const togglePasswordVisibility = () => {
    showPassword.value = !showPassword.value
  }

  // フォーム送信処理
  const handleSubmit = async () => {
    // グローバルエラーをクリア
    globalError.value = ''

    // バリデーション実行
    const isValidForm = await validateAll()
    if (!isValidForm) {
      return
    }

    isLoading.value = true

    try {
      // ログイン実行
      await authStore.signInWithEmail(formData.value.email, formData.value.password)

      // Remember me 設定保存
      if (formData.value.remember) {
        localStorage.setItem('rememberLogin', 'true')
        // セッション期限を延長
        authStore.extendSession()
      } else {
        localStorage.removeItem('rememberLogin')
      }

      // 成功時のリダイレクト
      await router.push('/dashboard')

    } catch (error: any) {
      console.error('Login error:', error)
      globalError.value = error.message || 'ログインに失敗しました'
    } finally {
      isLoading.value = false
    }
  }

  // Google ログイン
  const handleGoogleLogin = async () => {
    isLoading.value = true
    globalError.value = ''

    try {
      await authStore.signInWithGoogle()
      await router.push('/dashboard')
    } catch (error: any) {
      console.error('Google login error:', error)
      globalError.value = error.message || 'Googleログインに失敗しました'
    } finally {
      isLoading.value = false
    }
  }

  // フォームリセット
  const reset = () => {
    formData.value = {
      email: '',
      password: '',
      remember: false
    }
    resetValidation()
    globalError.value = ''
    showPassword.value = false
    isLoading.value = false
  }

  // Remember me 状態復元
  onMounted(() => {
    const shouldRemember = localStorage.getItem('rememberLogin')
    if (shouldRemember) {
      formData.value.remember = true
    }
  })

  return {
    formData,
    errors,
    isValid,
    isLoading,
    globalError,
    showPassword,
    validate,
    validateAll,
    clearError,
    togglePasswordVisibility,
    handleSubmit,
    handleGoogleLogin,
    reset
  }
}

// =====================================
// useRegisterForm Composable
// =====================================

export function useRegisterForm(): AuthFormReturn<RegisterFormData> {
  const authStore = useAuthStore()
  const router = useRouter()

  // フォームデータ
  const formData = ref<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    terms: false
  })

  // バリデーションスキーマ
  const validationSchema = {
    email: [
      validators.required('メールアドレスは必須です'),
      validators.email('有効なメールアドレスを入力してください')
    ],
    password: [
      validators.required('パスワードは必須です'),
      validators.minLength(8, 'パスワードは8文字以上で入力してください'),
      validators.strongPassword('パスワードは大文字・小文字・数字を含む必要があります')
    ],
    confirmPassword: [
      validators.required('パスワード確認は必須です'),
      validators.custom(
        (value: string) => value === formData.value.password,
        'パスワードが一致しません'
      )
    ],
    displayName: [
      validators.required('表示名は必須です'),
      validators.minLength(2, '表示名は2文字以上で入力してください'),
      validators.maxLength(50, '表示名は50文字以下で入力してください')
    ],

    terms: [
      validators.custom(
        (value: boolean) => value === true,
        '利用規約への同意が必要です'
      )
    ]
  }

  // バリデーション機能
  const {
    errors,
    isValid,
    validate,
    validateAll,
    clearError,
    reset: resetValidation
  } = useFormValidation(formData, validationSchema)

  // 状態管理
  const isLoading = ref(false)
  const globalError = ref('')
  const showPassword = ref(false)

  // パスワード表示切り替え
  const togglePasswordVisibility = () => {
    showPassword.value = !showPassword.value
  }

  // パスワード確認フィールドの再バリデーション
  watch(() => formData.value.password, () => {
    if (formData.value.confirmPassword) {
      validate('confirmPassword')
    }
  })

  // フォーム送信処理
  const handleSubmit = async () => {
    globalError.value = ''

    // バリデーション実行
    const isValidForm = await validateAll()
    if (!isValidForm) {
      return
    }

    isLoading.value = true

    try {
      // 新規登録実行
      await authStore.signUpWithEmail(
        formData.value.email,
        formData.value.password,
        {
          displayName: formData.value.displayName
        }
      )

      // 成功時のリダイレクト（メール確認画面等）
      await router.push('/email-verification')

    } catch (error: any) {
      console.error('Registration error:', error)
      globalError.value = error.message || '登録に失敗しました'
    } finally {
      isLoading.value = false
    }
  }

  // Google 登録
  const handleGoogleRegister = async () => {
    isLoading.value = true
    globalError.value = ''

    try {
      await authStore.signInWithGoogle()
      await router.push('/dashboard')
    } catch (error: any) {
      console.error('Google register error:', error)
      globalError.value = error.message || 'Google登録に失敗しました'
    } finally {
      isLoading.value = false
    }
  }

  // フォームリセット
  const reset = () => {
    formData.value = {
      email: '',
      password: '',
      confirmPassword: '',
      displayName: '',
      terms: false
    }
    resetValidation()
    globalError.value = ''
    showPassword.value = false
    isLoading.value = false
  }

  return {
    formData,
    errors,
    isValid,
    isLoading,
    globalError,
    showPassword,
    validate,
    validateAll,
    clearError,
    togglePasswordVisibility,
    handleSubmit,
    handleGoogleRegister,
    reset
  }
}

// =====================================
// usePasswordReset Composable
// =====================================

export function usePasswordReset() {
  const authStore = useAuthStore()

  const formData = ref({
    email: ''
  })

  const validationSchema = {
    email: [
      validators.required('メールアドレスは必須です'),
      validators.email('有効なメールアドレスを入力してください')
    ]
  }

  const {
    errors,
    isValid,
    validate,
    validateAll,
    clearError
  } = useFormValidation(formData, validationSchema)

  const isLoading = ref(false)
  const globalError = ref('')
  const successMessage = ref('')

  const handleSubmit = async () => {
    globalError.value = ''
    successMessage.value = ''

    const isValidForm = await validateAll()
    if (!isValidForm) return

    isLoading.value = true

    try {
      await authStore.sendPasswordReset(formData.value.email)
      successMessage.value = 'パスワードリセットメールを送信しました。メールをご確認ください。'
      formData.value.email = ''
    } catch (error: any) {
      console.error('Password reset error:', error)
      globalError.value = error.message || 'パスワードリセットに失敗しました'
    } finally {
      isLoading.value = false
    }
  }

  return {
    formData,
    errors,
    isValid,
    isLoading,
    globalError,
    successMessage,
    validate,
    clearError,
    handleSubmit
  }
}

// =====================================
// useSessionManagement - セッション管理
// =====================================

export function useSessionManagement() {
  const authStore = useAuthStore()
  const router = useRouter()

  // セッション期限チェック
  const checkSessionExpiry = () => {
    try {
      authStore.checkSessionExpiry()
    } catch (error) {
      console.warn('Session expired:', error)
      router.push('/login')
    }
  }

  // セッション延長
  const extendSession = () => {
    if (authStore.isAuthenticated) {
      authStore.extendSession()

      // localStorage にも保存
      localStorage.setItem('sessionExpiry', authStore.sessionExpiry?.toString() || '')
    }
  }

  // 定期的なセッションチェック（5分間隔）
  let sessionCheckInterval: NodeJS.Timeout | null = null

  const startSessionCheck = () => {
    if (sessionCheckInterval) return

    sessionCheckInterval = setInterval(() => {
      if (authStore.isAuthenticated) {
        checkSessionExpiry()
      }
    }, 5 * 60 * 1000) // 5分
  }

  const stopSessionCheck = () => {
    if (sessionCheckInterval) {
      clearInterval(sessionCheckInterval)
      sessionCheckInterval = null
    }
  }

  // ユーザーアクティビティでセッション延長
  const handleUserActivity = throttle(() => {
    if (authStore.isAuthenticated) {
      extendSession()
    }
  }, 60000) // 1分間に1回まで

  // アクティビティイベントリスナー
  const startActivityTracking = () => {
    if (typeof window !== 'undefined') {
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
      events.forEach(event => {
        document.addEventListener(event, handleUserActivity, { passive: true })
      })
    }
  }

  const stopActivityTracking = () => {
    if (typeof window !== 'undefined') {
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity)
      })
    }
  }

  // クリーンアップ
  onUnmounted(() => {
    stopSessionCheck()
    stopActivityTracking()
  })

  return {
    checkSessionExpiry,
    extendSession,
    startSessionCheck,
    stopSessionCheck,
    startActivityTracking,
    stopActivityTracking
  }
}

// =====================================
// Utility Functions
// =====================================

function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}
