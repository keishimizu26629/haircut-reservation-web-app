<template>
  <div class="reservation-calendar-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <i class="bi bi-calendar3"></i>
          予約管理カレンダー
        </h1>
        <div class="header-actions">
          <button
            class="btn btn-primary"
            @click="openCreateModal"
          >
            <i class="bi bi-plus-circle"></i>
            新規予約
          </button>
        </div>
      </div>
    </div>

    <!-- Calendar Grid -->
    <div class="calendar-section">
      <CalendarGrid
        v-model="selectedDate"
        :appointments="formattedAppointments"
        :view-mode="viewMode"
        :business-hours="businessHours"
        @update:view-mode="viewMode = $event"
        @select-day="handleDaySelect"
        @select-appointment="handleAppointmentSelect"
        @create-appointment="handleCreateAppointment"
        @select-time-slot="handleTimeSlotSelect"
      />
    </div>

    <!-- Reservation Modal -->
    <ReservationModal
      :show="showModal"
      :selected-date="modalSelectedDate"
      :reservation="editingReservation"
      @close="closeModal"
      @save="handleSaveReservation"
      @delete="handleDeleteReservation"
    />

    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">
        <i class="bi bi-arrow-repeat"></i>
        <span>読み込み中...</span>
      </div>
    </div>

    <!-- Toast Notifications -->
    <div v-if="notifications.length > 0" class="toast-container">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="toast"
        :class="`toast-${notification.type}`"
      >
        <div class="toast-header">
          <i
            class="bi"
            :class="{
              'bi-check-circle': notification.type === 'success',
              'bi-exclamation-triangle': notification.type === 'warning',
              'bi-x-circle': notification.type === 'error',
              'bi-info-circle': notification.type === 'info'
            }"
          ></i>
          <span>{{ notification.title }}</span>
          <button
            class="toast-close"
            @click="removeNotification(notification.id)"
          >
            <i class="bi bi-x"></i>
          </button>
        </div>
        <div class="toast-body">
          {{ notification.message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore'
import { useTenant } from '../../composables/useTenant'
import { useOptimizedReservations } from '../../composables/useOptimizedReservations'
import type { Unsubscribe } from 'firebase/firestore'

// Components
import CalendarGrid from '~/components/Calendar/CalendarGrid.vue'
import ReservationModal from '~/components/Calendar/ReservationModal.vue'

// Types
interface Appointment {
  id: string
  title: string
  startTime: Date
  endTime: Date
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed'
  customerName: string
  duration?: number
}

interface ReservationData {
  id?: string
  date: string
  startTime: string
  endTime: string
  customerName: string
  customerPhone: string
  customerEmail: string
  serviceIds: string[]
  stylistId: string
  notes: string
  status: 'pending' | 'confirmed' | 'cancelled'
  totalPrice: number
  totalDuration: number
}

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
}

// Page Meta
definePageMeta({
  title: '予約管理カレンダー',
  description: 'Googleカレンダー風の予約管理インターフェース'
})

// Reactive State
const selectedDate = ref(new Date())
const viewMode = ref<'month' | 'week' | 'day'>('month')
const showModal = ref(false)
const modalSelectedDate = ref<Date | null>(null)
const editingReservation = ref<ReservationData | null>(null)
const reservations = ref<ReservationData[]>([])
const loading = ref(false)
const notifications = ref<Notification[]>([])

// Tenant & Firestore
const { getCurrentTenant, getTenantPath } = useTenant()
const { $firestore } = useNuxtApp()
let unsubscribe: Unsubscribe | null = null

// Optimized Reservations
const {
  reservations: optimizedReservations,
  loading: optimizedLoading,
  loadReservationsByDateRange,
  getPerformanceMetrics
} = useOptimizedReservations()

// Business Configuration
const businessHours = {
  start: 9,
  end: 18
}

// Computed Properties
const formattedAppointments = computed((): Appointment[] => {
  return reservations.value.map(reservation => ({
    id: reservation.id!,
    title: `${reservation.customerName} - ${getServiceNames(reservation.serviceIds).join(', ')}`,
    startTime: new Date(`${reservation.date}T${reservation.startTime}`),
    endTime: new Date(`${reservation.date}T${reservation.endTime}`),
    status: reservation.status === 'confirmed' ? 'confirmed' :
            reservation.status === 'cancelled' ? 'cancelled' :
            reservation.status === 'pending' ? 'pending' : 'completed',
    customerName: reservation.customerName,
    duration: reservation.totalDuration
  }))
})

// Helper Functions
const getServiceNames = (serviceIds: string[]): string[] => {
  // サンプルサービス情報（実際のアプリではAPIから取得）
  const services: Record<string, string> = {
    'cut': 'カット',
    'color': 'カラー',
    'perm': 'パーマ',
    'treatment': 'トリートメント'
  }

  return serviceIds.map(id => services[id] || id)
}

const generateNotificationId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9)
}

const showNotification = (type: Notification['type'], title: string, message: string) => {
  const notification: Notification = {
    id: generateNotificationId(),
    type,
    title,
    message
  }

  notifications.value.push(notification)

  // 5秒後に自動で削除
  setTimeout(() => {
    removeNotification(notification.id)
  }, 5000)
}

const removeNotification = (id: string) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

// Firestore Operations
const setupRealtimeListener = async () => {
  try {
    const tenant = getCurrentTenant()
    const reservationsPath = getTenantPath('reservations')
    const reservationsRef = collection($firestore, reservationsPath)

    const q = query(
      reservationsRef,
      orderBy('date', 'asc'),
      orderBy('startTime', 'asc')
    )

    unsubscribe = onSnapshot(q, (snapshot) => {
      const newReservations: ReservationData[] = []

      snapshot.forEach((doc) => {
        newReservations.push({
          id: doc.id,
          ...doc.data()
        } as ReservationData)
      })

      reservations.value = newReservations

      if (process.client) {
        console.log(`[Calendar] リアルタイム更新: ${newReservations.length}件の予約を取得`)
      }
    }, (error) => {
      console.error('リアルタイムリスナーエラー:', error)
      showNotification('error', 'データ取得エラー', '予約データの取得に失敗しました')
    })

  } catch (error) {
    console.error('リアルタイムリスナー設定エラー:', error)
    showNotification('error', '接続エラー', 'データベースへの接続に失敗しました')
  }
}

const saveReservation = async (reservationData: ReservationData): Promise<void> => {
  loading.value = true

  try {
    const tenant = getCurrentTenant()
    const reservationsPath = getTenantPath('reservations')
    const reservationsRef = collection($firestore, reservationsPath)

    if (reservationData.id) {
      // 更新
      const docRef = doc($firestore, reservationsPath, reservationData.id)
      await updateDoc(docRef, {
        ...reservationData,
        updatedAt: new Date()
      })
      showNotification('success', '予約更新', '予約が正常に更新されました')
    } else {
      // 新規作成
      await addDoc(reservationsRef, {
        ...reservationData,
        tenantId: tenant.id,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      showNotification('success', '予約作成', '新しい予約が作成されました')
    }

  } catch (error) {
    console.error('予約保存エラー:', error)
    showNotification('error', '保存エラー', '予約の保存に失敗しました')
    throw error
  } finally {
    loading.value = false
  }
}

const deleteReservation = async (reservationId: string): Promise<void> => {
  loading.value = true

  try {
    const reservationsPath = getTenantPath('reservations')
    const docRef = doc($firestore, reservationsPath, reservationId)

    await deleteDoc(docRef)
    showNotification('success', '予約削除', '予約が削除されました')

  } catch (error) {
    console.error('予約削除エラー:', error)
    showNotification('error', '削除エラー', '予約の削除に失敗しました')
    throw error
  } finally {
    loading.value = false
  }
}

// Event Handlers
const openCreateModal = () => {
  editingReservation.value = null
  modalSelectedDate.value = selectedDate.value
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingReservation.value = null
  modalSelectedDate.value = null
}

const handleDaySelect = (day: any) => {
  selectedDate.value = day.date
}

const handleAppointmentSelect = (appointment: Appointment) => {
  // 予約データを探して編集モードで開く
  const reservation = reservations.value.find(r => r.id === appointment.id)
  if (reservation) {
    editingReservation.value = reservation
    modalSelectedDate.value = appointment.startTime
    showModal.value = true
  }
}

const handleCreateAppointment = (date: Date, hour?: number) => {
  editingReservation.value = null
  modalSelectedDate.value = date
  showModal.value = true
}

const handleTimeSlotSelect = (date: Date, hour: number) => {
  editingReservation.value = null
  modalSelectedDate.value = date
  showModal.value = true
}

const handleSaveReservation = async (reservationData: ReservationData) => {
  try {
    await saveReservation(reservationData)
    closeModal()
  } catch (error) {
    // エラーは saveReservation 内で処理済み
  }
}

const handleDeleteReservation = async (reservationId: string) => {
  try {
    await deleteReservation(reservationId)
    closeModal()
  } catch (error) {
    // エラーは deleteReservation 内で処理済み
  }
}

// Lifecycle
onMounted(async () => {
  await setupRealtimeListener()
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})
</script>

<style scoped>
.reservation-calendar-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding: 1.5rem;
}

.page-header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 1.5rem 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.page-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
  font-size: 1.75rem;
  font-weight: 600;
  color: #333;
}

.page-title i {
  color: #007bff;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
  border: 1px solid transparent;
  cursor: pointer;
}

.btn-primary {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.btn-primary:hover {
  background: #0056b3;
  border-color: #0056b3;
  transform: translateY(-1px);
}

.calendar-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(2px);
}

.loading-spinner {
  background: white;
  padding: 2rem 3rem;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.loading-spinner i {
  font-size: 2rem;
  color: #007bff;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.toast-container {
  position: fixed;
  top: 2rem;
  right: 2rem;
  z-index: 1500;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.toast {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 320px;
  max-width: 480px;
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem 0.5rem 1.25rem;
  font-weight: 600;
}

.toast-success .toast-header {
  color: #28a745;
}

.toast-error .toast-header {
  color: #dc3545;
}

.toast-warning .toast-header {
  color: #ffc107;
}

.toast-info .toast-header {
  color: #007bff;
}

.toast-success {
  border-left: 4px solid #28a745;
}

.toast-error {
  border-left: 4px solid #dc3545;
}

.toast-warning {
  border-left: 4px solid #ffc107;
}

.toast-info {
  border-left: 4px solid #007bff;
}

.toast-close {
  background: none;
  border: none;
  margin-left: auto;
  color: #6c757d;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.toast-close:hover {
  background: #f8f9fa;
  color: #333;
}

.toast-body {
  padding: 0.5rem 1.25rem 1rem 1.25rem;
  color: #6c757d;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .reservation-calendar-page {
    padding: 1rem;
  }

  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .calendar-section {
    padding: 1rem;
  }

  .toast-container {
    top: 1rem;
    right: 1rem;
    left: 1rem;
  }

  .toast {
    min-width: auto;
    max-width: none;
  }
}
</style>
