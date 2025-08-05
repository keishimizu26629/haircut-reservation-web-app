<template>
  <div class="forgot-password-page">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-6 col-lg-5">
          <div class="card shadow">
            <div class="card-body p-5">
              <div class="text-center mb-4">
                <i class="bi bi-key display-4 text-primary"></i>
                <h2 class="mt-3">パスワードをお忘れですか？</h2>
                <p class="text-muted">登録されたメールアドレスに<br>パスワードリセット用のリンクをお送りします。</p>
              </div>

              <form @submit.prevent="handlePasswordReset" v-if="!resetSent">
                <div class="mb-3">
                  <label for="email" class="form-label">メールアドレス</label>
                  <input
                    id="email"
                    v-model="email"
                    type="email"
                    class="form-control"
                    :class="{ 'is-invalid': error }"
                    placeholder="your-email@example.com"
                    required
                  >
                  <div v-if="error" class="invalid-feedback">
                    {{ error }}
                  </div>
                </div>

                <button
                  type="submit"
                  class="btn btn-primary w-100"
                  :disabled="loading || !email"
                >
                  <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                  リセットメールを送信
                </button>
              </form>

              <div v-if="resetSent" class="text-center">
                <div class="alert alert-success">
                  <i class="bi bi-check-circle me-2"></i>
                  パスワードリセット用のメールを送信しました！
                </div>
                <p class="text-muted">
                  メールをご確認いただき、リンクをクリックして<br>新しいパスワードを設定してください。
                </p>
              </div>

              <div class="text-center mt-4">
                <NuxtLink to="/login" class="text-decoration-none">
                  <i class="bi bi-arrow-left me-2"></i>
                  ログインページに戻る
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/auth'

// SEO設定
useHead({
  title: 'パスワードリセット - Beauty Salon Reservation'
})

// State
const authStore = useAuthStore()
const email = ref('')
const loading = ref(false)
const error = ref('')
const resetSent = ref(false)

// Methods
const handlePasswordReset = async () => {
  if (!email.value) {
    error.value = 'メールアドレスを入力してください'
    return
  }

  loading.value = true
  error.value = ''

  try {
    // Firebase Auth パスワードリセット機能を使用
    await authStore.sendPasswordResetEmail(email.value)
    resetSent.value = true
  } catch (err: any) {
    console.error('Password reset error:', err)

    // エラーメッセージの日本語化
    switch (err.code) {
      case 'auth/user-not-found':
        error.value = 'このメールアドレスは登録されていません'
        break
      case 'auth/invalid-email':
        error.value = 'メールアドレスの形式が正しくありません'
        break
      case 'auth/too-many-requests':
        error.value = 'リクエストが多すぎます。しばらく時間をおいてからお試しください'
        break
      default:
        error.value = 'パスワードリセットメールの送信に失敗しました'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.forgot-password-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.card {
  border: none;
  border-radius: 15px;
}

.display-4 {
  font-size: 3rem;
}

.btn-primary {
  background: linear-gradient(45deg, #667eea, #764ba2);
  border: none;
  border-radius: 8px;
  padding: 12px;
  font-weight: 500;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.form-control {
  border-radius: 8px;
  border: 2px solid #e9ecef;
  padding: 12px 16px;
}

.form-control:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
}
</style>
