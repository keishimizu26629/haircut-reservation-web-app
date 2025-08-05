<template>
  <div class="login-page">
    <!-- モダンログイン画面メインコンテナ -->
    <div class="login-container">
      <!-- ロゴ・ヘッダー部分 -->
      <div class="login-header">
        <div class="brand-logo">
          <i class="bi bi-scissors" aria-hidden="true"></i>
        </div>
        <h1 class="brand-title">
          美容室予約システム
        </h1>
        <p class="brand-subtitle">
          アカウントにログイン
        </p>
      </div>

      <!-- メインログインフォーム -->
      <div class="login-form-card">
        <form @submit.prevent="handleLogin" novalidate>
          <!-- メールアドレス入力 -->
          <div class="form-field">
            <label
              for="email"
              class="form-label"
              :class="{ 'error': errors.email }"
            >
              <i class="bi bi-envelope" aria-hidden="true"></i>
              メールアドレス
            </label>
            <div class="form-input-wrapper">
              <input
                id="email"
                v-model="form.email"
                type="email"
                autocomplete="email"
                class="form-input"
                :class="{ 'error': errors.email }"
                placeholder="メールアドレスを入力してください"
                :aria-invalid="!!errors.email"
                :aria-describedby="errors.email ? 'email-error' : undefined"
                @input="clearFieldError('email')"
                @blur="validateField('email')"
              >
              <i
                class="form-icon bi bi-envelope"
                :class="{ 'error': errors.email }"
                aria-hidden="true"
              ></i>
            </div>
            <transition name="error-slide">
              <div
                v-if="errors.email"
                id="email-error"
                class="form-error"
                role="alert"
                aria-live="polite"
              >
                <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
                {{ errors.email }}
              </div>
            </transition>
          </div>

          <!-- パスワード入力 -->
          <div class="form-field">
            <label
              for="password"
              class="form-label"
              :class="{ 'error': errors.password }"
            >
              <i class="bi bi-lock" aria-hidden="true"></i>
              パスワード
            </label>
            <div class="form-input-wrapper">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                class="form-input"
                :class="{ 'error': errors.password }"
                placeholder="パスワードを入力"
                :aria-invalid="!!errors.password"
                :aria-describedby="errors.password ? 'password-error' : undefined"
                @input="clearFieldError('password')"
                @blur="validateField('password')"
              >
              <i
                class="form-icon bi bi-lock"
                :class="{ 'error': errors.password }"
                aria-hidden="true"
              ></i>
              <button
                type="button"
                class="password-toggle"
                :aria-label="showPassword ? 'パスワードを隠す' : 'パスワードを表示'"
                @click="togglePasswordVisibility"
              >
                <i
                  :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"
                  aria-hidden="true"
                ></i>
              </button>
            </div>
            <transition name="error-slide">
              <div
                v-if="errors.password"
                id="password-error"
                class="form-error"
                role="alert"
                aria-live="polite"
              >
                <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
                {{ errors.password }}
              </div>
            </transition>
          </div>

          <!-- Remember Me チェックボックス -->
          <div class="form-options">
            <label class="remember-checkbox">
              <input
                id="remember"
                v-model="form.remember"
                type="checkbox"
              >
              <span>ログイン状態を保持</span>
            </label>
            <NuxtLink
              to="/forgot-password"
              class="forgot-password-link"
            >
              パスワードを忘れた方
            </NuxtLink>
          </div>

          <!-- グローバルエラーメッセージ -->
          <transition name="error-slide">
            <div
              v-if="authError"
              class="global-error"
              role="alert"
              aria-live="assertive"
            >
              <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
              <div>
                <h4>ログインエラー</h4>
                <p>{{ authError }}</p>
              </div>
            </div>
          </transition>

          <!-- ログインボタン -->
          <button
            type="submit"
            class="login-button"
            :disabled="loading || !isFormValid"
            :aria-label="loading ? 'ログイン中...' : 'ログイン'"
          >
            <span v-if="loading">
              <svg class="loading-spinner" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" aria-hidden="true">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              ログイン中...
            </span>
            <span v-else>
              <i class="bi bi-box-arrow-in-right" aria-hidden="true"></i>
              ログイン
            </span>
          </button>
        </form>

        <!-- 区切り線 -->
        <div class="form-divider">
          <span>または</span>
        </div>

        <!-- Googleログインボタン -->
        <button
          @click="signInWithGoogle"
          class="google-login-button"
          :disabled="loading"
          :aria-label="loading ? 'Googleログイン中...' : 'Googleでログイン'"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Googleでログイン
        </button>

        <!-- 新規登録リンク -->
        <div class="signup-link">
          <p>
            アカウントをお持ちでない方は
            <NuxtLink to="/register">
              新規登録
            </NuxtLink>
          </p>
        </div>
      </div>

      <!-- フッター -->
      <div class="login-footer">
        <p>© 2025 美容室予約システム. All rights reserved.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useHead } from 'nuxt/app'
import { useAuthStore } from '../stores/auth'
import { useLoginRedirect } from '../composables/useAuthRedirect'

// Layout設定
definePageMeta({
  layout: 'auth',
  middleware: 'guest'
} as any)

// SEO設定
useHead({
  title: 'ログイン - 美容室予約システム',
  meta: [
    { name: 'description', content: '美容室予約システムにログインして、便利な予約管理機能をご利用ください。' },
    { name: 'robots', content: 'noindex' }
  ]
})

// =====================================
// Reactive State
// =====================================

const authStore = useAuthStore()
const { onLoginSuccess, onLoginError } = useLoginRedirect()
const loading = ref(false)
const authError = ref('')
const showPassword = ref(false)

const form = reactive({
  email: '',
  password: '',
  remember: false
})

const errors = reactive({
  email: '',
  password: ''
})

// =====================================
// Computed Properties
// =====================================

const isFormValid = computed(() => {
  return form.email.length > 0 &&
         form.password.length >= 6 &&
         !errors.email &&
         !errors.password
})

// =====================================
// Validation Functions
// =====================================

const validateEmail = (email: string): string => {
  if (!email) {
    return 'メールアドレスは必須です'
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return 'メールアドレスの形式が正しくありません'
  }

  return ''
}

const validatePassword = (password: string): string => {
  if (!password) {
    return 'パスワードは必須です'
  }

  if (password.length < 6) {
    return 'パスワードは8文字以上で入力してください'
  }

  return ''
}

const validateField = (field: 'email' | 'password') => {
  if (field === 'email') {
    errors.email = validateEmail(form.email)
  } else if (field === 'password') {
    errors.password = validatePassword(form.password)
  }
}

const clearFieldError = (field: 'email' | 'password') => {
  if (field === 'email') {
    errors.email = ''
  } else if (field === 'password') {
    errors.password = ''
  }

  // グローバルエラーもクリア
  if (authError.value) {
    authError.value = ''
  }
}

const validateForm = (): boolean => {
  errors.email = validateEmail(form.email)
  errors.password = validatePassword(form.password)

  return !errors.email && !errors.password
}

// =====================================
// UI Functions
// =====================================

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

// =====================================
// Authentication Functions
// =====================================

const handleLogin = async () => {
  // フォーム検証
  if (!validateForm()) {
    return
  }

  loading.value = true
  authError.value = ''

  try {
    const userCredential = await authStore.signInWithEmail(form.email, form.password)

    // ログイン状態保持の設定
    if (form.remember) {
      // Remember me 機能の実装（永続化）
      localStorage.setItem('rememberLogin', 'true')
    }

    // 認証成功後の自動リダイレクト処理
    await onLoginSuccess(userCredential.user)

  } catch (error: any) {
    // 認証エラー処理とユーザーフレンドリーメッセージ表示
    onLoginError(error)

    // ローカルエラー表示用
    let errorMessage = 'ログインに失敗しました。もう一度お試しください。'

    if (error.code) {
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'このメールアドレスで登録されたアカウントが見つかりません。'
          break
        case 'auth/wrong-password':
          errorMessage = 'パスワードが正しくありません。'
          break
        case 'auth/invalid-email':
          errorMessage = 'メールアドレスの形式が正しくありません。'
          break
        case 'auth/user-disabled':
          errorMessage = 'このアカウントは無効化されています。'
          break
        case 'auth/too-many-requests':
          errorMessage = 'ログイン試行回数が多すぎます。しばらく時間をおいてからお試しください。'
          break
        case 'auth/network-request-failed':
          errorMessage = 'ネットワークエラー。インターネット接続を確認してください。'
          break
        default:
          errorMessage = error.message || errorMessage
      }
    }

    authError.value = errorMessage

  } finally {
    loading.value = false
  }
}

const signInWithGoogle = async () => {
  loading.value = true
  authError.value = ''

  try {
    const userCredential = await authStore.signInWithGoogle()
    await onLoginSuccess(userCredential.user)

  } catch (error: any) {
    console.error('Google sign-in error:', error)

    let errorMessage = 'Googleログインに失敗しました。もう一度お試しください。'

    if (error.code) {
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'ログインがキャンセルされました。'
          break
        case 'auth/popup-blocked':
          errorMessage = 'ポップアップがブロックされました。ブラウザの設定を確認してください。'
          break
        case 'auth/network-request-failed':
          errorMessage = 'ネットワークエラー。インターネット接続を確認してください。'
          break
        default:
          errorMessage = error.message || errorMessage
      }
    }

    authError.value = errorMessage

  } finally {
    loading.value = false
  }
}

// =====================================
// Lifecycle
// =====================================

onMounted(() => {
  // Remember me の状態復元
  const shouldRemember = localStorage.getItem('rememberLogin')
  if (shouldRemember) {
    form.remember = true
  }

  // フォーカスの初期設定（アクセシビリティ）
  nextTick(() => {
    const emailInput = document.getElementById('email')
    if (emailInput) {
      emailInput.focus()
    }
  })
})
</script>

<style scoped>
/* =====================================
   ログイン画面 - デザインシステム統合
   ===================================== */

.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--neutral-0) 50%, var(--secondary-50) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}

.login-container {
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: var(--space-8);
}

.brand-logo {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, var(--primary-600) 0%, var(--secondary-600) 100%);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-4);
  box-shadow: var(--shadow-lg);
}

.brand-logo i {
  color: var(--neutral-0);
  font-size: var(--font-size-2xl);
}

.brand-title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--neutral-800);
  margin-bottom: var(--space-2);
}

.brand-subtitle {
  color: var(--neutral-600);
  font-size: var(--font-size-base);
}

.login-form-card {
  background: var(--neutral-0);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-xl);
  padding: var(--space-8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* フォーム要素のスタイリング */
.form-field {
  margin-bottom: var(--space-6);
}

.form-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--neutral-700);
  margin-bottom: var(--space-2);
}

.form-label.error {
  color: var(--error-600);
}

.form-input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  padding: var(--space-3) var(--space-4) var(--space-3) var(--space-12);
  border: 2px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  font-size: var(--font-size-base);
  transition: all var(--transition-base);
  background: var(--neutral-0);
}

.form-input:hover {
  border-color: var(--neutral-300);
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 4px var(--primary-100);
}

.form-input.error {
  border-color: var(--error-300);
  background: var(--error-50);
  color: var(--error-800);
}

.form-input.error:focus {
  box-shadow: 0 0 0 4px var(--error-100);
}

.form-icon {
  position: absolute;
  left: var(--space-4);
  top: 50%;
  transform: translateY(-50%);
  color: var(--neutral-400);
  font-size: var(--font-size-base);
}

.form-icon.error {
  color: var(--error-400);
}

.password-toggle {
  position: absolute;
  right: var(--space-4);
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--neutral-400);
  cursor: pointer;
  padding: var(--space-1);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.password-toggle:hover {
  color: var(--neutral-600);
}

.password-toggle:focus {
  outline: none;
  color: var(--primary-600);
  box-shadow: 0 0 0 2px var(--primary-200);
}

.form-error {
  margin-top: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--error-50);
  border: 1px solid var(--error-200);
  border-radius: var(--radius-lg);
  color: var(--error-600);
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: calc(-1 * var(--space-2)) 0 var(--space-6);
}

.remember-checkbox {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.remember-checkbox input {
  width: var(--space-4);
  height: var(--space-4);
  margin-right: var(--space-2);
  border: 2px solid var(--neutral-300);
  border-radius: var(--radius-base);
  transition: all var(--transition-fast);
}

.remember-checkbox input:checked {
  background: var(--primary-500);
  border-color: var(--primary-500);
}

.remember-checkbox input:focus {
  box-shadow: 0 0 0 2px var(--primary-200);
}

.forgot-password-link {
  font-size: var(--font-size-sm);
  color: var(--primary-600);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-fast);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
}

.forgot-password-link:hover {
  color: var(--primary-800);
  text-decoration: underline;
}

.forgot-password-link:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--primary-200);
}

.global-error {
  margin-bottom: var(--space-6);
  padding: var(--space-4);
  background: var(--error-50);
  border: 1px solid var(--error-200);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
}

.global-error i {
  color: var(--error-600);
  font-size: var(--font-size-lg);
  margin-top: 2px;
  flex-shrink: 0;
}

.global-error h4 {
  color: var(--error-800);
  font-weight: var(--font-weight-semibold);
  margin: 0 0 var(--space-1) 0;
  font-size: var(--font-size-sm);
}

.global-error p {
  color: var(--error-700);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
  margin: 0;
}

.login-button {
  width: 100%;
  background: linear-gradient(135deg, var(--primary-600) 0%, var(--secondary-600) 100%);
  color: var(--neutral-0);
  border: none;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-xl);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-lg);
  margin-bottom: var(--space-4);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

.login-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-xl);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.form-divider {
  position: relative;
  margin: var(--space-6) 0;
  text-align: center;
}

.form-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--neutral-200);
}

.form-divider span {
  background: var(--neutral-0);
  padding: 0 var(--space-4);
  color: var(--neutral-500);
  font-size: var(--font-size-sm);
}

.google-login-button {
  width: 100%;
  background: var(--neutral-0);
  border: 2px solid var(--neutral-200);
  color: var(--neutral-700);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-xl);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--space-6);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
}

.google-login-button:hover:not(:disabled) {
  background: var(--neutral-50);
  border-color: var(--neutral-300);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.google-login-button:active:not(:disabled) {
  transform: translateY(0);
}

.google-login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.signup-link {
  text-align: center;
}

.signup-link p {
  color: var(--neutral-600);
  margin: 0 0 var(--space-2) 0;
  font-size: var(--font-size-sm);
}

.signup-link a {
  color: var(--primary-600);
  text-decoration: none;
  font-weight: var(--font-weight-semibold);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  display: inline-block;
}

.signup-link a:hover {
  background: var(--neutral-50);
  text-decoration: none;
}

.signup-link a:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--primary-200);
}

.login-footer {
  text-align: center;
  margin-top: var(--space-8);
  color: var(--neutral-500);
  font-size: var(--font-size-sm);
}

/* アニメーション */
.error-slide-enter-active,
.error-slide-leave-active {
  transition: all var(--transition-base);
}

.error-slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.error-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* ローディングアニメーション */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

/* レスポンシブ対応 */
@media (max-width: 576px) {
  .login-page {
    padding: var(--space-2);
  }

  .login-form-card {
    padding: var(--space-6);
  }

  .form-options {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
  }

  .forgot-password-link {
    align-self: flex-end;
  }

  .brand-title {
    font-size: var(--font-size-2xl);
  }
}

/* ダークモード対応 */
@media (prefers-color-scheme: dark) {
  .login-form-card {
    background: var(--neutral-900);
    border-color: var(--neutral-700);
  }

  .form-divider::before {
    background: var(--neutral-700);
  }

  .form-divider span {
    background: var(--neutral-900);
  }

  .google-login-button {
    background: var(--neutral-800);
    border-color: var(--neutral-600);
    color: var(--neutral-200);
  }

  .google-login-button:hover:not(:disabled) {
    background: var(--neutral-700);
    border-color: var(--neutral-500);
  }
}

/* アクセシビリティ強化 */
@media (prefers-reduced-motion: reduce) {
  .login-button,
  .google-login-button,
  .form-input {
    transition: none;
  }

  .error-slide-enter-active,
  .error-slide-leave-active {
    transition: opacity var(--transition-fast);
  }

  .error-slide-enter-from,
  .error-slide-leave-to {
    transform: none;
  }
}

@media (prefers-contrast: high) {
  .form-input {
    border-width: 2px;
  }

  .login-button,
  .google-login-button {
    border: 2px solid var(--neutral-800);
  }
}
</style>
