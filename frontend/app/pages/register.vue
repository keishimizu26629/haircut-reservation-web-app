<template>
  <div class="register-page">
    <!-- モダン登録画面メインコンテナ -->
    <div class="register-container">
      <!-- ロゴ・ヘッダー部分 -->
      <div class="register-header">
        <div class="brand-logo">
          <i
            class="bi bi-scissors"
            aria-hidden="true"
          />
        </div>
        <h1 class="brand-title">
          ヘアカット予約システム
        </h1>
        <p class="brand-subtitle">
          新規アカウント作成
        </p>
      </div>

      <!-- メイン登録フォーム -->
      <div class="register-form-card">
        <form
          novalidate
          @submit.prevent="handleRegister"
        >
          <!-- お名前入力 -->
          <div class="form-field">
            <label
              for="name"
              class="form-label"
              :class="{ 'error': errors.name }"
            >
              <i
                class="bi bi-person"
                aria-hidden="true"
              />
              お名前
            </label>
            <div class="form-input-wrapper">
              <input
                id="name"
                v-model="form.name"
                type="text"
                autocomplete="name"
                class="form-input"
                :class="{ 'error': errors.name }"
                placeholder="お名前を入力してください"
                :aria-invalid="!!errors.name"
                :aria-describedby="errors.name ? 'name-error' : undefined"
                @input="clearFieldError('name')"
                @blur="validateField('name')"
              >
              <i
                class="form-icon bi bi-person"
                :class="{ 'error': errors.name }"
                aria-hidden="true"
              />
            </div>
            <transition name="error-slide">
              <div
                v-if="errors.name"
                id="name-error"
                class="form-error"
                role="alert"
                aria-live="polite"
              >
                <i
                  class="bi bi-exclamation-triangle"
                  aria-hidden="true"
                />
                {{ errors.name }}
              </div>
            </transition>
          </div>

          <!-- メールアドレス入力 -->
          <div class="form-field">
            <label
              for="email"
              class="form-label"
              :class="{ 'error': errors.email }"
            >
              <i
                class="bi bi-envelope"
                aria-hidden="true"
              />
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
              />
            </div>
            <transition name="error-slide">
              <div
                v-if="errors.email"
                id="email-error"
                class="form-error"
                role="alert"
                aria-live="polite"
              >
                <i
                  class="bi bi-exclamation-triangle"
                  aria-hidden="true"
                />
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
              <i
                class="bi bi-lock"
                aria-hidden="true"
              />
              パスワード
            </label>
            <div class="form-input-wrapper">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                class="form-input"
                :class="{ 'error': errors.password }"
                placeholder="パスワードを入力してください"
                :aria-invalid="!!errors.password"
                :aria-describedby="errors.password ? 'password-error' : undefined"
                @input="clearFieldError('password')"
                @blur="validateField('password')"
              >
              <i
                class="form-icon bi bi-lock"
                :class="{ 'error': errors.password }"
                aria-hidden="true"
              />
              <button
                type="button"
                class="password-toggle"
                :aria-label="showPassword ? 'パスワードを隠す' : 'パスワードを表示'"
                @click="togglePasswordVisibility"
              >
                <i
                  :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"
                  aria-hidden="true"
                />
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
                <i
                  class="bi bi-exclamation-triangle"
                  aria-hidden="true"
                />
                {{ errors.password }}
              </div>
            </transition>
          </div>

          <!-- パスワード確認入力 -->
          <div class="form-field">
            <label
              for="confirmPassword"
              class="form-label"
              :class="{ 'error': errors.confirmPassword }"
            >
              <i
                class="bi bi-lock-fill"
                aria-hidden="true"
              />
              パスワード確認
            </label>
            <div class="form-input-wrapper">
              <input
                id="confirmPassword"
                v-model="form.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                autocomplete="new-password"
                class="form-input"
                :class="{ 'error': errors.confirmPassword }"
                placeholder="パスワードを再入力してください"
                :aria-invalid="!!errors.confirmPassword"
                :aria-describedby="errors.confirmPassword ? 'confirmPassword-error' : undefined"
                @input="clearFieldError('confirmPassword')"
                @blur="validateField('confirmPassword')"
              >
              <i
                class="form-icon bi bi-lock-fill"
                :class="{ 'error': errors.confirmPassword }"
                aria-hidden="true"
              />
              <button
                type="button"
                class="password-toggle"
                :aria-label="showConfirmPassword ? 'パスワードを隠す' : 'パスワードを表示'"
                @click="toggleConfirmPasswordVisibility"
              >
                <i
                  :class="showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"
                  aria-hidden="true"
                />
              </button>
            </div>
            <transition name="error-slide">
              <div
                v-if="errors.confirmPassword"
                id="confirmPassword-error"
                class="form-error"
                role="alert"
                aria-live="polite"
              >
                <i
                  class="bi bi-exclamation-triangle"
                  aria-hidden="true"
                />
                {{ errors.confirmPassword }}
              </div>
            </transition>
          </div>



          <!-- 利用規約同意 -->
          <div class="form-field">
            <label
              class="terms-checkbox"
              :class="{ 'error': errors.acceptTerms }"
            >
              <input
                id="terms"
                v-model="form.acceptTerms"
                type="checkbox"
                :aria-invalid="!!errors.acceptTerms"
                :aria-describedby="errors.acceptTerms ? 'terms-error' : undefined"
                @change="clearFieldError('acceptTerms')"
              >
              <span class="checkmark" />
              <span class="terms-text">
                <a
                  href="/terms"
                  target="_blank"
                  class="terms-link"
                >利用規約</a>
                および
                <a
                  href="/privacy"
                  target="_blank"
                  class="terms-link"
                >プライバシーポリシー</a>
                に同意します
              </span>
            </label>
            <transition name="error-slide">
              <div
                v-if="errors.acceptTerms"
                id="terms-error"
                class="form-error"
                role="alert"
                aria-live="polite"
              >
                <i
                  class="bi bi-exclamation-triangle"
                  aria-hidden="true"
                />
                {{ errors.acceptTerms }}
              </div>
            </transition>
          </div>

          <!-- グローバルエラーメッセージ -->
          <transition name="error-slide">
            <div
              v-if="authError"
              class="global-error"
              role="alert"
              aria-live="assertive"
            >
              <i
                class="bi bi-exclamation-triangle"
                aria-hidden="true"
              />
              <div>
                <h4>登録エラー</h4>
                <p>{{ authError }}</p>
              </div>
            </div>
          </transition>

          <!-- 登録ボタン -->
          <button
            type="submit"
            class="register-button"
            :disabled="loading || !isFormValid"
            :aria-label="loading ? 'アカウント作成中...' : 'アカウントを作成'"
          >
            <span v-if="loading">
              <svg class="loading-spinner" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" aria-hidden="true">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              アカウント作成中...
            </span>
            <span v-else>
                  <i class="bi bi-person-plus" aria-hidden="true" />
              アカウントを作成
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
          :aria-label="loading ? 'Googleアカウント作成中...' : 'Googleでアカウント作成'"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Googleでアカウント作成
        </button>

        <!-- ログインリンク -->
        <div class="login-link">
          <p>
            すでにアカウントをお持ちの方は
            <NuxtLink to="/login">
              ログイン
            </NuxtLink>
          </p>
        </div>
      </div>

      <!-- フッター -->
      <div class="register-footer">
        <p>© 2025 美容室予約システム. All rights reserved.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useHead, navigateTo } from 'nuxt/app'
import { useAuthStore } from '../stores/auth'

// Layout設定
definePageMeta({
  layout: 'auth',
  middleware: 'guest'
})

// SEO設定
useHead({
  title: '新規登録 - 美容室予約システム',
  meta: [
    { name: 'description', content: '美容室予約システムの新規アカウントを作成して、便利な予約管理機能をご利用ください。' },
    { name: 'robots', content: 'noindex' }
  ]
})

// =====================================
// Reactive State
// =====================================

const authStore = useAuthStore()
const loading = ref(false)
const authError = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false
})

const errors = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: ''
})

// =====================================
// Computed Properties
// =====================================

const isFormValid = computed(() => {
  return form.name.trim().length > 0 &&
          form.email.length > 0 &&
          form.password.length >= 6 &&
          form.confirmPassword.length > 0 &&
          form.password === form.confirmPassword &&
          form.acceptTerms &&
          !errors.name &&
          !errors.email &&
          !errors.password &&
          !errors.confirmPassword &&
          !errors.acceptTerms
})

// =====================================
// Validation Functions
// =====================================

const validateName = (name: string): string => {
  if (!name.trim()) {
    return 'お名前は必須です'
  }
  if (name.trim().length < 2) {
    return 'お名前は2文字以上で入力してください'
  }
  return ''
}

const validateEmail = (email: string): string => {
  if (!email) {
    return 'メールアドレスは必須です'
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return '有効なメールアドレスを入力してください'
  }

  return ''
}

const validatePassword = (password: string): string => {
  if (!password) {
    return 'パスワードは必須です'
  }
  if (password.length < 6) {
    return 'パスワードは6文字以上で入力してください'
  }
  if (!/^(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
    return 'パスワードは英字と数字を含む必要があります'
  }
  return ''
}

const validateConfirmPassword = (confirmPassword: string, password: string): string => {
  if (!confirmPassword) {
    return 'パスワード確認は必須です'
  }
  if (confirmPassword !== password) {
    return 'パスワードが一致しません'
  }
  return ''
}



const validateTerms = (accepted: boolean): string => {
  if (!accepted) {
    return '利用規約とプライバシーポリシーへの同意が必要です'
  }
  return ''
}

const validateField = (field: keyof typeof errors) => {
  switch (field) {
    case 'name':
      errors.name = validateName(form.name)
      break
    case 'email':
      errors.email = validateEmail(form.email)
      break
    case 'password':
      errors.password = validatePassword(form.password)
      // パスワードが変更された場合、確認パスワードも再検証
      if (form.confirmPassword) {
        errors.confirmPassword = validateConfirmPassword(form.confirmPassword, form.password)
      }
      break
    case 'confirmPassword':
      errors.confirmPassword = validateConfirmPassword(form.confirmPassword, form.password)
      break

    case 'acceptTerms':
      errors.acceptTerms = validateTerms(form.acceptTerms)
      break
  }
}

const clearFieldError = (field: keyof typeof errors) => {
  errors[field] = ''

  // グローバルエラーもクリア
  if (authError.value) {
    authError.value = ''
  }
}

const validateForm = (): boolean => {
  errors.name = validateName(form.name)
  errors.email = validateEmail(form.email)
  errors.password = validatePassword(form.password)
  errors.confirmPassword = validateConfirmPassword(form.confirmPassword, form.password)

  errors.acceptTerms = validateTerms(form.acceptTerms)

  return !errors.name && !errors.email && !errors.password && !errors.confirmPassword && !errors.acceptTerms
}

// =====================================
// UI Functions
// =====================================

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value
}

// =====================================
// Authentication Functions
// =====================================

const handleRegister = async () => {
  authError.value = ''

  if (!validateForm()) {
    return
  }

  loading.value = true

  try {
    await authStore.signUpWithEmail(form.email, form.password, {
      displayName: form.name
    })

    // 成功時は成功ページやダッシュボードにリダイレクト
    await navigateTo('/dashboard')
  } catch (error: any) {
    console.error('Registration error:', error)

    // エラーメッセージの日本語化
    let errorMessage = 'アカウント作成に失敗しました。もう一度お試しください。'

    if (error.code) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'このメールアドレスは既に使用されています。ログインするか、別のメールアドレスをお試しください。'
          break
        case 'auth/weak-password':
          errorMessage = 'パスワードが弱すぎます。より強力なパスワードを設定してください。'
          break
        case 'auth/invalid-email':
          errorMessage = 'メールアドレスの形式が正しくありません。'
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
    await authStore.signInWithGoogle()
    await navigateTo('/dashboard')
  } catch (error: any) {
    console.error('Google sign-in error:', error)

    let errorMessage = 'Googleアカウント作成に失敗しました。もう一度お試しください。'

    if (error.code) {
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Googleログインがキャンセルされました。'
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
  // フォーカスの初期設定（アクセシビリティ）
  nextTick(() => {
    const nameInput = document.getElementById('name')
    if (nameInput) {
      nameInput.focus()
    }
  })
})
</script>
<style scoped>
/* =====================================
   登録画面 - デザインシステム統合
   ===================================== */

.register-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--neutral-0) 50%, var(--secondary-50) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}

.register-container {
  width: 100%;
  max-width: 400px;
}

.register-header {
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

.register-form-card {
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

.form-label .optional {
  color: var(--neutral-500);
  font-weight: var(--font-weight-normal);
  font-size: var(--font-size-xs);
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

/* 利用規約チェックボックス */
.terms-checkbox {
  display: flex;
  align-items: flex-start;
  cursor: pointer;
  user-select: none;
  gap: var(--space-3);
  line-height: var(--line-height-relaxed);
}

.terms-checkbox.error .terms-text {
  color: var(--error-700);
}

.terms-checkbox input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.checkmark {
  position: relative;
  width: var(--space-5);
  height: var(--space-5);
  border: 2px solid var(--neutral-300);
  border-radius: var(--radius-base);
  background: var(--neutral-0);
  transition: all var(--transition-fast);
  flex-shrink: 0;
  margin-top: 2px;
}

.terms-checkbox input[type="checkbox"]:checked + .checkmark {
  background: var(--primary-500);
  border-color: var(--primary-500);
}

.checkmark::after {
  content: '';
  position: absolute;
  left: 6px;
  top: 2px;
  width: 6px;
  height: 10px;
  border: solid var(--neutral-0);
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.terms-checkbox input[type="checkbox"]:checked + .checkmark::after {
  opacity: 1;
}

.terms-checkbox input[type="checkbox"]:focus + .checkmark {
  box-shadow: 0 0 0 2px var(--primary-200);
}

.terms-checkbox.error .checkmark {
  border-color: var(--error-300);
}

.terms-text {
  font-size: var(--font-size-sm);
  color: var(--neutral-700);
}

.terms-link {
  color: var(--primary-600);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
  padding: 1px 2px;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.terms-link:hover {
  color: var(--primary-800);
  background: var(--primary-50);
  text-decoration: underline;
}

.terms-link:focus {
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

.register-button {
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

.register-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-xl);
}

.register-button:active:not(:disabled) {
  transform: translateY(0);
}

.register-button:disabled {
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

.login-link {
  text-align: center;
}

.login-link p {
  color: var(--neutral-600);
  margin: 0 0 var(--space-2) 0;
  font-size: var(--font-size-sm);
}

.login-link a {
  color: var(--primary-600);
  text-decoration: none;
  font-weight: var(--font-weight-semibold);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  display: inline-block;
}

.login-link a:hover {
  background: var(--neutral-50);
  text-decoration: none;
}

.login-link a:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--primary-200);
}

.register-footer {
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
  transform: translateY(-8px);
}

.error-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
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
  .register-page {
    padding: var(--space-2);
  }

  .register-container {
    max-width: 100%;
  }

  .register-form-card {
    padding: var(--space-6);
  }

  .brand-title {
    font-size: var(--font-size-2xl);
  }

  .brand-subtitle {
    font-size: var(--font-size-sm);
  }

  .form-field {
    margin-bottom: var(--space-6);
  }
}

/* ダークモード対応 */
@media (prefers-color-scheme: dark) {
  .register-form-card {
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

  .checkmark {
    background: var(--neutral-800);
    border-color: var(--neutral-600);
  }
}

/* アクセシビリティ強化 */
@media (prefers-reduced-motion: reduce) {
  .register-button,
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

  .register-button,
  .google-login-button {
    border: 2px solid var(--neutral-800);
  }

  .checkmark {
    border-width: 2px;
  }
}
</style>
