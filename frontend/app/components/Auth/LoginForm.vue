<template>
  <div class="login-form-container">
    <!-- フォームヘッダー -->
    <div class="form-header">
      <h2 class="form-title">
        <i class="bi bi-box-arrow-in-right me-2" aria-hidden="true"></i>
        ログイン
      </h2>
      <p class="form-subtitle">アカウント情報を入力してください</p>
    </div>

    <!-- メインフォーム -->
    <form @submit.prevent="handleSubmit" novalidate class="login-form">
      <!-- メールアドレス -->
      <FormField
        id="email"
        v-model="form.email"
        type="email"
        label="メールアドレス"
        placeholder="example@email.com"
        icon="bi-envelope"
        :error="errors.email"
        :required="true"
        autocomplete="email"
        @input="clearError('email')"
        @blur="validateField('email')"
      />

      <!-- パスワード -->
      <FormField
        id="password"
        v-model="form.password"
        :type="showPassword ? 'text' : 'password'"
        label="パスワード"
        placeholder="パスワードを入力"
        icon="bi-lock"
        :error="errors.password"
        :required="true"
        autocomplete="current-password"
        :show-password-toggle="true"
        :password-visible="showPassword"
        @input="clearError('password')"
        @blur="validateField('password')"
        @toggle-password="togglePassword"
      />

      <!-- Remember Me & Forgot Password -->
      <div class="form-options">
        <label class="remember-me">
          <input
            v-model="form.remember"
            type="checkbox"
            class="form-checkbox"
          >
          <span class="checkmark"></span>
          <span class="label-text">ログイン状態を保持</span>
        </label>
        
        <NuxtLink 
          to="/forgot-password" 
          class="forgot-password-link"
        >
          パスワードを忘れた方
        </NuxtLink>
      </div>

      <!-- グローバルエラー -->
      <transition name="error-slide">
        <div v-if="globalError" class="global-error" role="alert">
          <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
          <div>
            <h4>ログインエラー</h4>
            <p>{{ globalError }}</p>
          </div>
        </div>
      </transition>

      <!-- ログインボタン -->
      <LoadingButton
        type="submit"
        :loading="loading"
        :disabled="!isFormValid"
        class="login-button"
        loading-text="ログイン中..."
      >
        <i class="bi bi-box-arrow-in-right me-2" aria-hidden="true"></i>
        ログイン
      </LoadingButton>
    </form>

    <!-- Divider -->
    <div class="divider">
      <span>または</span>
    </div>

    <!-- Googleログイン -->
    <SocialLoginButton
      provider="google"
      :loading="loading"
      @click="$emit('googleLogin')"
    />

    <!-- 新規登録リンク -->
    <div class="signup-link">
      <p>アカウントをお持ちでない方は</p>
      <NuxtLink to="/register" class="signup-button">
        新規登録
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import FormField from '@/components/Form/FormField.vue'
import LoadingButton from '@/components/UI/LoadingButton.vue'
import SocialLoginButton from '@/components/Auth/SocialLoginButton.vue'

// =====================================
// Props & Emits
// =====================================

interface Props {
  loading?: boolean
  globalError?: string
}

interface Emits {
  (event: 'submit', data: { email: string; password: string; remember: boolean }): void
  (event: 'googleLogin'): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  globalError: ''
})

const emit = defineEmits<Emits>()

// =====================================
// State
// =====================================

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
// Computed
// =====================================

const isFormValid = computed(() => {
  return form.email.length > 0 && 
         form.password.length >= 6 && 
         !errors.email && 
         !errors.password
})

// =====================================
// Validation
// =====================================

const validateEmail = (email: string): string => {
  if (!email) return 'メールアドレスは必須です'
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return '有効なメールアドレスを入力してください'
  
  return ''
}

const validatePassword = (password: string): string => {
  if (!password) return 'パスワードは必須です'
  if (password.length < 6) return 'パスワードは6文字以上で入力してください'
  
  return ''
}

const validateField = (field: 'email' | 'password') => {
  if (field === 'email') {
    errors.email = validateEmail(form.email)
  } else if (field === 'password') {
    errors.password = validatePassword(form.password)
  }
}

const clearError = (field: 'email' | 'password') => {
  if (field === 'email') errors.email = ''
  if (field === 'password') errors.password = ''
}

const validateForm = (): boolean => {
  errors.email = validateEmail(form.email)
  errors.password = validatePassword(form.password)
  
  return !errors.email && !errors.password
}

// =====================================
// Actions
// =====================================

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const handleSubmit = () => {
  if (!validateForm()) return
  
  emit('submit', {
    email: form.email,
    password: form.password,
    remember: form.remember
  })
}

// =====================================
// Lifecycle
// =====================================

onMounted(() => {
  // Remember me 状態復元
  const shouldRemember = localStorage.getItem('rememberLogin')
  if (shouldRemember) {
    form.remember = true
  }
})
</script>

<style scoped>
.login-form-container {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.form-header {
  text-align: center;
  margin-bottom: 2rem;
}

.form-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.form-subtitle {
  color: #6b7280;
  font-size: 0.875rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: -0.5rem 0 0.5rem 0;
}

.remember-me {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.form-checkbox {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.checkmark {
  width: 1rem;
  height: 1rem;
  background-color: #f3f4f6;
  border: 2px solid #d1d5db;
  border-radius: 0.25rem;
  margin-right: 0.5rem;
  position: relative;
  transition: all 0.2s ease;
}

.form-checkbox:checked + .checkmark {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

.form-checkbox:checked + .checkmark::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 0.375rem;
  height: 0.1875rem;
  border: 2px solid white;
  border-top: none;
  border-right: none;
  transform: translate(-50%, -60%) rotate(-45deg);
}

.label-text {
  font-size: 0.875rem;
  color: #374151;
}

.forgot-password-link {
  font-size: 0.875rem;
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.forgot-password-link:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

.global-error {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.75rem;
  color: #dc2626;
}

.global-error i {
  font-size: 1.125rem;
  margin-top: 0.125rem;
  flex-shrink: 0;
}

.global-error h4 {
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  font-size: 0.875rem;
}

.global-error p {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.4;
}

.login-button {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
  border: none;
  padding: 0.875rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.login-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 12px -1px rgba(0, 0, 0, 0.15);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.divider {
  position: relative;
  margin: 1.5rem 0;
  text-align: center;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background-color: #e5e7eb;
}

.divider span {
  background-color: white;
  padding: 0 1rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.signup-link {
  text-align: center;
  margin-top: 1.5rem;
}

.signup-link p {
  color: #6b7280;
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
}

.signup-button {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  display: inline-block;
}

.signup-button:hover {
  background-color: #f3f4f6;
  text-decoration: none;
}

/* アニメーション */
.error-slide-enter-active,
.error-slide-leave-active {
  transition: all 0.3s ease;
}

.error-slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.error-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* レスポンシブ */
@media (max-width: 480px) {
  .form-options {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .forgot-password-link {
    align-self: flex-end;
  }
}
</style>