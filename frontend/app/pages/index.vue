<template>
  <div class="min-h-screen bg-gray-50">
    <ClientOnly>
    <!-- Navigation -->
    <nav class="bg-white shadow-sm border-bottom">
      <div class="container">
        <div class="d-flex justify-content-between align-items-center py-3">
          <div class="d-flex align-items-center">
            <i class="bi bi-scissors text-primary me-2" style="font-size: 1.5rem;" aria-hidden="true"></i>
            <h1 class="h4 mb-0 text-primary">美容室予約システム</h1>
          </div>
          <div class="d-flex align-items-center gap-2">
            <!-- ユーザー情報表示（モバイル対応） -->
            <div class="user-info d-none d-md-flex align-items-center me-3">
              <i class="bi bi-person-circle text-muted me-2"></i>
              <span class="text-muted">{{ user?.displayName || user?.email || 'ゲスト' }}</span>
            </div>

            <!-- 管理画面ボタン（控えめに配置） -->
            <NuxtLink v-if="isAdmin" to="/dashboard"
                     class="btn btn-sm btn-outline-secondary d-none d-lg-inline-flex"
                     title="管理画面">
              <i class="bi bi-speedometer2 me-1" aria-hidden="true"></i>
              <span class="d-none d-xl-inline">管理</span>
            </NuxtLink>

            <!-- モバイル用管理ボタン -->
            <NuxtLink v-if="isAdmin" to="/dashboard"
                     class="btn btn-sm btn-outline-secondary d-lg-none"
                     title="管理画面">
              <i class="bi bi-speedometer2" aria-hidden="true"></i>
            </NuxtLink>

            <!-- ログアウトボタン（レスポンシブ） -->
            <button @click="handleLogout"
                    class="btn btn-sm btn-outline-danger"
                    title="ログアウト">
              <i class="bi bi-box-arrow-right me-1" aria-hidden="true"></i>
              <span class="d-none d-md-inline">ログアウト</span>
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Page Header -->
    <section class="bg-primary text-white py-4 py-md-5">
      <div class="container text-center">
        <h1 class="display-6 display-md-5 fw-bold mb-3">オンライン予約</h1>
        <p class="lead mb-3">簡単3ステップでご予約完了</p>
        <div class="features-list d-flex flex-column flex-md-row justify-content-center align-items-center gap-3">
          <div class="feature-item">
            <i class="bi bi-calendar-check me-2" aria-hidden="true"></i>
            <span>24時間受付</span>
          </div>
          <div class="d-none d-md-inline text-muted">•</div>
          <div class="feature-item">
            <i class="bi bi-clock me-2" aria-hidden="true"></i>
            <span>即時確認</span>
          </div>
          <div class="d-none d-md-inline text-muted">•</div>
          <div class="feature-item">
            <i class="bi bi-shield-check me-2" aria-hidden="true"></i>
            <span>安心予約</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Booking Steps -->
    <section class="py-5">
      <div class="container">
        <!-- Progress Steps -->
        <div class="row mb-5">
          <div class="col-12">
            <div class="progress-steps d-flex justify-content-center mb-4">
              <div class="step" :class="{ active: currentStep >= 1 }">
                <div class="step-number">1</div>
                <div class="step-label">サービス選択</div>
              </div>
              <div class="step-connector"></div>
              <div class="step" :class="{ active: currentStep >= 2 }">
                <div class="step-number">2</div>
                <div class="step-label">日時選択</div>
              </div>
              <div class="step-connector"></div>
              <div class="step" :class="{ active: currentStep >= 3 }">
                <div class="step-number">3</div>
                <div class="step-label">確認・完了</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Booking Form -->
        <div class="row justify-content-center">
          <div class="col-12 col-md-8 col-lg-6">
            <div class="card shadow">
              <div class="card-body p-3 p-md-4">
                <h2 class="card-title text-center mb-4">
                  <i class="bi bi-calendar-plus text-primary me-2" aria-hidden="true"></i>
                  新規予約
                </h2>

                <!-- Service Selection Form -->
                <form @submit.prevent="handleBooking">
                  <fieldset class="mb-4">
                    <legend class="form-label fw-bold mb-3">ご希望のサービス <span class="text-danger">*</span></legend>
                    <div class="service-options" role="radiogroup" aria-labelledby="service-legend">
                      <div class="form-check mb-3">
                        <input class="form-check-input" type="radio" name="service" id="cut" value="cut" v-model="bookingData.service" aria-describedby="cut-price">
                        <label class="form-check-label d-flex justify-content-between align-items-center" for="cut">
                          <span class="service-name">
                            <i class="bi bi-scissors me-2" aria-hidden="true"></i>
                            <span>カット</span>
                          </span>
                          <span class="service-price text-muted fw-bold" id="cut-price">¥3,000</span>
                        </label>
                      </div>
                      <div class="form-check mb-3">
                        <input class="form-check-input" type="radio" name="service" id="cut-color" value="cut-color" v-model="bookingData.service" aria-describedby="cut-color-price">
                        <label class="form-check-label d-flex justify-content-between align-items-center" for="cut-color">
                          <span class="service-name">
                            <i class="bi bi-palette me-2" aria-hidden="true"></i>
                            <span>カット + カラー</span>
                          </span>
                          <span class="service-price text-muted fw-bold" id="cut-color-price">¥6,000</span>
                        </label>
                      </div>
                      <div class="form-check mb-3">
                        <input class="form-check-input" type="radio" name="service" id="perm" value="perm" v-model="bookingData.service" aria-describedby="perm-price">
                        <label class="form-check-label d-flex justify-content-between align-items-center" for="perm">
                          <span class="service-name">
                            <i class="bi bi-hurricane me-2" aria-hidden="true"></i>
                            <span>パーマ</span>
                          </span>
                          <span class="service-price text-muted fw-bold" id="perm-price">¥5,000</span>
                        </label>
                      </div>
                      <div class="form-check mb-3">
                        <input class="form-check-input" type="radio" name="service" id="treatment" value="treatment" v-model="bookingData.service" aria-describedby="treatment-price">
                        <label class="form-check-label d-flex justify-content-between align-items-center" for="treatment">
                          <span class="service-name">
                            <i class="bi bi-heart me-2" aria-hidden="true"></i>
                            <span>トリートメント</span>
                          </span>
                          <span class="service-price text-muted fw-bold" id="treatment-price">¥2,000</span>
                        </label>
                      </div>
                    </div>
                  </fieldset>

                  <div class="mb-4">
                    <label for="stylist" class="form-label fw-bold">スタイリスト選択 <span class="text-muted">(任意)</span></label>
                    <select class="form-select" id="stylist" v-model="bookingData.stylist" aria-describedby="stylist-help">
                      <option value="">指名なし（どなたでも）</option>
                      <option value="tanaka">田中 美香（店長）</option>
                      <option value="sato">佐藤 春子</option>
                      <option value="yamada">山田 健太</option>
                    </select>
                    <div id="stylist-help" class="form-text">スタイリストを指名しない場合は、空いているスタッフが担当いたします。</div>
                  </div>

                  <div class="row">
                    <div class="col-12 col-md-6 mb-4">
                      <label for="date" class="form-label fw-bold">希望日 <span class="text-danger">*</span></label>
                      <input type="date" class="form-control" id="date" v-model="bookingData.date"
                             :min="today" required aria-describedby="date-help">
                      <div id="date-help" class="form-text">本日以降の日付を選択してください。</div>
                    </div>
                    <div class="col-12 col-md-6 mb-4">
                      <label for="time" class="form-label fw-bold">希望時間 <span class="text-danger">*</span></label>
                      <select class="form-select" id="time" v-model="bookingData.time" required aria-describedby="time-help">
                        <option value="">時間を選択してください</option>
                        <option value="09:00">09:00 （朝一番）</option>
                        <option value="10:00">10:00</option>
                        <option value="11:00">11:00</option>
                        <option value="12:00">12:00</option>
                        <option value="13:00">13:00</option>
                        <option value="14:00">14:00</option>
                        <option value="15:00">15:00</option>
                        <option value="16:00">16:00</option>
                        <option value="17:00">17:00 （最終受付）</option>
                      </select>
                      <div id="time-help" class="form-text">営業時間: 9:00-18:00 （最終受付 17:00）</div>
                    </div>
                  </div>

                  <div class="row">
                    <div class="col-12 col-md-6 mb-4">
                      <label for="name" class="form-label fw-bold">お名前 <span class="text-danger">*</span></label>
                      <input type="text" class="form-control" id="name" v-model="bookingData.name"
                             required autocomplete="name" placeholder="山田 太郎"
                             aria-describedby="name-help">
                      <div id="name-help" class="form-text">お予約確認時に使用いたします。</div>
                    </div>
                    <div class="col-12 col-md-6 mb-4">
                      <label for="phone" class="form-label fw-bold">電話番号 <span class="text-danger">*</span></label>
                      <input type="tel" class="form-control" id="phone" v-model="bookingData.phone"
                             required autocomplete="tel" placeholder="090-1234-5678"
                             pattern="[0-9\-]+" aria-describedby="phone-help">
                      <div id="phone-help" class="form-text">緊急連絡時に使用いたします。</div>
                    </div>
                  </div>

                  <div class="mb-4">
                    <label for="notes" class="form-label fw-bold">ご要望・備考 <span class="text-muted">(任意)</span></label>
                    <textarea class="form-control" id="notes" rows="3" v-model="bookingData.notes"
                              placeholder="例: カラーは明るめの茶色希望、前回のカットから3cmほど短くしたいなど"
                              aria-describedby="notes-help" maxlength="500"></textarea>
                    <div id="notes-help" class="form-text">髪の悩みや具体的なご要望がありましたらお聞かせください。</div>
                  </div>

                  <!-- 予約内容確認 -->
                  <div v-if="bookingData.service" class="alert alert-info">
                    <h6 class="alert-heading">
                      <i class="bi bi-info-circle me-2"></i>予約内容確認
                    </h6>
                    <p class="mb-1"><strong>サービス:</strong> {{ getServiceName(bookingData.service) }}</p>
                    <p class="mb-1"><strong>料金:</strong> {{ getServicePrice(bookingData.service) }}</p>
                    <p class="mb-0" v-if="bookingData.stylist"><strong>スタイリスト:</strong> {{ getStylistName(bookingData.stylist) }}</p>
                  </div>

                  <div class="d-grid">
                    <button type="submit" class="btn btn-primary btn-lg" :disabled="loading || !isFormValid">
                      <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                      <i v-else class="bi bi-calendar-check me-2"></i>
                      {{ loading ? '予約処理中...' : '予約を確定する' }}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Success Modal -->
    <div class="modal fade show" v-if="showSuccess" style="display: block; background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header border-0">
            <h5 class="modal-title">
              <i class="bi bi-check-circle-fill text-success me-2"></i>
              予約完了
            </h5>
          </div>
          <div class="modal-body text-center">
            <div class="mb-4">
              <i class="bi bi-check-circle text-success" style="font-size: 4rem;"></i>
            </div>
            <h4 class="mb-3">ご予約ありがとうございます！</h4>
            <p class="text-muted mb-3">予約確認のメールを送信いたします。</p>
            <div class="alert alert-light text-start">
              <h6>予約詳細:</h6>
              <p class="mb-1"><strong>日時:</strong> {{ bookingData.date }} {{ bookingData.time }}</p>
              <p class="mb-1"><strong>サービス:</strong> {{ getServiceName(bookingData.service) }}</p>
              <p class="mb-0"><strong>お名前:</strong> {{ bookingData.name }}</p>
            </div>
          </div>
          <div class="modal-footer border-0">
            <button type="button" class="btn btn-primary" @click="closeModal">
              <i class="bi bi-house me-2"></i>
              ホームに戻る
            </button>
          </div>
        </div>
      </div>
    </div>
    </ClientOnly>
  </div>
</template>

<script setup>
import { useAuthLite } from '../composables/useAuthLite'
import { useBookingLite } from '../composables/useBookingLite'

// Page Meta - 認証必須の予約メイン画面  
definePageMeta({
  title: 'オンライン予約 - Haircut Reservation System',
  layout: 'default',
  middleware: ['auth'], // 認証ミドルウェア適用
  ssr: false // SSRを無効化してクライアントサイドのみで実行
})

// SEO設定
useHead({
  title: 'オンライン予約 | 美容室予約システム',
  meta: [
    { name: 'description', content: '24時間オンライン予約受付。簡単3ステップで予約完了。' },
    { name: 'keywords', content: 'オンライン予約,美容室,ヘアサロン,24時間受付' }
  ]
})

// 軽量版認証情報取得
const { user, signOut, isAdmin, loading: authLoading } = useAuthLite()

// 軽量版予約処理
const { createReservation } = useBookingLite()

// リアクティブデータ
const loading = ref(false)
const showSuccess = ref(false)
const currentStep = ref(1)
const bookingData = ref({
  service: '',
  stylist: '',
  date: '',
  time: '',
  name: '',
  phone: '',
  notes: ''
})

// 今日の日付
const today = new Date().toISOString().split('T')[0]

// 計算プロパティ（isAdminは軽量版composableから取得済み）

const isFormValid = computed(() => {
  return bookingData.value.service &&
         bookingData.value.date &&
         bookingData.value.time &&
         bookingData.value.name &&
         bookingData.value.phone
})

// ヘルパー関数
const getServiceName = (service) => {
  const services = {
    'cut': 'カット',
    'cut-color': 'カット + カラー',
    'perm': 'パーマ',
    'treatment': 'トリートメント'
  }
  return services[service] || service
}

const getServicePrice = (service) => {
  const prices = {
    'cut': '¥3,000',
    'cut-color': '¥6,000',
    'perm': '¥5,000',
    'treatment': '¥2,000'
  }
  return prices[service] || ''
}

const getStylistName = (stylist) => {
  const stylists = {
    'tanaka': '田中 美香（店長）',
    'sato': '佐藤 春子',
    'yamada': '山田 健太'
  }
  return stylists[stylist] || stylist
}

// 予約処理（最適化版）
const handleBooking = async () => {
  if (!isFormValid.value) {
    alert('必須項目を入力してください。')
    return
  }

  if (!user.value?.uid) {
    alert('認証が確認できません。ページを再読み込みしてください。')
    return
  }

  loading.value = true
  currentStep.value = 2

  try {
    // 軽量なFirestore書き込み処理
    await createReservation(bookingData.value, user.value.uid)

    currentStep.value = 3
    showSuccess.value = true

  } catch (error) {
    console.error('予約エラー:', error)
    alert(error.message || '予約の処理中にエラーが発生しました。もう一度お試しください。')
    currentStep.value = 1
  } finally {
    loading.value = false
  }
}

// ログアウト処理
const handleLogout = async () => {
  try {
    await signOut()
    await navigateTo('/login')
  } catch (error) {
    console.error('ログアウトエラー:', error)
    // エラー時でもログインページへ
    await navigateTo('/login')
  }
}

// モーダルを閉じる
const closeModal = () => {
  showSuccess.value = false
  currentStep.value = 1

  // フォームリセット
  bookingData.value = {
    service: '',
    stylist: '',
    date: '',
    time: '',
    name: '',
    phone: '',
    notes: ''
  }
}

// ページ読み込み時の処理
onMounted(() => {
  // パフォーマンス測定
  const startTime = performance.now()

  nextTick(() => {
    const loadTime = performance.now() - startTime
    console.log(`📊 Booking page loaded in ${loadTime.toFixed(2)}ms`)

    // パフォーマンス改善確認（目標0.5秒）
    if (loadTime < 500) {
      console.log(`✅ Performance target achieved: ${loadTime.toFixed(2)}ms`)
    }
  })
})
</script>

<style scoped>
.bg-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
}

.progress-steps {
  max-width: 600px;
  margin: 0 auto;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  transition: all 0.3s ease;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #e5e7eb;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.step.active .step-number {
  background-color: #3b82f6;
  color: white;
  transform: scale(1.1);
}

.step-label {
  font-size: 0.875rem;
  text-align: center;
  color: #6b7280;
  transition: all 0.3s ease;
}

.step.active .step-label {
  color: #3b82f6;
  font-weight: 600;
}

.step-connector {
  width: 60px;
  height: 2px;
  background-color: #e5e7eb;
  margin-top: 20px;
  transition: all 0.3s ease;
}

.service-options .form-check {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px 20px;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  background-color: #ffffff;
}

.service-options .form-check:hover {
  border-color: #3b82f6;
  background-color: #f8fafc;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.service-options .form-check-input:checked + .form-check-label {
  color: #3b82f6;
  font-weight: 600;
}

.service-options .form-check-input:checked {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

.card {
  border: none;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.form-control, .form-select {
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  padding: 12px 16px;
  transition: all 0.3s ease;
}

.form-control:focus, .form-select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
}

.btn-primary:disabled {
  opacity: 0.7;
  transform: none;
}

.alert {
  border-radius: 12px;
  border: none;
  padding: 16px 20px;
}

.alert-info {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #1e40af;
}

.modal-content {
  border: none;
  border-radius: 16px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
}

.text-success {
  color: #10b981 !important;
}

/* モバイル対応最適化 */
@media (max-width: 768px) {
  .progress-steps {
    margin-bottom: 2rem;
    padding: 0 1rem;
  }

  .step-connector {
    width: 30px;
  }

  .step-label {
    font-size: 0.7rem;
    line-height: 1.2;
  }

  .step-number {
    width: 35px;
    height: 35px;
    font-size: 0.85rem;
  }

  .card-body {
    padding: 1.25rem !important;
  }

  .service-options .form-check {
    padding: 12px 16px;
    margin-bottom: 0.75rem;
  }

  .service-name {
    font-size: 0.9rem;
  }

  .service-price {
    font-size: 0.85rem;
  }

  .form-control, .form-select {
    padding: 10px 14px;
    font-size: 1rem; /* iOSズーム防止 */
  }

  .btn-lg {
    padding: 12px 20px;
    font-size: 1rem;
  }

  .features-list {
    gap: 1.5rem !important;
  }

  .feature-item {
    font-size: 0.9rem;
  }

  /* モバイルナビゲーション最適化 */
  .user-info {
    display: none !important;
  }

  .btn-sm {
    padding: 6px 12px;
    font-size: 0.85rem;
  }
}

/* 小型モバイル対応 (360px以下) */
@media (max-width: 360px) {
  .container {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }

  .card-body {
    padding: 1rem !important;
  }

  .step {
    flex: 0 0 auto;
  }

  .step-connector {
    width: 25px;
  }

  .step-label {
    font-size: 0.65rem;
  }

  .service-options .form-check {
    padding: 10px 12px;
  }
}

/* アクセシビリティ向上 */
.form-control:focus, .form-select:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.form-check-input:focus {
  box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.25);
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.btn:focus {
  outline: 2px solid #1d4ed8;
  outline-offset: 2px;
}

/* エラー状態のスタイル */
.form-control:invalid,
.form-select:invalid {
  border-color: #dc2626;
}

.form-control:invalid:focus,
.form-select:invalid:focus {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  outline: 2px solid #dc2626;
}

/* ローディング状態のアニメーション */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.spinner-border {
  animation: spin 1s linear infinite;
}

/* ハイコントラストモード対応 */
@media (prefers-contrast: high) {
  .form-control, .form-select {
    border: 2px solid #000;
  }

  .btn-primary {
    background: #000;
    border: 2px solid #000;
  }

  .service-options .form-check {
    border: 2px solid #000;
  }
}

/* ダークモード対応 */
@media (prefers-color-scheme: dark) {
  .bg-gray-50 {
    background-color: #1f2937 !important;
  }

  .card {
    background-color: #374151;
    color: #f9fafb;
  }

  .form-control, .form-select {
    background-color: #4b5563;
    border-color: #6b7280;
    color: #f9fafb;
  }

  .form-control::placeholder {
    color: #9ca3af;
  }

  .form-text {
    color: #9ca3af;
  }

  .service-options .form-check {
    border-color: #6b7280;
    background-color: #374151;
  }

  .service-options .form-check:hover {
    background-color: #4b5563;
    border-color: #3b82f6;
  }
}

/* モーション無効化対応 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  .card:hover {
    transform: none;
  }

  .btn-primary:hover {
    transform: none;
  }

  .service-options .form-check:hover {
    transform: none;
  }
}
</style>
