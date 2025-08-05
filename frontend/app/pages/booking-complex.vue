<template>
  <div class="booking-page">
    <div class="container py-5">
      <!-- ページヘッダー -->
      <div class="page-header text-center mb-5">
        <h1 class="display-5 fw-bold">ご予約</h1>
        <p class="lead text-muted">簡単3ステップでご予約完了</p>
      </div>

      <!-- プログレス表示 -->
      <BookingProgress :current-step="currentStep" />

      <!-- ステップコンテンツ -->
      <div class="booking-content">
        <!-- ステップ1: サービス選択 -->
        <div v-if="currentStep === 1" class="step-content">
          <ServiceSelection
            v-model="bookingData.services"
            :loading="loading"
            @next="goToStep(2)"
          />
        </div>

        <!-- ステップ2: スタイリスト選択 -->
        <div v-if="currentStep === 2" class="step-content">
          <StylistSelection
            v-model="bookingData.stylist"
            v-model:any-stylist="bookingData.isAnyStylietOk"
            :selected-services="bookingData.services"
            :loading="loading"
            @next="goToStep(3)"
            @back="goToStep(1)"
          />
        </div>

        <!-- ステップ3: 日時選択 -->
        <div v-if="currentStep === 3" class="step-content">
          <DateTimeSelection
            v-model:date="bookingData.date"
            v-model:time-slot="bookingData.timeSlot"
            :services="bookingData.services"
            :stylist="bookingData.stylist"
            :any-stylist="bookingData.isAnyStylietOk"
            :loading="loading"
            @next="goToStep(4)"
            @back="goToStep(2)"
          />
        </div>

        <!-- ステップ4: 顧客情報・確認 -->
        <div v-if="currentStep === 4" class="step-content">
          <BookingConfirmation
            v-model="bookingData"
            :loading="submitting"
            @submit="submitBooking"
            @back="goToStep(3)"
          />
        </div>

        <!-- ステップ5: 完了 -->
        <div v-if="currentStep === 5" class="step-content">
          <BookingComplete
            :booking-data="completedBooking"
            @new-booking="resetBooking"
            @go-dashboard="goToDashboard"
          />
        </div>
      </div>

      <!-- エラーメッセージ -->
      <div v-if="error" class="error-message">
        <div class="alert alert-danger d-flex align-items-center" role="alert">
          <i class="bi bi-exclamation-triangle-fill me-3"></i>
          <div>
            <strong>エラーが発生しました</strong><br>
            {{ error }}
          </div>
          <button
            type="button"
            class="btn-close ms-auto"
            @click="clearError"
            aria-label="エラーを閉じる"
          ></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BookingData, Service, Stylist, TimeSlot, CustomerInfo } from '~/types/booking'
import { BookingStatus } from '~/types/booking'

// ページ設定
definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

useHead({
  title: '予約フォーム - Beauty Salon Reservation'
})

// State
const currentStep = ref(1)
const loading = ref(false)
const submitting = ref(false)
const error = ref('')
const completedBooking = ref<BookingData | null>(null)

// 予約データの初期化
const initializeBookingData = (): BookingData => ({
  services: [],
  totalDuration: 0,
  totalPrice: 0,
  stylist: null,
  isAnyStylietOk: false,
  date: '',
  timeSlot: null,
  customerInfo: {
    name: '',
    email: '',
    phone: '',
    isNewCustomer: true
  },
  specialRequests: '',
  status: BookingStatus.DRAFT
})

const bookingData = ref<BookingData>(initializeBookingData())

// Computed
const totalDuration = computed(() => {
  return bookingData.value.services.reduce((total, service) => total + service.duration, 0)
})

const totalPrice = computed(() => {
  return bookingData.value.services.reduce((total, service) => total + service.price, 0)
})

// Methods
const goToStep = (step: number) => {
  if (step < 1 || step > 5) return

  // バリデーション
  if (step > currentStep.value && !validateCurrentStep()) {
    return
  }

  currentStep.value = step
  
  // ページトップにスクロール
  window.scrollTo({ top: 0, behavior: 'smooth' })
  
  // ステップ変更をアナウンス（アクセシビリティ）
  announceStepChange(step)
}

const validateCurrentStep = (): boolean => {
  clearError()

  switch (currentStep.value) {
    case 1: // サービス選択
      if (bookingData.value.services.length === 0) {
        error.value = 'サービスを選択してください'
        return false
      }
      break

    case 2: // スタイリスト選択
      if (!bookingData.value.isAnyStylietOk && !bookingData.value.stylist) {
        error.value = 'スタイリストを選択するか、「どなたでも可」をチェックしてください'
        return false
      }
      break

    case 3: // 日時選択
      if (!bookingData.value.date || !bookingData.value.timeSlot) {
        error.value = '日時を選択してください'
        return false
      }
      break
  }

  return true
}

const submitBooking = async (finalBookingData: BookingData) => {
  submitting.value = true
  clearError()

  try {
    // APIで予約を作成
    const response = await $fetch('/api/bookings', {
      method: 'POST',
      body: finalBookingData
    })

    if (response.success) {
      completedBooking.value = response.data
      goToStep(5)
    } else {
      throw new Error(response.error?.message || '予約の作成に失敗しました')
    }
  } catch (err: any) {
    error.value = err.message || '予約の送信中にエラーが発生しました'
    console.error('Booking submission error:', err)
  } finally {
    submitting.value = false
  }
}

const resetBooking = () => {
  bookingData.value = initializeBookingData()
  currentStep.value = 1
  completedBooking.value = null
  clearError()
  
  // ページトップにスクロール
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const goToDashboard = async () => {
  await navigateTo('/dashboard')
}

const clearError = () => {
  error.value = ''
}

const announceStepChange = (step: number) => {
  const stepNames = [
    '',
    'サービス選択',
    'スタイリスト選択', 
    '日時選択',
    '確認・予約',
    '予約完了'
  ]
  
  const message = `${stepNames[step]}ステップに移動しました`
  
  // Screen reader announcement
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', 'polite')
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'visually-hidden'
  announcement.textContent = message
  document.body.appendChild(announcement)
  
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

// 予約データの自動更新
watch([totalDuration, totalPrice], () => {
  bookingData.value.totalDuration = totalDuration.value
  bookingData.value.totalPrice = totalPrice.value
}, { immediate: true })

// ページ離脱警告（未保存データがある場合）
const hasUnsavedData = computed(() => {
  return currentStep.value > 1 && currentStep.value < 5 && bookingData.value.services.length > 0
})

onBeforeRouteLeave((to, from, next) => {
  if (hasUnsavedData.value) {
    const isConfirmed = confirm('入力中の予約データが失われます。ページを離れてもよろしいですか？')
    if (isConfirmed) {
      next()
    } else {
      next(false)
    }
  } else {
    next()
  }
})

// ページアンロード警告
const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  if (hasUnsavedData.value) {
    event.preventDefault()
    event.returnValue = ''
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

// SEO & Meta
useHead({
  meta: [
    { name: 'description', content: '美容院のオンライン予約システム。簡単3ステップでご予約が完了します。' },
    { property: 'og:title', content: '予約フォーム - Beauty Salon Reservation' },
    { property: 'og:description', content: '美容院のオンライン予約システム。簡単3ステップでご予約が完了します。' }
  ]
})
</script>

<style scoped>
.booking-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.page-header {
  padding: 2rem 0;
}

.page-header h1 {
  background: var(--beauty-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.booking-content {
  background: white;
  border-radius: 1.5rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  margin: 2rem 0;
  min-height: 60vh;
}

.step-content {
  animation: fadeInUp 0.5s ease-out;
}

.error-message {
  position: fixed;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1050;
  max-width: 500px;
  width: 90%;
}

.error-message .alert {
  border: none;
  border-radius: 1rem;
  box-shadow: 0 4px 20px rgba(220, 53, 69, 0.2);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .booking-content {
    padding: 1rem;
    margin: 1rem 0;
    border-radius: 1rem;
  }

  .page-header {
    padding: 1rem 0;
  }

  .page-header h1 {
    font-size: 2rem;
  }

  .error-message {
    top: 80px;
    width: 95%;
  }
}

/* アクセシビリティ用のフォーカス表示強化 */
:focus-visible {
  outline: 2px solid var(--beauty-primary);
  outline-offset: 2px;
}

/* ローディング状態のアニメーション */
.step-content[aria-busy="true"] {
  opacity: 0.7;
  pointer-events: none;
}

/* スキップリンク */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--beauty-primary);
  color: white;
  padding: 8px;
  text-decoration: none;
  border-radius: 4px;
  z-index: 1000;
}

.skip-link:focus {
  top: 6px;
}
</style>