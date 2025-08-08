<template>
  <div class="calendar-container">
    <!-- ナビゲーションヘッダー -->
    <div class="header-nav bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <button @click="previousWeek" class="nav-btn">
            <i class="bi bi-chevron-left"></i>
          </button>
          <h2 class="text-xl font-semibold text-gray-800">
            {{ currentWeekTitle }}
          </h2>
          <button @click="nextWeek" class="nav-btn">
            <i class="bi bi-chevron-right"></i>
          </button>
          <button @click="goToCurrentWeek" class="btn-today">今週</button>
        </div>
        <button @click="logout" class="btn-logout">
          <i class="bi bi-box-arrow-right"></i> ログアウト
        </button>
      </div>
    </div>

    <!-- カレンダーグリッド -->
    <div class="calendar-grid bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <!-- 曜日ヘッダー -->
      <div class="grid grid-cols-8 bg-gray-50 border-b">
        <div class="time-header p-3 text-sm font-medium text-gray-600">時間</div>
        <div v-for="day in weekDays" :key="day.date" class="day-header p-3 text-center border-l border-gray-200">
          <div class="text-sm font-medium text-gray-700">{{ day.dayName }}</div>
          <div class="text-lg font-semibold" :class="day.isToday ? 'text-blue-600' : 'text-gray-900'">
            {{ day.dateNum }}
          </div>
        </div>
      </div>

      <!-- 時間スロット -->
      <div v-for="timeSlot in timeSlots" :key="timeSlot" class="grid grid-cols-8 border-b border-gray-100 hover:bg-gray-50">
        <!-- 時間ラベル -->
        <div class="time-slot p-3 text-sm text-gray-600 bg-gray-50 border-r border-gray-200">
          {{ timeSlot }}
        </div>

        <!-- 各日のセル -->
        <div
          v-for="day in weekDays"
          :key="`${day.date}_${timeSlot}`"
          class="time-cell relative min-h-16 border-l border-gray-200 cursor-pointer hover:bg-blue-50"
          @click="openReservationModal(day.date, timeSlot)"
        >
          <!-- 予約がある場合 -->
          <div
            v-for="reservation in getReservationsForSlot(day.date, timeSlot)"
            :key="reservation.id"
            class="reservation-card absolute inset-1 p-2 rounded text-xs font-medium cursor-pointer"
            :class="getCategoryClass(reservation.category)"
            @click.stop="editReservation(reservation)"
          >
            {{ reservation.content }}
          </div>

          <!-- 空スロットのプラスアイコン -->
          <div
            v-if="!hasReservation(day.date, timeSlot)"
            class="add-icon absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
          >
            <i class="bi bi-plus text-gray-400 text-lg"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- 予約入力モーダル -->
    <SimpleReservationModal
      v-if="showModal"
      :date="selectedDate"
      :time-slot="selectedTimeSlot"
      :reservation="editingReservation"
      @close="closeModal"
      @save="saveReservation"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/ja'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import isoWeek from 'dayjs/plugin/isoWeek'

dayjs.locale('ja')
dayjs.extend(weekOfYear)
dayjs.extend(isoWeek)
import { useAuth } from '../../composables/useAuth'
import { useSimpleReservations } from '../../composables/useSimpleReservations'
import SimpleReservationModal from './SimpleReservationModal.vue'

const { signOut } = useAuth()
const { reservations, createReservation, updateReservation, deleteReservation } = useSimpleReservations()

// 現在の週の開始日
const currentWeekStart = ref(dayjs().startOf('isoWeek').toDate())
const showModal = ref(false)
const selectedDate = ref('')
const selectedTimeSlot = ref('')
const editingReservation = ref(null)

// 時間スロット（30分単位）
const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
]

// 現在の週のタイトル
const currentWeekTitle = computed(() => {
  const weekEnd = dayjs(currentWeekStart.value).add(6, 'day')
  return `${dayjs(currentWeekStart.value).format('M月D日')} - ${weekEnd.format('M月D日')}`
})

// 週の日付データ
const weekDays = computed(() => {
  const days = []
  for (let i = 0; i < 7; i++) {
    const date = dayjs(currentWeekStart.value).add(i, 'day')
    const today = dayjs()
    days.push({
      date: date.format('YYYY-MM-DD'),
      dayName: date.format('ddd'),
      dateNum: date.format('D'),
      isToday: date.format('YYYY-MM-DD') === today.format('YYYY-MM-DD')
    })
  }
  return days
})

// カテゴリごとのスタイルクラス
const getCategoryClass = (category) => {
  const classes = {
    cut: 'bg-pink-100 border-pink-200 text-pink-800',
    color: 'bg-blue-100 border-blue-200 text-blue-800',
    perm: 'bg-green-100 border-green-200 text-green-800',
    straight: 'bg-orange-100 border-orange-200 text-orange-800',
    other: 'bg-purple-100 border-purple-200 text-purple-800'
  }
  return classes[category] || classes.other
}

// 特定の日時に予約があるかチェック
const hasReservation = (date, timeSlot) => {
  return reservations.value.some(r => r.date === date && r.timeSlot === timeSlot)
}

// 特定の日時の予約を取得
const getReservationsForSlot = (date, timeSlot) => {
  return reservations.value.filter(r => r.date === date && r.timeSlot === timeSlot)
}

// 週移動
const previousWeek = () => {
  currentWeekStart.value = dayjs(currentWeekStart.value).subtract(1, 'week').toDate()
}

const nextWeek = () => {
  currentWeekStart.value = dayjs(currentWeekStart.value).add(1, 'week').toDate()
}

const goToCurrentWeek = () => {
  currentWeekStart.value = dayjs().startOf('isoWeek').toDate()
}

// モーダル操作
const openReservationModal = (date, timeSlot) => {
  selectedDate.value = date
  selectedTimeSlot.value = timeSlot
  editingReservation.value = null
  showModal.value = true
}

const editReservation = (reservation) => {
  selectedDate.value = reservation.date
  selectedTimeSlot.value = reservation.timeSlot
  editingReservation.value = reservation
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedDate.value = ''
  selectedTimeSlot.value = ''
  editingReservation.value = null
}

const saveReservation = async (reservationData) => {
  try {
    if (editingReservation.value) {
      await updateReservation(editingReservation.value.id, reservationData)
    } else {
      await createReservation(reservationData)
    }
    closeModal()
  } catch (error) {
    console.error('予約保存エラー:', error)
    alert('予約の保存に失敗しました。')
  }
}

// ログアウト
const logout = async () => {
  try {
    await signOut()
    await navigateTo('/login')
  } catch (error) {
    console.error('ログアウトエラー:', error)
  }
}
</script>

<style scoped>
.calendar-container {
  @apply w-full max-w-7xl mx-auto p-4;
}

.nav-btn {
  @apply p-2 rounded-full hover:bg-gray-100 transition-colors;
}

.btn-today {
  @apply px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 transition-colors;
}

.btn-logout {
  @apply px-4 py-2 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 transition-colors;
}

.time-header {
  @apply sticky left-0 bg-gray-50 z-10;
}

.day-header {
  @apply min-w-24;
}

.time-cell {
  @apply relative;
}

.reservation-card {
  @apply border rounded-sm shadow-sm hover:shadow-md transition-shadow;
}

.add-icon {
  @apply transition-opacity duration-200;
}

/* パステルカラー定義 */
.bg-pink-100 { background-color: #FFE4E1; }
.bg-blue-100 { background-color: #E0E4FF; }
.bg-green-100 { background-color: #E4FFE0; }
.bg-orange-100 { background-color: #FFF0E4; }
.bg-purple-100 { background-color: #F0E4FF; }

@media (max-width: 768px) {
  .calendar-container {
    @apply p-2;
  }

  .header-nav {
    @apply flex-col space-y-3;
  }

  .header-nav .flex {
    @apply justify-center;
  }

  .day-header {
    @apply min-w-16 text-xs;
  }

  .time-cell {
    @apply min-h-12;
  }
}</style>
