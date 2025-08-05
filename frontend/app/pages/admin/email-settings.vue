<template>
  <div class="email-settings-page">
    <!-- Header -->
    <AdminHeader />
    
    <!-- Main Content -->
    <div class="container-fluid py-4">
      <div class="row">
        <!-- Sidebar -->
        <div class="col-md-3 col-lg-2">
          <AdminSidebar :current-page="'email-settings'" />
        </div>
        
        <!-- Main Content -->
        <div class="col-md-9 col-lg-10">
          <!-- Page Header -->
          <div class="page-header mb-4">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h1 class="h2 mb-1">
                  <i class="bi bi-envelope-gear me-2"></i>
                  メール通知設定
                </h1>
                <p class="text-muted mb-0">
                  予約確認やリマインダーメールの設定を管理します
                </p>
              </div>
              <div>
                <button 
                  class="btn btn-primary"
                  @click="saveSettings"
                  :disabled="saving || !hasChanges"
                >
                  <i class="bi bi-check2 me-2"></i>
                  設定を保存
                </button>
              </div>
            </div>
          </div>

          <!-- 通知統計 -->
          <div class="row mb-4">
            <div class="col-md-3 mb-3">
              <div class="card">
                <div class="card-body text-center">
                  <i class="bi bi-envelope-check display-4 text-success mb-2"></i>
                  <h5 class="card-title">{{ notificationStats.sent }}</h5>
                  <p class="card-text text-muted">送信成功</p>
                </div>
              </div>
            </div>
            <div class="col-md-3 mb-3">
              <div class="card">
                <div class="card-body text-center">
                  <i class="bi bi-envelope-x display-4 text-danger mb-2"></i>
                  <h5 class="card-title">{{ notificationStats.failed }}</h5>
                  <p class="card-text text-muted">送信失敗</p>
                </div>
              </div>
            </div>
            <div class="col-md-3 mb-3">
              <div class="card">
                <div class="card-body text-center">
                  <i class="bi bi-hourglass-split display-4 text-warning mb-2"></i>
                  <h5 class="card-title">{{ notificationStats.pending }}</h5>
                  <p class="card-text text-muted">送信待機</p>
                </div>
              </div>
            </div>
            <div class="col-md-3 mb-3">
              <div class="card">
                <div class="card-body text-center">
                  <i class="bi bi-percent display-4 text-info mb-2"></i>
                  <h5 class="card-title">{{ notificationStats.successRate }}%</h5>
                  <p class="card-text text-muted">成功率</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 設定フォーム -->
          <div class="row">
            <div class="col-lg-8">
              <!-- 基本設定 -->
              <div class="card mb-4">
                <div class="card-header">
                  <h5 class="card-title mb-0">
                    <i class="bi bi-gear me-2"></i>
                    基本設定
                  </h5>
                </div>
                <div class="card-body">
                  <!-- メール通知全体の有効/無効 -->
                  <div class="form-check form-switch mb-4">
                    <input 
                      id="email-enabled"
                      v-model="localSettings.enabled"
                      class="form-check-input"
                      type="checkbox"
                      @change="markAsChanged"
                    >
                    <label class="form-check-label fw-bold" for="email-enabled">
                      メール通知機能を有効にする
                    </label>
                    <div class="form-text">
                      この設定を無効にすると、全てのメール通知が停止します
                    </div>
                  </div>

                  <!-- 各種通知の有効/無効 -->
                  <div class="notification-types">
                    <h6 class="fw-bold mb-3">通知タイプ別設定</h6>
                    
                    <!-- 予約確認メール -->
                    <div class="form-check form-switch mb-3">
                      <input 
                        id="confirmation-enabled"
                        v-model="localSettings.confirmationEnabled"
                        class="form-check-input"
                        type="checkbox"
                        :disabled="!localSettings.enabled"
                        @change="markAsChanged"
                      >
                      <label class="form-check-label" for="confirmation-enabled">
                        <strong>予約確認メール</strong>
                        <div class="form-text">
                          予約完了時に顧客に送信される確認メール
                        </div>
                      </label>
                    </div>

                    <!-- リマインダーメール -->
                    <div class="form-check form-switch mb-3">
                      <input 
                        id="reminder-enabled"
                        v-model="localSettings.reminderEnabled"
                        class="form-check-input"
                        type="checkbox"
                        :disabled="!localSettings.enabled"
                        @change="markAsChanged"
                      >
                      <label class="form-check-label" for="reminder-enabled">
                        <strong>リマインダーメール</strong>
                        <div class="form-text">
                          予約日前に送信される確認メール
                        </div>
                      </label>
                    </div>

                    <!-- リマインダー時間設定 -->
                    <div v-if="localSettings.reminderEnabled" class="ms-4 mb-3">
                      <label class="form-label">送信タイミング</label>
                      <select 
                        v-model="localSettings.reminderHours"
                        class="form-select"
                        :disabled="!localSettings.enabled"
                        @change="markAsChanged"
                      >
                        <option value="1">1時間前</option>
                        <option value="3">3時間前</option>
                        <option value="6">6時間前</option>
                        <option value="12">12時間前</option>
                        <option value="24">24時間前</option>
                        <option value="48">48時間前</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <!-- テンプレート設定 -->
              <div class="card mb-4">
                <div class="card-header">
                  <h5 class="card-title mb-0">
                    <i class="bi bi-file-text me-2"></i>
                    メールテンプレート
                  </h5>
                </div>
                <div class="card-body">
                  <div class="mb-3">
                    <label class="form-label">テンプレートタイプ</label>
                    <select 
                      v-model="localSettings.template"
                      class="form-select"
                      :disabled="!localSettings.enabled"
                      @change="markAsChanged"
                    >
                      <option value="default">標準テンプレート</option>
                      <option value="custom">カスタムテンプレート</option>
                    </select>
                  </div>

                  <!-- カスタムテンプレート -->
                  <div v-if="localSettings.template === 'custom'" class="custom-template">
                    <label class="form-label">カスタムテンプレート</label>
                    <textarea 
                      v-model="localSettings.customTemplate"
                      class="form-control"
                      rows="8"
                      placeholder="メールテンプレートを入力してください..."
                      :disabled="!localSettings.enabled"
                      @input="markAsChanged"
                    ></textarea>
                    <div class="form-text">
                      使用可能な変数: {customerName}, {date}, {time}, {services}, {salon}
                    </div>
                  </div>

                  <!-- テンプレートプレビュー -->
                  <div class="template-preview mt-3">
                    <button 
                      class="btn btn-outline-secondary"
                      @click="showPreview = !showPreview"
                      :disabled="!localSettings.enabled"
                    >
                      <i class="bi bi-eye me-2"></i>
                      プレビュー
                    </button>
                    
                    <div v-if="showPreview" class="preview-area mt-3 p-3 border rounded bg-light">
                      <h6>メールプレビュー:</h6>
                      <div class="preview-content">
                        {{ templatePreview }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- テスト送信 -->
              <div class="card mb-4">
                <div class="card-header">
                  <h5 class="card-title mb-0">
                    <i class="bi bi-send me-2"></i>
                    テスト送信
                  </h5>
                </div>
                <div class="card-body">
                  <div class="row align-items-end">
                    <div class="col-md-6">
                      <label class="form-label">テスト送信先メールアドレス</label>
                      <input 
                        v-model="testEmail"
                        type="email"
                        class="form-control"
                        placeholder="test@example.com"
                        :disabled="!localSettings.enabled"
                      >
                    </div>
                    <div class="col-md-3">
                      <label class="form-label">送信タイプ</label>
                      <select v-model="testEmailType" class="form-select" :disabled="!localSettings.enabled">
                        <option value="confirmation">予約確認</option>
                        <option value="reminder">リマインダー</option>
                      </select>
                    </div>
                    <div class="col-md-3">
                      <button 
                        class="btn btn-outline-primary w-100"
                        @click="sendTestEmail"
                        :disabled="!localSettings.enabled || !testEmail || testSending"
                      >
                        <i class="bi bi-send me-2"></i>
                        {{ testSending ? '送信中...' : 'テスト送信' }}
                      </button>
                    </div>
                  </div>
                  
                  <!-- テスト送信結果 -->
                  <div v-if="testResult" class="test-result mt-3">
                    <div 
                      class="alert"
                      :class="testResult.success ? 'alert-success' : 'alert-danger'"
                    >
                      <i class="bi me-2" :class="testResult.success ? 'bi-check-circle' : 'bi-x-circle'"></i>
                      {{ testResult.message }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- サイドパネル -->
            <div class="col-lg-4">
              <!-- 通知履歴 -->
              <div class="card">
                <div class="card-header">
                  <h6 class="card-title mb-0">
                    <i class="bi bi-clock-history me-2"></i>
                    最近の通知履歴
                  </h6>
                </div>
                <div class="card-body">
                  <div v-if="recentNotifications.length === 0" class="text-muted text-center py-3">
                    通知履歴がありません
                  </div>
                  <div v-else class="notification-history">
                    <div 
                      v-for="notification in recentNotifications.slice(0, 5)"
                      :key="notification.id"
                      class="notification-item d-flex justify-content-between align-items-center py-2 border-bottom"
                    >
                      <div>
                        <div class="fw-bold small">{{ getNotificationTypeText(notification.type) }}</div>
                        <div class="text-muted small">{{ notification.recipientEmail }}</div>
                      </div>
                      <div class="text-end">
                        <span :class="getStatusBadgeClass(notification.status)" class="badge">
                          {{ getStatusText(notification.status) }}
                        </span>
                        <div class="text-muted small">
                          {{ formatDate(notification.sentAt || '') }}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="text-center mt-3">
                    <NuxtLink to="/admin/notifications" class="btn btn-sm btn-outline-primary">
                      全履歴を見る
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'

// Meta
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin-only']
})

useHead({
  title: 'メール通知設定 - 管理画面'
})

const {
  settings,
  notifications,
  notificationStats,
  saveSettings: saveEmailSettings,
  getNotificationHistory
} = useEmailNotification()

// ローカル状態
const localSettings = ref({ ...settings.value })
const hasChanges = ref(false)
const saving = ref(false)
const showPreview = ref(false)
const testEmail = ref('')
const testEmailType = ref('confirmation')
const testSending = ref(false)
const testResult = ref<{ success: boolean; message: string } | null>(null)
const recentNotifications = ref([])

// 設定変更の検知
const markAsChanged = () => {
  hasChanges.value = true
}

// 設定保存
const saveSettings = async () => {
  try {
    saving.value = true
    const success = await saveEmailSettings(localSettings.value)
    
    if (success) {
      hasChanges.value = false
      // Toast通知（実装予定）
      console.log('設定を保存しました')
    }
  } catch (error) {
    console.error('設定の保存に失敗:', error)
  } finally {
    saving.value = false
  }
}

// テンプレートプレビュー
const templatePreview = computed(() => {
  const template = localSettings.value.template === 'custom' 
    ? localSettings.value.customTemplate 
    : `こんにちは、{customerName}様

ご予約を承りました。
予約日時: {date} {time}
サービス: {services}

{salon}でお待ちしております。`

  return template
    ?.replace('{customerName}', '山田太郎')
    ?.replace('{date}', '2024年1月15日')
    ?.replace('{time}', '14:00')
    ?.replace('{services}', 'カット・カラー')
    ?.replace('{salon}', 'Beauty Salon')
})

// テストメール送信
const sendTestEmail = async () => {
  if (!testEmail.value) return
  
  try {
    testSending.value = true
    testResult.value = null
    
    const response = await $fetch('/api/notifications/email/test', {
      method: 'POST',
      body: {
        email: testEmail.value,
        type: testEmailType.value,
        template: localSettings.value.template
      }
    })
    
    testResult.value = {
      success: response.success,
      message: response.success 
        ? 'テストメールを送信しました' 
        : response.error?.message || 'テストメール送信に失敗しました'
    }
  } catch (error: any) {
    testResult.value = {
      success: false,
      message: error.message || 'テストメール送信に失敗しました'
    }
  } finally {
    testSending.value = false
  }
}

// 通知履歴の読み込み
const loadRecentNotifications = async () => {
  try {
    const history = await getNotificationHistory()
    recentNotifications.value = history.slice(0, 10)
  } catch (error) {
    console.error('通知履歴の読み込みに失敗:', error)
  }
}

// ユーティリティ関数
const getNotificationTypeText = (type: string): string => {
  switch (type) {
    case 'confirmation': return '予約確認'
    case 'reminder': return 'リマインダー'
    case 'cancellation': return 'キャンセル'
    case 'modification': return '変更通知'
    default: return type
  }
}

const getStatusText = (status: string): string => {
  switch (status) {
    case 'sent': return '送信完了'
    case 'failed': return '送信失敗'
    case 'sending': return '送信中'
    case 'pending': return '待機中'
    default: return status
  }
}

const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case 'sent': return 'bg-success'
    case 'failed': return 'bg-danger'
    case 'sending': return 'bg-info'
    case 'pending': return 'bg-secondary'
    default: return 'bg-light text-dark'
  }
}

const formatDate = (dateString: string): string => {
  if (!dateString) return ''
  return dayjs(dateString).format('MM/DD HH:mm')
}

// 設定の同期
watch(settings, (newSettings) => {
  if (!hasChanges.value) {
    localSettings.value = { ...newSettings }
  }
}, { deep: true })

// 初期化
onMounted(() => {
  loadRecentNotifications()
})
</script>

<style scoped>
.email-settings-page {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.page-header {
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 1rem;
}

.card {
  border: none;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.form-check-input:disabled + .form-check-label {
  opacity: 0.5;
}

.notification-item:last-child {
  border-bottom: none !important;
}

.preview-area {
  white-space: pre-line;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
}

.test-result {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .col-md-3, .col-md-6 {
    margin-bottom: 1rem;
  }
}
</style>