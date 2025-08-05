<!--
  カレンダー専用ローディング状態コンポーネント
  認証・データ読み込み中の最適化されたUX表示
-->

<template>
  <div class="calendar-loading-container">
    <!-- 認証チェック中 -->
    <div v-if="!authReady && !hasError" class="loading-section auth-loading">
      <div class="loading-content">
        <div class="loading-icon auth-icon">
          <i class="bi bi-shield-check"></i>
          <div class="loading-spinner auth-spinner"></div>
        </div>
        <h3 class="loading-title">認証確認中</h3>
        <p class="loading-description">
          ユーザー認証状態を確認しています...
        </p>
        <div class="loading-progress">
          <div class="progress-bar auth-progress"></div>
        </div>
      </div>
    </div>

    <!-- データ読み込み中 -->
    <div v-else-if="authReady && !dataReady && !hasError" class="loading-section data-loading">
      <div class="loading-content">
        <div class="loading-icon data-icon">
          <i class="bi bi-calendar-data"></i>
          <div class="loading-spinner data-spinner"></div>
        </div>
        <h3 class="loading-title">カレンダーデータ読み込み中</h3>
        <p class="loading-description">
          予約情報を取得しています...
        </p>
        <div class="loading-progress">
          <div class="progress-bar data-progress"></div>
        </div>
        
        <!-- リトライ情報 -->
        <div v-if="retryCount > 0" class="retry-info">
          <i class="bi bi-arrow-clockwise retry-icon"></i>
          <span>再試行中 ({{ retryCount }}/{{ maxRetries }})</span>
        </div>
      </div>
    </div>

    <!-- エラー状態 -->
    <div v-else-if="hasError" class="loading-section error-state">
      <div class="loading-content">
        <div class="error-icon">
          <i class="bi bi-exclamation-triangle"></i>
        </div>
        <h3 class="error-title">読み込みエラー</h3>
        <p class="error-description">
          {{ errorMessage }}
        </p>
        
        <div class="error-actions">
          <button 
            class="btn-retry primary"
            @click="$emit('retry')"
            :disabled="isRetrying"
          >
            <i class="bi bi-arrow-clockwise"></i>
            <span v-if="isRetrying">再試行中...</span>
            <span v-else>再試行</span>
          </button>
          
          <button 
            class="btn-retry secondary"
            @click="$emit('reset')"
          >
            <i class="bi bi-arrow-counterclockwise"></i>
            リセット
          </button>
        </div>
        
        <!-- デバッグ情報（開発環境のみ） -->
        <details v-if="showDebugInfo" class="debug-info">
          <summary>デバッグ情報</summary>
          <pre>{{ debugInfo }}</pre>
        </details>
      </div>
    </div>

    <!-- カレンダースケルトン（準備完了前） -->
    <div v-else-if="showSkeleton" class="loading-section skeleton-loading">
      <div class="calendar-skeleton">
        <!-- ヘッダースケルトン -->
        <div class="skeleton-header">
          <div class="skeleton-nav">
            <div class="skeleton-button"></div>
            <div class="skeleton-title"></div>
            <div class="skeleton-button"></div>
          </div>
          <div class="skeleton-controls">
            <div class="skeleton-toggle"></div>
          </div>
        </div>
        
        <!-- カレンダーグリッドスケルトン -->
        <div class="skeleton-calendar">
          <div class="skeleton-weekdays">
            <div v-for="i in 7" :key="i" class="skeleton-weekday"></div>
          </div>
          <div class="skeleton-grid">
            <div v-for="i in 35" :key="i" class="skeleton-day">
              <div class="skeleton-day-number"></div>
              <div class="skeleton-appointments">
                <div v-if="Math.random() > 0.7" class="skeleton-appointment"></div>
                <div v-if="Math.random() > 0.8" class="skeleton-appointment"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  authReady?: boolean
  dataReady?: boolean
  hasError?: boolean
  errorMessage?: string
  retryCount?: number
  maxRetries?: number
  isRetrying?: boolean
  showSkeleton?: boolean
  debugInfo?: any
}

const props = withDefaults(defineProps<Props>(), {
  authReady: false,
  dataReady: false,
  hasError: false,
  errorMessage: 'データの読み込みに失敗しました',
  retryCount: 0,
  maxRetries: 3,
  isRetrying: false,
  showSkeleton: false,
  debugInfo: null
})

const emit = defineEmits<{
  retry: []
  reset: []
}>()

// 開発環境でのデバッグ情報表示
const showDebugInfo = computed(() => 
  process.env.NODE_ENV === 'development' && props.debugInfo
)
</script>

<style scoped>
/* =====================================
   カレンダーローディング状態
   ===================================== */

.calendar-loading-container {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--surface-color);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
}

.loading-section {
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

/* ローディングアイコン */
.loading-icon {
  position: relative;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-bottom: 0.5rem;
}

.loading-icon i {
  font-size: 2rem;
  z-index: 2;
}

.loading-spinner {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 認証ローディング */
.auth-icon {
  background: linear-gradient(135deg, var(--primary-100) 0%, var(--primary-200) 100%);
  color: var(--primary-600);
}

.auth-spinner {
  border-top: 3px solid var(--primary-500);
  border-right: 3px solid var(--primary-300);
}

.auth-progress {
  animation: authProgress 2s ease-in-out infinite;
}

/* データローディング */
.data-icon {
  background: linear-gradient(135deg, var(--success-100) 0%, var(--success-200) 100%);
  color: var(--success-600);
}

.data-spinner {
  border-top: 3px solid var(--success-500);
  border-right: 3px solid var(--success-300);
}

.data-progress {
  animation: dataProgress 1.5s ease-in-out infinite;
}

/* テキスト */
.loading-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.loading-description {
  color: var(--text-secondary);
  margin: 0;
  font-size: 0.9375rem;
}

/* プログレスバー */
.loading-progress {
  width: 200px;
  height: 4px;
  background: var(--border-color);
  border-radius: 2px;
  overflow: hidden;
  margin: 0.5rem 0;
}

.progress-bar {
  height: 100%;
  border-radius: 2px;
}

/* リトライ情報 */
.retry-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--warning-600);
  font-size: 0.875rem;
  font-weight: 500;
}

.retry-icon {
  animation: spin 1s linear infinite;
}

/* エラー状態 */
.error-state {
  color: var(--error-600);
}

.error-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--error-50);
  border-radius: 50%;
  margin: 0 auto 1rem;
}

.error-icon i {
  font-size: 2rem;
  color: var(--error-500);
}

.error-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--error-700);
  margin: 0 0 0.5rem 0;
}

.error-description {
  color: var(--error-600);
  margin: 0 0 1.5rem 0;
}

.error-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-retry {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  min-width: 120px;
}

.btn-retry.primary {
  background: var(--primary-500);
  color: white;
}

.btn-retry.primary:hover:not(:disabled) {
  background: var(--primary-600);
}

.btn-retry.secondary {
  background: var(--neutral-100);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.btn-retry.secondary:hover {
  background: var(--neutral-200);
}

.btn-retry:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* デバッグ情報 */
.debug-info {
  margin-top: 1rem;
  text-align: left;
}

.debug-info summary {
  cursor: pointer;
  font-weight: 500;
  color: var(--text-secondary);
}

.debug-info pre {
  background: var(--neutral-50);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  margin: 0.5rem 0 0 0;
  font-size: 0.75rem;
  overflow-x: auto;
}

/* カレンダースケルトン */
.calendar-skeleton {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.skeleton-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 0 1rem;
}

.skeleton-nav {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.skeleton-button {
  width: 40px;
  height: 40px;
  background: var(--neutral-200);
  border-radius: var(--radius-md);
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-title {
  width: 200px;
  height: 32px;
  background: var(--neutral-200);
  border-radius: var(--radius-md);
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-toggle {
  width: 120px;
  height: 40px;
  background: var(--neutral-200);
  border-radius: var(--radius-md);
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-calendar {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 1rem;
}

.skeleton-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.skeleton-weekday {
  height: 32px;
  background: var(--neutral-200);
  border-radius: var(--radius-sm);
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.skeleton-day {
  background: var(--surface-color);
  min-height: 80px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.skeleton-day-number {
  width: 24px;
  height: 24px;
  background: var(--neutral-200);
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-appointments {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: auto;
}

.skeleton-appointment {
  height: 12px;
  background: var(--primary-200);
  border-radius: 2px;
  animation: pulse 1.5s ease-in-out infinite;
}

/* アニメーション */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes authProgress {
  0% { width: 0%; background: var(--primary-300); }
  50% { width: 70%; background: var(--primary-500); }
  100% { width: 100%; background: var(--primary-600); }
}

@keyframes dataProgress {
  0% { width: 0%; background: var(--success-300); }
  50% { width: 80%; background: var(--success-500); }
  100% { width: 100%; background: var(--success-600); }
}

/* レスポンシブ */
@media (max-width: 768px) {
  .calendar-loading-container {
    padding: 1rem;
    min-height: 300px;
  }
  
  .loading-title {
    font-size: 1.125rem;
  }
  
  .loading-progress {
    width: 150px;
  }
  
  .error-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .skeleton-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .skeleton-nav {
    justify-content: center;
  }
  
  .skeleton-grid {
    gap: 1px;
  }
  
  .skeleton-day {
    min-height: 60px;
    padding: 0.25rem;
  }
}

/* ダークモード */
@media (prefers-color-scheme: dark) {
  .skeleton-button,
  .skeleton-title,
  .skeleton-toggle,
  .skeleton-weekday,
  .skeleton-day-number {
    background: var(--neutral-700);
  }
  
  .skeleton-appointment {
    background: var(--primary-700);
  }
}

/* アクセシビリティ */
@media (prefers-reduced-motion: reduce) {
  .loading-spinner,
  .retry-icon {
    animation: none;
  }
  
  .progress-bar {
    animation: none;
    width: 100%;
  }
  
  .skeleton-button,
  .skeleton-title,
  .skeleton-toggle,
  .skeleton-weekday,
  .skeleton-day-number,
  .skeleton-appointment {
    animation: none;
    opacity: 0.7;
  }
}
</style>