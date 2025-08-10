<template>
  <div class="min-h-screen bg-gray-50">
    <!-- ヘッダー -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div class="py-2">
            <h1 class="text-xl font-semibold text-gray-900 leading-relaxed">
              予約カレンダー
            </h1>
            <p class="text-sm text-gray-600 leading-normal">
              {{ currentDateText }}
            </p>
          </div>
          <div class="flex items-center space-x-4">
            <!-- 文字サイズ変更ボタン -->
            <div class="flex items-center space-x-1 border border-gray-300 rounded">
              <button
                class="px-2 py-1 text-xs hover:bg-gray-100"
                :class="{ 'bg-gray-200': fontSize === 'small' }"
                @click="fontSize = 'small'"
              >
                小
              </button>
              <button
                class="px-2 py-1 text-xs hover:bg-gray-100 border-l border-r border-gray-300"
                :class="{ 'bg-gray-200': fontSize === 'normal' }"
                @click="fontSize = 'normal'"
              >
                中
              </button>
              <button
                class="px-2 py-1 text-xs hover:bg-gray-100"
                :class="{ 'bg-gray-200': fontSize === 'large' }"
                @click="fontSize = 'large'"
              >
                大
              </button>
            </div>
            <button
              class="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              @click="goToToday"
            >
              今日
            </button>
            <div class="flex items-center space-x-2">
              <button
                class="p-2 hover:bg-gray-100 rounded"
                @click="previousWeek"
              >
                ←
              </button>
              <button
                class="p-2 hover:bg-gray-100 rounded"
                @click="nextWeek"
              >
                →
              </button>
            </div>
            <button
              class="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              @click="showStats = !showStats"
            >
              <span v-if="!showStats">📊 統計</span>
              <span v-else>📅 カレンダー</span>
            </button>
            <button
              class="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              @click="logout"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- メインコンテンツ -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- 統計表示 -->
      <div
        v-if="showStats"
        class="bg-white rounded-lg shadow p-6 mb-6"
      >
        <h2 class="text-lg font-semibold mb-4">
          {{ currentDateText }}の統計
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-sm text-gray-600">
              総予約数
            </div>
            <div class="text-2xl font-bold mt-1">
              {{ monthlyStats.total }}
            </div>
          </div>
          <div class="bg-green-50 rounded-lg p-4">
            <div class="text-sm text-green-600">
              完了
            </div>
            <div class="text-2xl font-bold text-green-700 mt-1">
              {{ monthlyStats.completed }}
            </div>
          </div>
          <div class="bg-blue-50 rounded-lg p-4">
            <div class="text-sm text-blue-600">
              予約中
            </div>
            <div class="text-2xl font-bold text-blue-700 mt-1">
              {{ monthlyStats.active }}
            </div>
          </div>
          <div class="bg-red-50 rounded-lg p-4">
            <div class="text-sm text-red-600">
              キャンセル
            </div>
            <div class="text-2xl font-bold text-red-700 mt-1">
              {{ monthlyStats.cancelled }}
            </div>
          </div>
        </div>
        <div class="mt-4 pt-4 border-t">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">完了率</span>
            <span class="text-lg font-semibold">{{ monthlyStats.completionRate }}%</span>
          </div>
          <div class="mt-2 h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              class="h-full bg-green-500 transition-all duration-500"
              :style="{ width: `${monthlyStats.completionRate}%` }"
            />
          </div>
        </div>
      </div>

      <!-- カレンダーグリッド（紙の予約表風） -->
      <div
        v-show="!showStats"
        class="bg-white rounded-lg shadow-xl overflow-hidden border-2 border-gray-300"
      >
        <div class="flex">
          <!-- 時間軸 -->
          <div class="w-16 bg-gray-100 border-r-2 border-gray-300">
            <div class="h-12" /> <!-- ヘッダー分のスペース -->
            <div
              class="relative"
              style="height: 720px;"
            >
              <!-- 12時間 × 60px -->
              <div
                v-for="hour in 12"
                :key="hour + 8"
                class="absolute left-0 right-0 text-xs text-center text-gray-600 border-t border-gray-200"
                :style="{ top: `${(hour - 1) * 60}px` }"
              >
                <div class="bg-gray-100 py-1">
                  {{ String(hour + 7).padStart(2, '0') }}:00
                </div>
              </div>
            </div>
          </div>

          <!-- 各曜日のカラム -->
          <div
            v-for="day in weekDays"
            :key="day.date"
            class="flex-1 border-l border-gray-300"
          >
            <!-- 曜日ヘッダー（再配置） -->
            <div
              class="h-12 px-2 py-2 text-sm font-bold text-gray-800 text-center border-b-2 border-gray-300"
              :class="{ 'bg-blue-100 text-blue-800': day.isToday }"
            >
              <div>{{ day.dayName }}</div>
              <div class="text-xs">
                {{ day.dateText }}
              </div>
            </div>

            <!-- 時間軸エリア -->
            <div
              class="relative bg-white cursor-pointer"
              style="height: 720px;"
              @click="openReservationModal(day.date, getTimeFromPosition($event))"
            >
              <!-- 時間区切り線 -->
              <div
                v-for="hour in 12"
                :key="hour"
                class="absolute left-0 right-0 border-t border-gray-200"
                :style="{ top: `${(hour - 1) * 60}px` }"
              />

              <!-- 営業時間外の背景 -->
              <div
                class="absolute left-0 right-0 bg-gray-50 opacity-50"
                style="top: 0; height: 60px;"
              /> <!-- 8時前 -->
              <div
                class="absolute left-0 right-0 bg-gray-50 opacity-50"
                style="bottom: 0; height: 60px;"
              /> <!-- 19時以降 -->

              <!-- 予約ブロック表示（重複対応） -->
              <template v-for="group in groupOverlappingReservations(getReservationsForDay(day.date))">
                <div
                  v-for="(reservation, index) in group"
                  :key="reservation.id"
                  class="absolute rounded border-2 shadow-sm cursor-pointer overflow-hidden"
                  :class="[
                    getReservationColor(reservation.category),
                    reservation.status === 'completed' ? 'opacity-70' : '',
                    reservation.status === 'cancelled' ? 'line-through opacity-50' : ''
                  ]"
                  :style="{
                    top: `${calculateTimePosition(reservation.startTime)}px`,
                    height: `${reservation.duration}px`,
                    left: group.length === 1 ? '4px' : `${4 + (index * (100 / group.length))}%`,
                    width: group.length === 1 ? 'calc(100% - 8px)' : `${(100 / group.length) - 1}%`
                  }"
                  @click.stop="editReservation(reservation)"
                >
                  <div class="p-1 h-full flex flex-col text-xs">
                    <div class="font-medium truncate">
                      {{ reservation.customerName }}
                      <span
                        v-if="reservation.status === 'completed'"
                        class="ml-1"
                      >✓</span>
                    </div>
                    <div class="opacity-75 mt-1">
                      {{ reservation.startTime }}〜{{ calculateEndTime(reservation.startTime, reservation.duration) }}
                    </div>
                    <div
                      v-if="reservation.notes && reservation.duration > 60 && group.length === 1"
                      class="opacity-75 mt-1 flex-1 overflow-hidden"
                    >
                      {{ reservation.notes }}
                    </div>
                  </div>
                </div>
              </template>

              <!-- 今日の場合、現在時刻線を表示 -->
              <div
                v-if="day.isToday"
                class="absolute left-0 right-0 h-0.5 bg-red-500 z-10"
                :style="{ top: `${getCurrentTimePosition()}px` }"
              />
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 予約モーダル -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 class="text-lg font-semibold mb-4">
          {{ editingReservation ? '予約編集' : '新規予約' }}
        </h2>

        <form
          class="space-y-4"
          @submit.prevent="saveReservation"
        >
          <!-- 顧客名 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              顧客名 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="reservationForm.customerName"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: 田中太郎"
            >
          </div>

          <!-- カテゴリ（色分け用） -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              カテゴリ（色分け）
            </label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="cat in [
                  { value: 'cut', label: 'カット', color: 'bg-pink-100 hover:bg-pink-200 text-pink-700' },
                  { value: 'color', label: 'カラー', color: 'bg-blue-100 hover:bg-blue-200 text-blue-700' },
                  { value: 'perm', label: 'パーマ', color: 'bg-green-100 hover:bg-green-200 text-green-700' },
                  { value: 'straight', label: '縮毛矯正', color: 'bg-orange-100 hover:bg-orange-200 text-orange-700' },
                  { value: 'mesh', label: 'メッシュ', color: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700' },
                  { value: 'other', label: 'その他', color: 'bg-purple-100 hover:bg-purple-200 text-purple-700' }
                ]"
                :key="cat.value"
                type="button"
                :class="[
                  'px-3 py-2 text-sm rounded-md transition-colors',
                  reservationForm.category === cat.value ? cat.color : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                ]"
                @click="selectCategory(cat.value)"
              >
                {{ cat.label }}
              </button>
            </div>
          </div>

          <!-- 日付・時間 -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                日付
              </label>
              <input
                v-model="reservationForm.date"
                type="date"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                開始時間
              </label>
              <select
                v-model="reservationForm.startTime"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option
                  v-for="slot in timeSlots"
                  :key="slot"
                  :value="slot"
                >
                  {{ slot }}
                  <span v-if="slot < '09:00' || slot >= '19:00'">(時間外)</span>
                </option>
              </select>
            </div>
          </div>

          <!-- 所要時間選択 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              所要時間
            </label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="duration in [
                  { value: 30, label: '30分' },
                  { value: 60, label: '1時間' },
                  { value: 90, label: '1時間30分' },
                  { value: 120, label: '2時間' },
                  { value: 150, label: '2時間30分' },
                  { value: 180, label: '3時間' }
                ]"
                :key="duration.value"
                type="button"
                :class="[
                  'px-3 py-2 text-sm rounded-md transition-colors',
                  reservationForm.duration === duration.value ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                ]"
                @click="reservationForm.duration = duration.value"
              >
                {{ duration.label }}
              </button>
            </div>
            <div class="mt-2 text-xs text-gray-500">
              終了予定時間: {{ calculateEndTime(reservationForm.startTime, reservationForm.duration) }}
            </div>
          </div>

          <!-- ステータス -->
          <div v-if="editingReservation">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              ステータス
            </label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="status in [
                  { value: 'active', label: '予約中', color: 'bg-blue-100 hover:bg-blue-200 text-blue-700' },
                  { value: 'completed', label: '完了 ✓', color: 'bg-green-100 hover:bg-green-200 text-green-700' },
                  { value: 'cancelled', label: 'キャンセル', color: 'bg-red-100 hover:bg-red-200 text-red-700' }
                ]"
                :key="status.value"
                type="button"
                :class="[
                  'px-3 py-2 text-sm rounded-md transition-colors',
                  reservationForm.status === status.value ? status.color : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                ]"
                @click="reservationForm.status = status.value"
              >
                {{ status.label }}
              </button>
            </div>
          </div>

          <!-- 備考 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              備考
            </label>
            <textarea
              v-model="reservationForm.notes"
              rows="2"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: カット＆カラー、ロング"
            />
            <p class="text-xs text-gray-500 mt-1">
              ※ 施術内容や特記事項など
            </p>
          </div>

          <!-- ボタン -->
          <div class="flex justify-between pt-4">
            <button
              v-if="editingReservation"
              type="button"
              class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              @click="deleteReservation"
            >
              削除
            </button>
            <div class="flex space-x-2 ml-auto">
              <button
                type="button"
                class="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                @click="closeModal"
              >
                キャンセル
              </button>
              <button
                type="submit"
                :disabled="loading"
                class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {{ loading ? '保存中...' : '保存' }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { signOut } from 'firebase/auth'
import { getAuth } from 'firebase/auth'
import { useSimpleReservations } from '../composables/useSimpleReservations'

definePageMeta({
  ssr: false
})

useHead({
  title: '予約カレンダー - 美容室予約システム'
})

// Composables
const { reservations, loading, addReservation, updateReservation, deleteReservation: removeReservation, calculateEndTime, DEFAULT_DURATIONS } = useSimpleReservations()

// State
const currentWeek = ref(new Date())
const showModal = ref(false)
const showStats = ref(false) // 統計表示の切り替え
const editingReservation = ref(null)
const fontSize = ref('normal') // 文字サイズ設定

const reservationForm = reactive({
  customerName: '', // 顧客名
  notes: '', // 備考
  date: '',
  startTime: '09:00', // timeSlot → startTime に変更
  duration: 60, // 所要時間（分）
  category: 'cut',
  status: 'active'
})

// Computed
const weekDays = computed(() => {
  const days = []
  const startOfWeek = new Date(currentWeek.value)
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())

  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + i)

    days.push({
      date: date.toISOString().split('T')[0],
      dayName: ['日', '月', '火', '水', '木', '金', '土'][date.getDay()],
      dateText: `${date.getMonth() + 1}/${date.getDate()}`,
      isToday: date.toDateString() === new Date().toDateString()
    })
  }

  return days
})

const currentDateText = computed(() => {
  const year = currentWeek.value.getFullYear()
  const month = currentWeek.value.getMonth() + 1
  return `${year}年${month}月`
})

const timeSlots = computed(() => {
  const slots = []
  // 8:00から20:00まで、30分単位（時間外も対応）
  for (let hour = 8; hour <= 20; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`)
    if (hour < 20) {
      slots.push(`${hour.toString().padStart(2, '0')}:30`)
    }
  }
  return slots
})

const monthlyStats = computed(() => {
  const currentMonth = currentWeek.value.getMonth()
  const currentYear = currentWeek.value.getFullYear()

  const monthlyReservations = reservations.value.filter(reservation => {
    const reservationDate = new Date(reservation.date)
    return reservationDate.getMonth() === currentMonth &&
           reservationDate.getFullYear() === currentYear
  })

  const total = monthlyReservations.length
  const completed = monthlyReservations.filter(r => r.status === 'completed').length
  const active = monthlyReservations.filter(r => r.status === 'active').length
  const cancelled = monthlyReservations.filter(r => r.status === 'cancelled').length
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  return { total, completed, active, cancelled, completionRate }
})

// Methods

const getReservationColor = (category) => {
  const colors = {
    'cut': 'bg-pink-100 text-pink-700 border-pink-200', // 淡いピンク
    'color': 'bg-blue-100 text-blue-700 border-blue-200', // 淡い青
    'perm': 'bg-green-100 text-green-700 border-green-200', // 淡い緑
    'straight': 'bg-orange-100 text-orange-700 border-orange-200', // 淡いオレンジ
    'mesh': 'bg-yellow-100 text-yellow-700 border-yellow-200', // 淡い黄色
    'other': 'bg-purple-100 text-purple-700 border-purple-200' // 淡い紫
  }
  return colors[category] || colors['other']
}

// 指定日の全予約を取得（時間軸表示用）
const getReservationsForDay = (date) => {
  return reservations.value.filter(reservation =>
    reservation.date === date && reservation.status !== 'cancelled'
  )
}

// 重複予約をグループ化（LaKiite方式）
const groupOverlappingReservations = (reservations) => {
  if (reservations.length === 0) return []

  const sortedReservations = [...reservations].sort((a, b) => {
    const aStart = calculateTimePosition(a.startTime)
    const bStart = calculateTimePosition(b.startTime)
    return aStart - bStart
  })

  const groups = []
  let currentGroup = [sortedReservations[0]]

  for (let i = 1; i < sortedReservations.length; i++) {
    const current = sortedReservations[i]
    let overlapsWithGroup = false

    // 現在のグループ内の予約と重なるかチェック
    for (const groupReservation of currentGroup) {
      if (isOverlapping(current, groupReservation)) {
        overlapsWithGroup = true
        break
      }
    }

    if (overlapsWithGroup) {
      currentGroup.push(current)
    } else {
      groups.push([...currentGroup])
      currentGroup = [current]
    }
  }

  groups.push(currentGroup)
  return groups
}

// 2つの予約が重なっているかチェック
const isOverlapping = (a, b) => {
  const aStart = calculateTimePosition(a.startTime)
  const aEnd = aStart + a.duration
  const bStart = calculateTimePosition(b.startTime)
  const bEnd = bStart + b.duration

  return aStart < bEnd && bStart < aEnd
}

// 時間を位置（px）に変換（8:00を基準0とする）
const calculateTimePosition = (timeStr) => {
  const [hours = 0, minutes = 0] = timeStr.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes
  const baseMinutes = 8 * 60 // 8:00を基準
  return Math.max(0, totalMinutes - baseMinutes) // 8:00より前は0
}

// マウス位置から時間を取得
const getTimeFromPosition = (event) => {
  const rect = event.currentTarget.getBoundingClientRect()
  const y = event.clientY - rect.top
  const minutes = Math.round(y) + (8 * 60) // 8:00からの分数
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${Math.round(mins / 30) * 30 === 60 ? '00' : (Math.round(mins / 30) * 30).toString().padStart(2, '0')}`
}

// 現在時刻の位置を取得（今日の場合）
const getCurrentTimePosition = () => {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  const totalMinutes = hours * 60 + minutes
  const baseMinutes = 8 * 60
  return Math.max(0, totalMinutes - baseMinutes)
}

const goToToday = () => {
  currentWeek.value = new Date()
}

const previousWeek = () => {
  const newDate = new Date(currentWeek.value)
  newDate.setDate(newDate.getDate() - 7)
  currentWeek.value = newDate
}

const nextWeek = () => {
  const newDate = new Date(currentWeek.value)
  newDate.setDate(newDate.getDate() + 7)
  currentWeek.value = newDate
}

const openReservationModal = (date, startTime) => {
  editingReservation.value = null
  reservationForm.customerName = ''
  reservationForm.notes = ''
  reservationForm.date = date
  reservationForm.startTime = startTime || '09:00'
  reservationForm.duration = DEFAULT_DURATIONS.cut // デフォルトはカットの60分
  reservationForm.category = 'cut'
  reservationForm.status = 'active'
  showModal.value = true
}

const editReservation = (reservation) => {
  editingReservation.value = reservation
  reservationForm.customerName = reservation.customerName
  reservationForm.notes = reservation.notes || ''
  reservationForm.date = reservation.date
  // 新旧データ構造の互換性対応
  reservationForm.startTime = reservation.startTime || reservation.timeSlot || '09:00'
  reservationForm.duration = reservation.duration || DEFAULT_DURATIONS[reservation.category] || 60
  reservationForm.category = reservation.category
  reservationForm.status = reservation.status
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingReservation.value = null
}

// カテゴリ選択時にデフォルトの所要時間を設定
const selectCategory = (category) => {
  reservationForm.category = category
  reservationForm.duration = DEFAULT_DURATIONS[category] || 60
}

const saveReservation = async () => {
  console.log('💾 Saving reservation...')

  try {
    const reservationData = {
      customerName: reservationForm.customerName,
      notes: reservationForm.notes,
      date: reservationForm.date,
      startTime: reservationForm.startTime, // timeSlot → startTime
      duration: reservationForm.duration, // 所要時間を追加
      category: reservationForm.category,
      status: reservationForm.status
    }

    console.log('📝 Reservation data:', reservationData)

    if (editingReservation.value) {
      console.log('✏️ Updating existing reservation:', editingReservation.value.id)
      await updateReservation(editingReservation.value.id, reservationData)
      console.log('✅ Reservation updated successfully')
    } else {
      console.log('➕ Adding new reservation')
      const newId = await addReservation(reservationData)
      console.log('✅ New reservation added with ID:', newId)
    }

    console.log('🔄 Closing modal...')
    closeModal()
  } catch (error) {
    console.error('❌ 予約保存エラー:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Error details:', {
      name: error instanceof Error ? error.name : 'UnknownError',
      message: errorMessage,
      code: error?.code || 'unknown'
    })
    alert(`予約の保存に失敗しました: ${errorMessage}`)
  }
}

const deleteReservation = async () => {
  if (confirm('この予約を削除しますか？')) {
    try {
      await removeReservation(editingReservation.value.id)
      closeModal()
    } catch (error) {
      console.error('予約削除エラー:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`予約の削除に失敗しました: ${errorMessage}`)
    }
  }
}

const logout = async () => {
  try {
    const auth = getAuth()
    await signOut(auth)
    await navigateTo('/login')
  } catch (error) {
    console.error('ログアウトエラー:', error)
  }
}

// Lifecycle
onMounted(() => {
  console.log('Calendar page mounted')
})
</script>
