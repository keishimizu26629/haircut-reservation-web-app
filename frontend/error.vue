<template>
  <div class="error-page">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-8 col-lg-6">
          <div class="error-card text-center">
            <!-- Error Icon -->
            <div class="error-icon mb-4">
              <i
                v-if="error.statusCode === 404"
                class="bi bi-compass display-1 text-warning"
              />
              <i
                v-else-if="error.statusCode >= 500"
                class="bi bi-exclamation-triangle display-1 text-danger"
              />
              <i
                v-else
                class="bi bi-shield-exclamation display-1 text-info"
              />
            </div>

            <!-- Error Title -->
            <h1 class="error-title mb-3">
              {{ getErrorTitle() }}
            </h1>

            <!-- Error Description -->
            <p class="error-description text-muted mb-4">
              {{ getErrorDescription() }}
            </p>

            <!-- Error Details (Development Only) -->
            <details
              v-if="isDevelopment && error.stack"
              class="error-details mb-4"
            >
              <summary class="btn btn-outline-secondary btn-sm">
                Technical Details
              </summary>
              <pre class="mt-3 text-start"><code>{{ error.stack }}</code></pre>
            </details>

            <!-- Action Buttons -->
            <div class="error-actions">
              <button
                class="btn btn-primary me-3"
                :disabled="!canGoBack"
                @click="goBack"
              >
                <i class="bi bi-arrow-left me-2" />
                戻る
              </button>

              <NuxtLink
                to="/"
                class="btn btn-outline-primary me-3"
              >
                <i class="bi bi-house me-2" />
                ホームへ
              </NuxtLink>

              <button
                class="btn btn-outline-secondary"
                @click="refresh"
              >
                <i class="bi bi-arrow-clockwise me-2" />
                再読み込み
              </button>
            </div>

            <!-- Support Information -->
            <div class="support-info mt-5 pt-4 border-top">
              <p class="small text-muted mb-2">
                問題が続く場合は、サポートまでお問い合わせください
              </p>
              <p class="small text-muted">
                エラーID: {{ generateErrorId() }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Nuxt composables
import { useHead } from '@unhead/vue'

// Error handling props
interface ErrorProps {
  error: {
    statusCode: number
    statusMessage?: string
    message?: string
    stack?: string
    data?: unknown
  }
}

const props = defineProps<ErrorProps>()

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development'
const canGoBack = process.client && window.history.length > 1

// Error categorization
const getErrorTitle = (): string => {
  const { statusCode } = props.error

  switch (statusCode) {
    case 404:
      return 'ページが見つかりません'
    case 403:
      return 'アクセスが拒否されました'
    case 500:
      return 'サーバーエラーが発生しました'
    case 503:
      return 'サービスが一時的に利用できません'
    default:
      return 'エラーが発生しました'
  }
}

const getErrorDescription = (): string => {
  const { statusCode, statusMessage } = props.error

  switch (statusCode) {
    case 404:
      return 'お探しのページは存在しないか、移動された可能性があります。'
    case 403:
      return 'このページにアクセスする権限がありません。'
    case 500:
      return 'サーバー内部でエラーが発生しました。しばらく時間をおいて再度お試しください。'
    case 503:
      return 'サーバーがメンテナンス中または一時的に利用できません。'
    default:
      return statusMessage || '予期しないエラーが発生しました。'
  }
}

// Generate unique error ID for support
const generateErrorId = (): string => {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substr(2, 5)
  return `${timestamp}-${random}`.toUpperCase()
}

// Action handlers
const goBack = (): void => {
  if (process.client && window.history.length > 1) {
    window.history.back()
  } else {
    window.location.href = '/'
  }
}

const refresh = (): void => {
  if (process.client) {
    window.location.reload()
  }
}

// SEO settings
useHead({
  title: `エラー ${props.error.statusCode} - Beauty Salon Reservation`,
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})

// Error tracking (for production monitoring)
if (process.client && !isDevelopment) {
  // Log error for monitoring (replace with your error tracking service)
  console.error('Production Error:', {
    statusCode: props.error.statusCode,
    message: props.error.message,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  })
}
</script>

<style scoped>
.error-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  display: flex;
  align-items: center;
  padding: 2rem 0;
}

.error-card {
  background: white;
  border-radius: 1.5rem;
  padding: 3rem 2rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.error-icon {
  opacity: 0.8;
}

.error-title {
  font-weight: 600;
  color: #2d3748;
}

.error-description {
  font-size: 1.1rem;
  line-height: 1.6;
}

.error-details {
  text-align: left;
  background: #f8f9fa;
  border-radius: 0.5rem;
  padding: 1rem;
}

.error-details pre {
  background: transparent;
  border: none;
  font-size: 0.875rem;
  max-height: 200px;
  overflow-y: auto;
}

.error-actions .btn {
  margin-bottom: 0.5rem;
}

.support-info {
  color: #6c757d;
}

@media (max-width: 768px) {
  .error-card {
    padding: 2rem 1.5rem;
    margin: 1rem;
  }

  .error-actions .btn {
    width: 100%;
    margin-bottom: 0.75rem;
    margin-right: 0 !important;
  }

  .error-actions .btn:last-child {
    margin-bottom: 0;
  }
}

/* Animation */
.error-card {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
