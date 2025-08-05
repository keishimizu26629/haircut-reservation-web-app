<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-semibold text-gray-900">
              シンプル予約管理
            </h1>
            <span class="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {{ formatDate(new Date()) }}
            </span>
          </div>

          <div class="flex items-center space-x-4">
            <!-- 今日へ移動ボタン -->
            <button
              @click="goToToday"
              class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <i class="bi bi-calendar-today mr-2"></i>
              今日
            </button>

            <!-- 新規予約ボタン -->
            <button
              @click="createNewReservation"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <i class="bi bi-plus-lg mr-2"></i>
              新規予約
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div class="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="bi bi-calendar-check text-blue-500 text-2xl"></i>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">今日の予約</dt>
                  <dd class="text-lg font-medium text-gray-900">{{ todayReservationsCount }}件</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="bi bi-clock text-yellow-500 text-2xl"></i>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">予約済み</dt>
                  <dd class="text-lg font-medium text-gray-900">{{ pendingReservationsCount }}件</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="bi bi-check-circle text-green-500 text-2xl"></i>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">確認済み</dt>
                  <dd class="text-lg font-medium text-gray-900">{{ confirmedReservationsCount }}件</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="bi bi-graph-up text-purple-500 text-2xl"></i>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">今月の予約</dt>
                  <dd class="text-lg font-medium text-gray-900">{{ monthlyReservationsCount }}件</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Calendar Grid -->
      <div class="bg-white rounded-lg shadow-md">
        <CalendarGrid
          v-model="selectedDate"
          v-model:viewMode="currentViewMode"
          :appointments="appointments"
          :business-hours="businessHours"
          @select-day="handleSelectDay"
          @select-appointment="handleSelectAppointment"
          @create-appointment="handleCreateAppointment"
          @select-time-slot="handleSelectTimeSlot"
        />
      </div>
    </main>

    <!-- Reservation Modal -->
    <SimpleReservationModal
      :show="showModal"
      :selected-date="modalSelectedDate"
      :reservation="selectedReservation"
      @close="closeModal"
      @save="handleSaveReservation"
      @delete="handleDeleteReservation"
    />

    <!-- Loading Overlay -->
    <div v-if="loading" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div class="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full mx-4">
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-2">処理中...</h3>
          <p class="text-sm text-gray-500">予約データを同期しています</p>
        </div>
      </div>
    </div>

    <!-- Toast Notifications -->
    <div v-if="notification.show" class="fixed top-4 right-4 z-50">
      <div class="bg-white rounded-lg shadow-lg border-l-4 p-4 max-w-sm"
           :class="{
             'border-green-400': notification.type === 'success',
             'border-red-400': notification.type === 'error',
             'border-blue-400': notification.type === 'info'
           }">
        <div class="flex">
          <div class="flex-shrink-0">
            <i class="text-xl" :class="{
              'bi bi-check-circle text-green-400': notification.type === 'success',
              'bi bi-x-circle text-red-400': notification.type === 'error',
              'bi bi-info-circle text-blue-400': notification.type === 'info'
            }"></i>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-900">{{ notification.message }}</p>
          </div>
          <div class="ml-auto pl-3">
            <button @click="closeNotification" class="text-gray-400 hover:text-gray-600">
              <i class="bi bi-x"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import CalendarGrid from '~/components/Calendar/CalendarGrid.vue'
import SimpleReservationModal from '~/components/Calendar/SimpleReservationModal.vue'
import { useSimpleReservations } from '../composables/useSimpleReservations'

// Page meta
definePageMeta({
  layout: 'default',
  middleware: 'auth' // 認証が必要な場合
})

// Use Simple Reservations composable
const {
  reservations,
  appointments,
  loading,
  error,
  todayReservations,
  pendingReservations,
  confirmedReservations,
  monthlyReservations,
  createReservation,
  updateReservation,
  deleteReservation,
  getReservationById,
  categoryLabels
} = useSimpleReservations()

// Reactive state
const selectedDate = ref(new Date())
const currentViewMode = ref<'month' | 'week' | 'day'>('month')

// Modal state
const showModal = ref(false)
const modalSelectedDate = ref<Date | null>(null)
const selectedReservation = ref(null)

// Notification state
const notification = ref({
  show: false,
  type: 'info' as 'success' | 'error' | 'info',
  message: ''
})

// Business configuration
const businessHours = {
  start: 9,
  end: 18
}

// Computed properties for stats (using composable data)
const todayReservationsCount = computed(() => todayReservations.value.length)
const pendingReservationsCount = computed(() => pendingReservations.value.length)
const confirmedReservationsCount = computed(() => confirmedReservations.value.length)
const monthlyReservationsCount = computed(() => monthlyReservations.value.length)

// Utility functions
const formatDate = (date: Date) => {
  return format(date, 'M月d日（E）', { locale: ja })
}

const getCategoryLabel = (category: string) => {
  return categoryLabels[category] || category
}

const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
  notification.value = { show: true, type, message }
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

const closeNotification = () => {
  notification.value.show = false
}

// Event handlers
const goToToday = () => {
  selectedDate.value = new Date()
  showNotification('info', '今日の日付に移動しました')
}

const createNewReservation = () => {
  selectedReservation.value = null
  modalSelectedDate.value = new Date()
  showModal.value = true
}

const handleSelectDay = (day: any) => {
  console.log('Day selected:', day)
  selectedDate.value = day.date
}

const handleSelectAppointment = (appointment: any) => {
  console.log('Appointment selected:', appointment)
  // Find full reservation data using composable method
  const fullReservation = getReservationById(appointment.id)
  if (fullReservation) {
    selectedReservation.value = fullReservation
    modalSelectedDate.value = new Date(fullReservation.date)
    showModal.value = true
  }
}

const handleCreateAppointment = (date: Date, hour?: number) => {
  console.log('Create appointment:', date, hour)
  selectedReservation.value = null
  modalSelectedDate.value = date
  showModal.value = true
}

const handleSelectTimeSlot = (date: Date, hour: number) => {
  console.log('Time slot selected:', date, hour)
  handleCreateAppointment(date, hour)
}

// Modal handlers
const closeModal = () => {
  showModal.value = false
  selectedReservation.value = null
  modalSelectedDate.value = null
}

const handleSaveReservation = async (reservationData: any) => {
  console.log('Save reservation:', reservationData)

  try {
    if (reservationData.id) {
      // Update existing reservation using composable
      await updateReservation(reservationData.id, reservationData)
      showNotification('success', '予約を更新しました')
    } else {
      // Create new reservation using composable
      await createReservation(reservationData)
      showNotification('success', '新しい予約を作成しました')
    }

    closeModal()
  } catch (error) {
    console.error('Error saving reservation:', error)
    showNotification('error', '予約の保存中にエラーが発生しました')
  }
}

const handleDeleteReservation = async (reservationId: string) => {
  console.log('Delete reservation:', reservationId)

  try {
    // Delete reservation using composable
    await deleteReservation(reservationId)
    showNotification('success', '予約を削除しました')
    closeModal()
  } catch (error) {
    console.error('Error deleting reservation:', error)
    showNotification('error', '予約の削除中にエラーが発生しました')
  }
}

// Watch for error state
watch(error, (newError) => {
  if (newError) {
    showNotification('error', newError)
  }
})

// Show welcome message when component is ready
watch(loading, (isLoading) => {
  if (!isLoading && reservations.value.length >= 0) {
    // Only show welcome message once when data is loaded
    setTimeout(() => {
      showNotification('info', 'シンプル予約管理システムへようこそ')
    }, 500)
  }
}, { once: true })
</script>

<style scoped>
/* Additional custom styles if needed */
</style>
