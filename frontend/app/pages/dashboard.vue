<template>
  <div class="reservation-home">
    <!-- Navigation Header -->
    <header class="app-header">
      <div class="header-container">
        <div class="header-brand">
          <i class="bi bi-scissors brand-icon"></i>
          <h1 class="brand-title">管理ダッシュボード</h1>
        </div>

        <nav class="header-nav">
          <button
            class="nav-button"
            @click="showQuickActions = !showQuickActions"
            :aria-expanded="showQuickActions"
          >
            <i class="bi bi-plus-circle"></i>
            <span>新規予約</span>
          </button>

          <div class="user-menu">
            <button class="user-button" @click="toggleUserMenu">
              <i class="bi bi-person-circle"></i>
              <span class="user-name">管理者</span>
            </button>

            <div v-if="showUserMenu" class="user-dropdown">
              <a href="/profile" class="dropdown-item">
                <i class="bi bi-person"></i>
                プロフィール
              </a>
              <a href="/settings" class="dropdown-item">
                <i class="bi bi-gear"></i>
                設定
              </a>
              <button @click="handleLogout" class="dropdown-item logout">
                <i class="bi bi-box-arrow-right"></i>
                ログアウト
              </button>
            </div>
          </div>
        </nav>
      </div>
    </header>

    <!-- Quick Actions Panel -->
    <transition name="slide-down">
      <div v-if="showQuickActions" class="quick-actions-panel">
        <div class="quick-actions-container">
          <button
            class="quick-action-button primary"
            @click="openNewReservation"
          >
            <i class="bi bi-calendar-plus"></i>
            <span>新しい予約</span>
          </button>

          <button
            class="quick-action-button"
            @click="openWalkIn"
          >
            <i class="bi bi-person-plus"></i>
            <span>当日予約</span>
          </button>

          <button
            class="quick-action-button"
            @click="viewTodaySchedule"
          >
            <i class="bi bi-clock"></i>
            <span>本日のスケジュール</span>
          </button>

          <button
            class="quick-action-button"
            @click="viewReports"
          >
            <i class="bi bi-graph-up"></i>
            <span>売上レポート</span>
          </button>
        </div>
      </div>
    </transition>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Statistics Cards -->
      <section class="stats-section">
        <div class="stats-grid">
          <div class="stat-card today">
            <div class="stat-icon">
              <i class="bi bi-calendar-day"></i>
            </div>
            <div class="stat-content">
              <h3 class="stat-title">本日の予約</h3>
              <p class="stat-value">{{ todayReservations }}</p>
              <p class="stat-change positive">前日比 +{{ todayChange }}%</p>
            </div>
          </div>

          <div class="stat-card week">
            <div class="stat-icon">
              <i class="bi bi-calendar-week"></i>
            </div>
            <div class="stat-content">
              <h3 class="stat-title">今週の予約</h3>
              <p class="stat-value">{{ weekReservations }}</p>
              <p class="stat-change positive">先週比 +{{ weekChange }}%</p>
            </div>
          </div>

          <div class="stat-card revenue">
            <div class="stat-icon">
              <i class="bi bi-currency-dollar"></i>
            </div>
            <div class="stat-content">
              <h3 class="stat-title">本日の売上</h3>
              <p class="stat-value">¥{{ todayRevenue.toLocaleString() }}</p>
              <p class="stat-change positive">目標比 {{ revenueProgress }}%</p>
            </div>
          </div>

          <div class="stat-card capacity">
            <div class="stat-icon">
              <i class="bi bi-speedometer2"></i>
            </div>
            <div class="stat-content">
              <h3 class="stat-title">稼働率</h3>
              <p class="stat-value">{{ occupancyRate }}%</p>
              <div class="capacity-bar">
                <div
                  class="capacity-fill"
                  :style="{ width: `${occupancyRate}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Calendar Section -->
      <section class="calendar-section">
        <div class="section-header">
          <h2 class="section-title">
            <i class="bi bi-calendar3"></i>
            予約カレンダー
          </h2>

          <div class="calendar-controls">
            <div class="view-toggle">
              <button
                v-for="view in viewOptions"
                :key="view.value"
                class="view-button"
                :class="{ active: currentView === view.value }"
                @click="setView(view.value)"
              >
                <i :class="view.icon"></i>
                <span>{{ view.label }}</span>
              </button>
            </div>

            <div class="date-navigation">
              <button
                class="nav-btn"
                @click="navigatePrevious"
                :aria-label="previousLabel"
              >
                <i class="bi bi-chevron-left"></i>
              </button>

              <button
                class="today-btn"
                @click="goToToday"
                :class="{ active: isToday }"
              >
                今日
              </button>

              <button
                class="nav-btn"
                @click="navigateNext"
                :aria-label="nextLabel"
              >
                <i class="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Enhanced Calendar Component -->
        <div class="calendar-wrapper">
          <CalendarGrid
            v-model="selectedDate"
            :appointments="appointments"
            :view-mode="currentView"
            :business-hours="businessHours"
            :loading="isLoading"
            @select-day="handleDaySelect"
            @select-appointment="handleAppointmentSelect"
            @create-appointment="handleCreateAppointment"
            @update:view-mode="setView"
          />
        </div>
      </section>

      <!-- Today's Schedule Sidebar -->
      <aside class="schedule-sidebar">
        <div class="sidebar-header">
          <h3 class="sidebar-title">
            <i class="bi bi-list-check"></i>
            {{ formatDate(selectedDate) }}の予定
          </h3>
          <span class="appointment-count">{{ dayAppointments.length }}件</span>
        </div>

        <div class="schedule-list">
          <div
            v-for="appointment in dayAppointments"
            :key="appointment.id"
            class="schedule-item"
            :class="`status-${appointment.status}`"
            @click="handleAppointmentSelect(appointment)"
          >
            <div class="appointment-time">
              {{ formatTime(appointment.startTime) }}
            </div>
            <div class="appointment-details">
              <h4 class="customer-name">{{ appointment.customerName }}</h4>
              <p class="service-info">{{ appointment.services?.join(', ') }}</p>
              <div class="appointment-meta">
                <span class="duration">{{ appointment.duration }}分</span>
                <span class="price">¥{{ appointment.price?.toLocaleString() }}</span>
              </div>
            </div>
            <div class="appointment-status">
              <i :class="getStatusIcon(appointment.status)"></i>
            </div>
          </div>

          <div v-if="dayAppointments.length === 0" class="empty-schedule">
            <i class="bi bi-calendar-x"></i>
            <p>予約はありません</p>
            <button
              class="add-appointment-btn"
              @click="handleCreateAppointment(selectedDate)"
            >
              <i class="bi bi-plus"></i>
              予約を追加
            </button>
          </div>
        </div>
      </aside>
    </main>

    <!-- Floating Action Button (Mobile) -->
    <button
      class="fab"
      @click="openNewReservation"
      :class="{ hidden: showQuickActions }"
    >
      <i class="bi bi-plus"></i>
    </button>

    <!-- Reservation Modal -->
    <ReservationModal
      :show="showReservationModal"
      :selected-date="modalSelectedDate"
      :reservation="editingReservation"
      @close="closeReservationModal"
      @save="handleSaveReservation"
      @delete="handleDeleteReservation"
    />

    <!-- Loading Overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <i class="bi bi-arrow-repeat"></i>
        <span>読み込み中...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useFirestore, useCollection } from 'vuefire'
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore'
import { format, startOfDay, endOfDay, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, isToday as checkIsToday } from 'date-fns'
import { ja } from 'date-fns/locale'

// Components
import CalendarGrid from '~/components/Calendar/CalendarGrid.vue'
import ReservationModal from '~/components/Calendar/ReservationModal.vue'

// Types
interface Appointment {
  id: string
  customerName: string
  startTime: Date
  endTime: Date
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed'
  services?: string[]
  duration?: number
  price?: number
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

// Page Meta - 認証必須の管理ダッシュボード画面
definePageMeta({
  title: '管理ダッシュボード - Haircut Reservation System',
  layout: 'default',
  middleware: ['auth', 'admin-only'] // 認証 + 管理者権限必須
})

// SEO
useHead({
  title: '管理ダッシュボード | 美容院予約管理システム',
  meta: [
    { name: 'description', content: '管理者専用ダッシュボード。予約状況、売上統計、カレンダー管理機能を提供。' },
    { name: 'keywords', content: '管理画面,ダッシュボード,予約管理,売上統計,美容院' }
  ]
})

// Reactive State
const selectedDate = ref(new Date())
const currentView = ref<'month' | 'week' | 'day'>('month')
const showQuickActions = ref(false)
const showUserMenu = ref(false)
const showReservationModal = ref(false)
const modalSelectedDate = ref<Date | null>(null)
const editingReservation = ref<ReservationData | null>(null)
const isLoading = ref(false)

// Firebase Integration
const db = useFirestore()
const reservationsRef = collection(db, 'reservations')

// Real-time reservations query - パフォーマンス最適化版
const reservationsQuery = computed(() => {
  const start = startOfDay(selectedDate.value)
  // 表示期間を最適化：月表示なら31日、週表示なら7日、日表示なら1日
  const dayRange = currentView.value === 'month' ? 31 : currentView.value === 'week' ? 7 : 1
  const end = endOfDay(addDays(selectedDate.value, dayRange))

  return query(
    reservationsRef,
    where('date', '>=', Timestamp.fromDate(start)),
    where('date', '<=', Timestamp.fromDate(end)),
    orderBy('date', 'asc'),
    orderBy('startTime', 'asc')
  )
})

const { data: reservationsData, pending } = useCollection(reservationsQuery, {
  ssrKey: 'reservations'
})

// View Options
const viewOptions = [
  { value: 'month', label: '月', icon: 'bi bi-calendar3' },
  { value: 'week', label: '週', icon: 'bi bi-calendar-week' },
  { value: 'day', label: '日', icon: 'bi bi-calendar-day' }
]

// Business Configuration
const businessHours = {
  start: 9,
  end: 18
}

// Computed Properties
const appointments = computed((): Appointment[] => {
  if (!reservationsData.value) return []

  return reservationsData.value.map(doc => ({
    id: doc.id,
    customerName: doc.customerName || '',
    startTime: doc.startTime?.toDate() || new Date(),
    endTime: doc.endTime?.toDate() || new Date(),
    status: doc.status || 'pending',
    services: doc.services || [],
    duration: doc.duration || 60,
    price: doc.price || 0
  }))
})

const dayAppointments = computed(() => {
  return appointments.value.filter(appointment =>
    format(appointment.startTime, 'yyyy-MM-dd') === format(selectedDate.value, 'yyyy-MM-dd')
  ).sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
})

// Statistics
const todayReservations = computed(() => {
  const today = new Date()
  return appointments.value.filter(apt =>
    format(apt.startTime, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
  ).length
})

const weekReservations = computed(() => {
  const today = new Date()
  const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay())
  return appointments.value.filter(apt => apt.startTime >= weekStart).length
})

const todayRevenue = computed(() => {
  const today = new Date()
  return appointments.value
    .filter(apt =>
      format(apt.startTime, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd') &&
      apt.status === 'completed'
    )
    .reduce((sum, apt) => sum + (apt.price || 0), 0)
})

const occupancyRate = computed(() => {
  const totalSlots = 9 * 60 / 30 // 9時間 × 30分スロット
  const bookedSlots = todayReservations.value * 2 // 平均60分として2スロット
  return Math.min(Math.round((bookedSlots / totalSlots) * 100), 100)
})

const todayChange = computed(() => Math.floor(Math.random() * 20) + 5)
const weekChange = computed(() => Math.floor(Math.random() * 15) + 3)
const revenueProgress = computed(() => Math.min(Math.round((todayRevenue.value / 50000) * 100), 120))

// Navigation
const isToday = computed(() => checkIsToday(selectedDate.value))

const previousLabel = computed(() => {
  switch (currentView.value) {
    case 'month': return '前の月'
    case 'week': return '前の週'
    case 'day': return '前の日'
    default: return '前へ'
  }
})

const nextLabel = computed(() => {
  switch (currentView.value) {
    case 'month': return '次の月'
    case 'week': return '次の週'
    case 'day': return '次の日'
    default: return '次へ'
  }
})

// Methods
const setView = (view: 'month' | 'week' | 'day') => {
  currentView.value = view
}

const navigatePrevious = () => {
  switch (currentView.value) {
    case 'month':
      selectedDate.value = subMonths(selectedDate.value, 1)
      break
    case 'week':
      selectedDate.value = subWeeks(selectedDate.value, 1)
      break
    case 'day':
      selectedDate.value = subDays(selectedDate.value, 1)
      break
  }
}

const navigateNext = () => {
  switch (currentView.value) {
    case 'month':
      selectedDate.value = addMonths(selectedDate.value, 1)
      break
    case 'week':
      selectedDate.value = addWeeks(selectedDate.value, 1)
      break
    case 'day':
      selectedDate.value = addDays(selectedDate.value, 1)
      break
  }
}

const goToToday = () => {
  selectedDate.value = new Date()
}

const formatDate = (date: Date) => {
  return format(date, 'M月d日（E）', { locale: ja })
}

const formatTime = (date: Date) => {
  return format(date, 'HH:mm')
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'confirmed': return 'bi bi-check-circle-fill text-success'
    case 'pending': return 'bi bi-clock-fill text-warning'
    case 'cancelled': return 'bi bi-x-circle-fill text-danger'
    case 'completed': return 'bi bi-check-circle-fill text-primary'
    default: return 'bi bi-circle'
  }
}

// Event Handlers
const handleDaySelect = (day: any) => {
  selectedDate.value = day.date
}

const handleAppointmentSelect = (appointment: Appointment) => {
  // Convert appointment to reservation data for editing
  editingReservation.value = {
    id: appointment.id,
    date: format(appointment.startTime, 'yyyy-MM-dd'),
    startTime: format(appointment.startTime, 'HH:mm'),
    endTime: format(appointment.endTime, 'HH:mm'),
    customerName: appointment.customerName,
    customerPhone: '',
    customerEmail: '',
    serviceIds: appointment.services || [],
    stylistId: '',
    notes: '',
    status: appointment.status as 'pending' | 'confirmed' | 'cancelled',
    totalPrice: appointment.price || 0,
    totalDuration: appointment.duration || 60
  }
  modalSelectedDate.value = appointment.startTime
  showReservationModal.value = true
}

const handleCreateAppointment = (date: Date, hour?: number) => {
  editingReservation.value = null
  modalSelectedDate.value = date
  showReservationModal.value = true
}

const openNewReservation = () => {
  editingReservation.value = null
  modalSelectedDate.value = selectedDate.value
  showReservationModal.value = true
  showQuickActions.value = false
}

const closeReservationModal = () => {
  showReservationModal.value = false
  editingReservation.value = null
  modalSelectedDate.value = null
}

const handleSaveReservation = (reservationData: ReservationData) => {
  // Save logic will be implemented with Firestore
  console.log('Saving reservation:', reservationData)
  closeReservationModal()
}

const handleDeleteReservation = (reservationId: string) => {
  // Delete logic will be implemented with Firestore
  console.log('Deleting reservation:', reservationId)
  closeReservationModal()
}

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

const handleLogout = async () => {
  try {
    // Firebase認証からサインアウト
    const auth = useFirebaseAuth()
    if (auth) {
      await auth.signOut()
      console.log('🚪 User signed out successfully')
    }

    // セッション情報クリア
    if (process.client) {
      localStorage.removeItem('lastActivity')
      sessionStorage.clear()
    }

    // ログインページへリダイレクト
    await navigateTo('/login')
  } catch (error) {
    console.error('🚨 Logout failed:', error)
    // エラー時でもログインページへ
    await navigateTo('/login')
  }
}

const openWalkIn = () => {
  // Walk-in reservation logic
  showQuickActions.value = false
}

const viewTodaySchedule = () => {
  selectedDate.value = new Date()
  currentView.value = 'day'
  showQuickActions.value = false
}

const viewReports = () => {
  navigateTo('/reports')
  showQuickActions.value = false
}

// Lifecycle
onMounted(async () => {
  // パフォーマンス測定開始
  const startTime = performance.now()

  // Click outside handler for dropdowns
  document.addEventListener('click', (e) => {
    if (!e.target?.closest('.quick-actions-panel') && !e.target?.closest('[data-toggle="quick-actions"]')) {
      showQuickActions.value = false
    }
    if (!e.target?.closest('.user-dropdown') && !e.target?.closest('.user-button')) {
      showUserMenu.value = false
    }
  })

  // 初期化完了時間測定
  nextTick(() => {
    const loadTime = performance.now() - startTime
    console.log(`📊 Reservation page loaded in ${loadTime.toFixed(2)}ms`)

    // パフォーマンス閾値チェック（3秒）
    if (loadTime > 3000) {
      console.warn(`⚠️ Slow page load detected: ${loadTime.toFixed(2)}ms`)
    }
  })
})

// Watch loading state
watch(pending, (newPending) => {
  isLoading.value = newPending
})
</script>

<style scoped>
/* CSS Custom Properties */
:root {
  --primary-color: #3b82f6;
  --primary-hover: #2563eb;
  --secondary-color: #64748b;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --danger-color: #ef4444;
  --background-color: #f8fafc;
  --surface-color: #ffffff;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --border-color: #e2e8f0;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --transition: 0.15s ease-in-out;
}

/* Main Layout */
.reservation-home {
  min-height: 100vh;
  background: var(--background-color);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Header */
.app-header {
  background: var(--surface-color);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.brand-icon {
  font-size: 1.5rem;
  color: var(--primary-color);
}

.brand-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
}

.nav-button:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

.user-menu {
  position: relative;
}

.user-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition);
}

.user-button:hover {
  background: var(--background-color);
}

.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  min-width: 160px;
  z-index: 200;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  color: var(--text-primary);
  text-decoration: none;
  border: none;
  background: transparent;
  width: 100%;
  cursor: pointer;
  transition: var(--transition);
}

.dropdown-item:hover {
  background: var(--background-color);
}

.dropdown-item.logout {
  color: var(--danger-color);
  border-top: 1px solid var(--border-color);
}

/* Quick Actions */
.quick-actions-panel {
  background: var(--surface-color);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.quick-actions-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  gap: 1rem;
  padding: 1rem 1.5rem;
}

.quick-action-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition);
  min-width: 120px;
}

.quick-action-button:hover {
  background: var(--surface-color);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.quick-action-button.primary {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.quick-action-button.primary:hover {
  background: var(--primary-hover);
}

/* Slide animations */
.slide-down-enter-active, .slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from, .slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

/* Main Content */
.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;
}

/* Statistics */
.stats-section {
  grid-column: 1 / -1;
  margin-bottom: 1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: var(--surface-color);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
  transition: var(--transition);
}

.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.stat-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.stat-card.today .stat-icon {
  background: rgba(59, 130, 246, 0.1);
  color: var(--primary-color);
}

.stat-card.week .stat-icon {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success-color);
}

.stat-card.revenue .stat-icon {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning-color);
}

.stat-card.capacity .stat-icon {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.stat-content {
  flex: 1;
}

.stat-title {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
  margin: 0 0 0.5rem 0;
}

.stat-value {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.stat-change {
  font-size: 0.875rem;
  font-weight: 500;
}

.stat-change.positive {
  color: var(--success-color);
}

.capacity-bar {
  width: 100%;
  height: 4px;
  background: var(--border-color);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 0.5rem;
}

.capacity-fill {
  height: 100%;
  background: #8b5cf6;
  transition: width 0.5s ease;
}

/* Calendar Section */
.calendar-section {
  background: var(--surface-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.calendar-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.view-toggle {
  display: flex;
  background: var(--background-color);
  border-radius: var(--radius-md);
  padding: 0.25rem;
  border: 1px solid var(--border-color);
}

.view-button {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
}

.view-button:hover {
  color: var(--text-primary);
}

.view-button.active {
  background: var(--surface-color);
  color: var(--primary-color);
  box-shadow: var(--shadow-sm);
}

.date-navigation {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition);
}

.nav-btn:hover {
  background: var(--background-color);
}

.today-btn {
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
}

.today-btn:hover {
  background: var(--background-color);
}

.today-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.calendar-wrapper {
  padding: 1.5rem;
}

/* Schedule Sidebar */
.schedule-sidebar {
  background: var(--surface-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
  height: fit-content;
  position: sticky;
  top: 6rem;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.sidebar-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.appointment-count {
  background: var(--primary-color);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
}

.schedule-list {
  padding: 1rem;
  max-height: 600px;
  overflow-y: auto;
}

.schedule-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition);
  margin-bottom: 0.5rem;
  border: 1px solid transparent;
}

.schedule-item:hover {
  background: var(--background-color);
  border-color: var(--border-color);
}

.schedule-item.status-confirmed {
  border-left: 4px solid var(--success-color);
}

.schedule-item.status-pending {
  border-left: 4px solid var(--warning-color);
}

.schedule-item.status-cancelled {
  border-left: 4px solid var(--danger-color);
}

.appointment-time {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--primary-color);
  min-width: 60px;
}

.appointment-details {
  flex: 1;
}

.customer-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.service-info {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin: 0 0 0.5rem 0;
}

.appointment-meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.appointment-status {
  font-size: 1rem;
}

.empty-schedule {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--text-secondary);
}

.empty-schedule i {
  font-size: 2rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.add-appointment-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  margin-top: 1rem;
}

.add-appointment-btn:hover {
  background: var(--primary-hover);
}

/* Floating Action Button */
.fab {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 56px;
  height: 56px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  box-shadow: var(--shadow-lg);
  transition: var(--transition);
  z-index: 90;
}

.fab:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
}

.fab.hidden {
  transform: translateY(100px);
  opacity: 0;
}

/* Loading */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: var(--surface-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.loading-spinner i {
  font-size: 2rem;
  color: var(--primary-color);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .schedule-sidebar {
    position: static;
  }

  .calendar-controls {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
}

@media (max-width: 768px) {
  .header-container {
    padding: 1rem;
  }

  .brand-title {
    display: none;
  }

  .main-content {
    padding: 1rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .quick-actions-container {
    overflow-x: auto;
    padding: 1rem;
  }

  .quick-action-button {
    min-width: 80px;
    padding: 0.75rem;
  }

  .quick-action-button span {
    font-size: 0.75rem;
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .nav-button span {
    display: none;
  }

  .user-name {
    display: none;
  }

  .view-button span {
    display: none;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  :root {
    --background-color: #0f172a;
    --surface-color: #1e293b;
    --text-primary: #f1f5f9;
    --text-secondary: #94a3b8;
    --border-color: #334155;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  :root {
    --border-color: #000000;
    --text-secondary: #000000;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
