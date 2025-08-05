<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="container mx-auto px-4">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">シンプル予約管理カレンダー</h1>
        <p class="text-gray-600">Googleカレンダー × Excelライクなデザインのカレンダーコンポーネント</p>
      </div>

      <!-- Calendar Component -->
      <CalendarGrid
        v-model="selectedDate"
        v-model:viewMode="currentViewMode"
        :appointments="demoAppointments"
        :business-hours="businessHours"
        @select-day="handleSelectDay"
        @select-appointment="handleSelectAppointment"
        @create-appointment="handleCreateAppointment"
        @select-time-slot="handleSelectTimeSlot"
      />

      <!-- Reservation Modal -->
      <SimpleReservationModal
        :show="showModal"
        :selected-date="modalSelectedDate"
        :reservation="selectedReservation"
        @close="closeModal"
        @save="handleSaveReservation"
        @delete="handleDeleteReservation"
      />

      <!-- Debug Info -->
      <div class="mt-8 p-4 bg-white rounded-lg border border-gray-200">
        <h3 class="text-lg font-medium text-gray-900 mb-4">デバッグ情報</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p class="text-sm text-gray-600">選択日: {{ selectedDate ? formatDate(selectedDate) : 'なし' }}</p>
            <p class="text-sm text-gray-600">表示モード: {{ currentViewMode }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">予約件数: {{ demoAppointments.length }}件</p>
            <p class="text-sm text-gray-600">営業時間: {{ businessHours.start }}:00 - {{ businessHours.end }}:00</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">モーダル状態: {{ showModal ? '表示中' : '非表示' }}</p>
            <p class="text-sm text-gray-600">編集モード: {{ selectedReservation ? '編集' : '新規作成' }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import CalendarGrid from '~/components/Calendar/CalendarGrid.vue'
import SimpleReservationModal from '~/components/Calendar/SimpleReservationModal.vue'
import { useSimpleReservations } from '../composables/useSimpleReservations'

// Use Simple Reservations composable
const {
  reservations,
  appointments: demoAppointments,
  loading,
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

// Business configuration
const businessHours = {
  start: 9,
  end: 18
}

// Utility function to get category label
const getCategoryLabel = (category: string) => {
  return categoryLabels[category] || category
}

// Event handlers
const handleSelectDay = (day: any) => {
  console.log('Day selected:', day)
}

const handleSelectAppointment = (appointment: any) => {
  console.log('Appointment selected:', appointment)
  // Find full reservation data using composable
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
    } else {
      // Create new reservation using composable
      await createReservation(reservationData)
    }

    closeModal()
  } catch (error) {
    console.error('Error saving reservation:', error)
    alert('予約の保存中にエラーが発生しました')
  }
}

const handleDeleteReservation = async (reservationId: string) => {
  console.log('Delete reservation:', reservationId)

  try {
    await deleteReservation(reservationId)
    closeModal()
  } catch (error) {
    console.error('Error deleting reservation:', error)
    alert('予約の削除中にエラーが発生しました')
  }
}

// Utility functions
const formatDate = (date: Date) => {
  return format(date, 'yyyy年M月d日', { locale: ja })
}

// Page meta
definePageMeta({
  layout: false
})
</script>

<style scoped>
/* Page specific styles */
.container {
  max-width: 1400px;
}
</style>
