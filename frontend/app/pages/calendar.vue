<template>
  <div class="min-h-screen bg-gray-50">
    <!-- ヘッダー（モバイルファースト） -->
    <header class="bg-white shadow-sm border-b sticky top-0 z-40">
      <div class="px-4 py-3">
        <!-- タグ管理ボタンとメニュー -->
        <div class="mb-3 flex justify-end items-center gap-2">
          <button
            type="button"
            class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            @click="openTagModal"
          >
            <svg
              class="w-4 h-4 inline-block mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            タグ管理
          </button>

          <!-- 統計ボタン -->
          <button
            class="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            @click="showStats = !showStats"
          >
            <svg
              class="w-4 h-4 inline-block mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                v-if="!showStats"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span class="hidden sm:inline">{{ showStats ? 'カレンダー' : '統計' }}</span>
            <span class="sm:hidden">{{ showStats ? '📅' : '📊' }}</span>
          </button>

          <!-- ドロップダウンメニュー -->
          <div class="relative">
            <button
              class="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              @click="showMenuDropdown = !showMenuDropdown"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
            <!-- ドロップダウンメニュー -->
            <div
              v-if="showMenuDropdown"
              class="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border z-50"
              @click="showMenuDropdown = false"
            >
              <button
                class="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                @click="logout"
              >
                <svg
                  class="w-4 h-4 mr-2 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                ログアウト
              </button>
            </div>
          </div>
        </div>

        <!-- ナビゲーション -->
        <div class="flex justify-between items-center">
          <button
            class="p-2 hover:bg-gray-100 rounded-lg"
            @click="previousDays"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <div class="text-center">
            <h1 class="text-sm font-semibold text-gray-900">
              {{ currentMonthText }}
            </h1>
            <button
              class="text-xs text-blue-600 hover:text-blue-700"
              @click="goToToday"
            >
              今日に戻る
            </button>
          </div>

          <button
            class="p-2 hover:bg-gray-100 rounded-lg"
            @click="nextDays"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- メインコンテンツ -->
    <main class="pb-20">
      <!-- 統計表示（デスクトップのみ） -->
      <div
        v-if="showStats"
        class="hidden md:block max-w-7xl mx-auto px-4 py-6"
      >
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold mb-4">
            {{ currentMonthText }}の統計
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
        </div>
      </div>

      <!-- カレンダー表示 -->
      <div
        v-show="!showStats"
        class="calendar-container"
      >
        <!-- スクロール可能なコンテナ -->
        <div class="calendar-scroll-container">
          <div
            class="grid gap-px bg-gray-200"
            :class="gridClass"
          >
            <div
              v-for="(day, index) in displayDays"
              :key="day.date"
              class="bg-white"
            >
              <!-- 日付ヘッダー -->
              <div
                :class="[
                  'px-2 py-2 text-center border-b sticky top-0 bg-white z-20',
                  day.isToday ? 'bg-blue-50 border-blue-200' : 'border-gray-200'
                ]"
              >
                <div class="text-xs font-medium text-gray-500">
                  {{ day.dayName }}
                </div>
                <div
                  :class="[
                    'text-sm font-bold',
                    day.isToday ? 'text-blue-600' : 'text-gray-900'
                  ]"
                >
                  {{ day.dateNumber }}
                </div>
              </div>

              <!-- 時間軸と予約 -->
              <div class="relative calendar-day-content">
                <!-- 時間線 -->
                <div
                  v-for="hour in displayHours"
                  :key="hour"
                  class="absolute left-0 right-0 border-t border-gray-100"
                  :style="{ top: `${(hour - 8) * 50}px` }"
                >
                  <span
                    v-if="index === 0"
                    class="absolute -left-1 -top-2 text-xs text-gray-400 bg-white px-1"
                  >
                    {{ hour }}:00
                  </span>
                </div>

                <!-- 予約ブロック -->
                <div
                  v-for="reservation in getReservationsForDay(day.date)"
                  :key="reservation.id"
                  :class="[
                    'absolute left-1 right-1 p-1 rounded text-xs cursor-pointer',
                    getTagColor(reservation.tagId),
                    'shadow-sm hover:shadow-md transition-shadow'
                  ]"
                  :style="{
                    top: `${calculatePosition(reservation.startTime)}px`,
                    height: `${(reservation.duration / 60) * 50}px`
                  }"
                  @click="editReservation(reservation)"
                >
                  <div class="font-medium truncate">
                    {{ reservation.customerName }}
                  </div>
                  <div class="text-xs opacity-75">
                    {{ reservation.startTime }}
                  </div>
                  <div
                    v-if="reservation.tag"
                    class="mt-1 inline-block px-1 py-0.5 rounded text-xs"
                    :class="reservation.tag.badgeClass"
                  >
                    {{ reservation.tag.label }}
                  </div>
                </div>

                <!-- 現在時刻線 -->
                <div
                  v-if="day.isToday"
                  class="absolute left-0 right-0 h-0.5 bg-red-500 z-10"
                  :style="{ top: `${getCurrentTimePosition()}px` }"
                />

                <!-- タップで予約追加 -->
                <div
                  class="absolute inset-0"
                  @click="handleTimeClick($event, day.date)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- フローティングアクションボタン（モバイル） -->
    <button
      class="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center z-30"
      @click="openReservationModal()"
    >
      <svg
        class="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 4v16m8-8H4"
        />
      </svg>
    </button>

    <!-- 予約モーダル -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-md max-h-[90vh] overflow-y-auto">
        <div class="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center">
          <h2 class="text-lg font-semibold">
            {{ editingReservation ? '予約編集' : '新規予約' }}
          </h2>
          <button
            class="p-2 hover:bg-gray-100 rounded-lg"
            @click="closeModal"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form
          class="p-4 space-y-4"
          @submit.prevent="saveReservation"
        >
          <!-- 顧客名 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              顧客名 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="reservationForm.customerName"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: 田中太郎"
            >
          </div>

          <!-- タグ選択 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              タグ
            </label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="tag in tags"
                :key="tag.id"
                type="button"
                :class="[
                  'px-3 py-2 text-sm rounded-lg transition-colors',
                  reservationForm.tagId === tag.id
                    ? tag.activeClass
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                ]"
                @click="reservationForm.tagId = tag.id"
              >
                {{ tag.label }}
              </button>
            </div>
          </div>

          <!-- 日付・時間 -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                日付
              </label>
              <input
                v-model="reservationForm.date"
                type="date"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                開始時間
              </label>
              <select
                v-model="reservationForm.startTime"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option
                  v-for="slot in timeSlots"
                  :key="slot"
                  :value="slot"
                >
                  {{ slot }}
                </option>
              </select>
            </div>
          </div>

          <!-- 所要時間 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              所要時間
            </label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="duration in durations"
                :key="duration.value"
                type="button"
                :class="[
                  'px-3 py-2 text-sm rounded-lg transition-colors',
                  reservationForm.duration === duration.value
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                ]"
                @click="reservationForm.duration = duration.value"
              >
                {{ duration.label }}
              </button>
            </div>
          </div>

          <!-- 備考 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              備考
            </label>
            <textarea
              v-model="reservationForm.notes"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="施術内容や特記事項など"
            />
          </div>

          <!-- ボタン -->
          <div class="flex gap-3 pt-4">
            <button
              v-if="editingReservation"
              type="button"
              class="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              @click="deleteReservation"
            >
              削除
            </button>
            <button
              type="button"
              class="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              @click="closeModal"
            >
              キャンセル
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {{ loading ? '保存中...' : '保存' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- タグ管理モーダル -->
    <div
      v-if="showTagModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="closeTagModal"
    >
      <div class="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div class="sticky top-0 bg-white border-b px-4 py-3">
          <h2 class="text-lg font-semibold">
            タグ管理
          </h2>
        </div>

        <div class="p-4">
          <!-- 既存タグ一覧 -->
          <div class="mb-4">
            <h3 class="text-sm font-medium text-gray-700 mb-2">
              現在のタグ
            </h3>
            <div class="space-y-2 max-h-60 overflow-y-auto">
              <div
                v-for="tag in tags"
                :key="tag.id"
                class="flex items-center justify-between p-2 rounded-lg"
                :class="tag.bgClass"
              >
                <span class="font-medium">{{ tag.label }}</span>
                <button
                  v-if="tag.id.startsWith('custom_')"
                  class="p-1 hover:bg-black hover:bg-opacity-10 rounded"
                  @click="removeTag(tag.id)"
                >
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- 新規タグ追加 -->
          <div class="p-3 bg-gray-50 rounded-lg">
            <h3 class="text-sm font-medium text-gray-700 mb-2">
              新しいタグを追加
            </h3>
            <input
              v-model="newTagName"
              type="text"
              placeholder="タグ名を入力"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
            >
            <div class="grid grid-cols-4 gap-2 mb-2">
              <button
                v-for="color in tagColors"
                :key="color.name"
                type="button"
                :class="[
                  'h-8 rounded',
                  color.bgClass,
                  newTagColor === color.name ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                ]"
                @click="newTagColor = color.name"
              />
            </div>
            <button
              class="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              @click="addTag"
            >
              追加
            </button>
          </div>

          <button
            class="w-full mt-4 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            @click="closeTagModal"
          >
            閉じる
          </button>
        </div>
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
const { reservations, loading, addReservation, updateReservation, deleteReservation: removeReservation } = useSimpleReservations()

// State
const currentDate = ref(new Date())
const showModal = ref(false)
const showTagModal = ref(false)
const showStats = ref(false)
const showMenuDropdown = ref(false)
const editingReservation = ref(null)
const selectedTag = ref(null)
const newTagName = ref('')
const newTagColor = ref('blue')
// 3日表示固定

// カスタムタグ（Firebaseで管理）
const customTags = ref([])

// タグカラーオプション
const tagColors = [
  { name: 'pink', bgClass: 'bg-pink-200', activeClass: 'bg-pink-200 text-pink-800', badgeClass: 'bg-pink-200 text-pink-700' },
  { name: 'blue', bgClass: 'bg-blue-200', activeClass: 'bg-blue-200 text-blue-800', badgeClass: 'bg-blue-200 text-blue-700' },
  { name: 'green', bgClass: 'bg-green-200', activeClass: 'bg-green-200 text-green-800', badgeClass: 'bg-green-200 text-green-700' },
  { name: 'yellow', bgClass: 'bg-yellow-200', activeClass: 'bg-yellow-200 text-yellow-800', badgeClass: 'bg-yellow-200 text-yellow-700' },
  { name: 'purple', bgClass: 'bg-purple-200', activeClass: 'bg-purple-200 text-purple-800', badgeClass: 'bg-purple-200 text-purple-700' },
  { name: 'orange', bgClass: 'bg-orange-200', activeClass: 'bg-orange-200 text-orange-800', badgeClass: 'bg-orange-200 text-orange-700' },
  { name: 'red', bgClass: 'bg-red-200', activeClass: 'bg-red-200 text-red-800', badgeClass: 'bg-red-200 text-red-700' },
  { name: 'gray', bgClass: 'bg-gray-200', activeClass: 'bg-gray-300 text-gray-800', badgeClass: 'bg-gray-200 text-gray-700' },
]

// 全タグ
const tags = computed(() => customTags.value)

const reservationForm = reactive({
  customerName: '',
  notes: '',
  date: '',
  startTime: '09:00',
  duration: 60,
  tagId: 'cut',
  category: 'cut', // 互換性のため残す
  status: 'active'
})

// 所要時間オプション
const durations = [
  { value: 30, label: '30分' },
  { value: 60, label: '1時間' },
  { value: 90, label: '1.5時間' },
  { value: 120, label: '2時間' },
  { value: 150, label: '2.5時間' },
  { value: 180, label: '3時間' },
]

// Computed
const displayDays = computed(() => {
  const days = []
  const startDate = new Date(currentDate.value)

  for (let i = 0; i < 3; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)

    days.push({
      date: date.toISOString().split('T')[0],
      dayName: ['日', '月', '火', '水', '木', '金', '土'][date.getDay()],
      dateNumber: date.getDate(),
      isToday: date.toDateString() === new Date().toDateString()
    })
  }

  return days
})

const gridClass = computed(() => {
  return 'grid-cols-3'
})

const currentMonthText = computed(() => {
  const date = currentDate.value
  return `${date.getFullYear()}年${date.getMonth() + 1}月`
})

const displayHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]

const timeSlots = computed(() => {
  const slots = []
  for (let hour = 8; hour <= 20; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`)
    if (hour < 20) {
      slots.push(`${hour.toString().padStart(2, '0')}:30`)
    }
  }
  return slots
})

const monthlyStats = computed(() => {
  const currentMonth = currentDate.value.getMonth()
  const currentYear = currentDate.value.getFullYear()

  const monthlyReservations = reservations.value.filter(reservation => {
    const reservationDate = new Date(reservation.date)
    return reservationDate.getMonth() === currentMonth &&
           reservationDate.getFullYear() === currentYear
  })

  const total = monthlyReservations.length
  const completed = monthlyReservations.filter(r => r.status === 'completed').length
  const active = monthlyReservations.filter(r => r.status === 'active').length
  const cancelled = monthlyReservations.filter(r => r.status === 'cancelled').length

  return { total, completed, active, cancelled }
})

// Methods
const getReservationsForDay = (date) => {
  return reservations.value.filter(r =>
    r.date === date && r.status !== 'cancelled'
  )
}

const calculatePosition = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return ((hours - 8) * 50) + (minutes / 60 * 50)
}

const getCurrentTimePosition = () => {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  return ((hours - 8) * 50) + (minutes / 60 * 50)
}

const getTagColor = (tagId) => {
  const tag = tags.value.find(t => t.id === tagId)
  return tag ? tag.bgClass : 'bg-gray-100'
}

const handleTimeClick = (event, date) => {
  const rect = event.currentTarget.getBoundingClientRect()
  const y = event.clientY - rect.top
  const hour = Math.floor(y / 50) + 8
  const minute = Math.round((y % 50) / 50 * 2) * 30

  openReservationModal(date, `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)
}

const _selectTag = (tag) => {
  selectedTag.value = tag
  reservationForm.tagId = tag.id
  reservationForm.category = tag.id // 互換性のため
}



const previousDays = () => {
  const newDate = new Date(currentDate.value)
  newDate.setDate(newDate.getDate() - 3)
  currentDate.value = newDate
}

const nextDays = () => {
  const newDate = new Date(currentDate.value)
  newDate.setDate(newDate.getDate() + 3)
  currentDate.value = newDate
}

const goToToday = () => {
  currentDate.value = new Date()
}

const openReservationModal = (date = null, startTime = null) => {
  editingReservation.value = null
  reservationForm.customerName = ''
  reservationForm.notes = ''
  reservationForm.date = date || displayDays.value[Math.floor(displayDays.value.length / 2)].date
  reservationForm.startTime = startTime || '09:00'
  reservationForm.duration = 60
  reservationForm.tagId = selectedTag.value?.id || (tags.value[0]?.id || 'default')
  reservationForm.category = selectedTag.value?.id || (tags.value[0]?.id || 'default')
  reservationForm.status = 'active'
  showModal.value = true
}

const editReservation = (reservation) => {
  editingReservation.value = reservation
  Object.assign(reservationForm, {
    customerName: reservation.customerName,
    notes: reservation.notes || '',
    date: reservation.date,
    startTime: reservation.startTime || reservation.timeSlot,
    duration: reservation.duration || 60,
    tagId: reservation.tagId || reservation.category || (tags.value[0]?.id || 'default'),
    category: reservation.category || reservation.tagId || (tags.value[0]?.id || 'default'),
    status: reservation.status
  })
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingReservation.value = null
}

const saveReservation = async () => {
  try {
    const data = {
      ...reservationForm,
      tag: tags.value.find(t => t.id === reservationForm.tagId)
    }

    if (editingReservation.value) {
      await updateReservation(editingReservation.value.id, data)
    } else {
      await addReservation(data)
    }

    closeModal()
  } catch (error) {
    console.error('予約保存エラー:', error)
    alert('予約の保存に失敗しました')
  }
}

const deleteReservation = async () => {
  if (confirm('この予約を削除しますか？')) {
    try {
      await removeReservation(editingReservation.value.id)
      closeModal()
    } catch (error) {
      console.error('予約削除エラー:', error)
      alert('予約の削除に失敗しました')
    }
  }
}

// タグ管理
const openTagModal = () => {
  showTagModal.value = true
}

const closeTagModal = () => {
  showTagModal.value = false
  newTagName.value = ''
  newTagColor.value = 'blue'
}

const addTag = async () => {
  if (!newTagName.value.trim()) return

  const colorConfig = tagColors.find(c => c.name === newTagColor.value)
  const newTag = {
    id: `custom_${Date.now()}`,
    label: newTagName.value,
    color: newTagColor.value,
    ...colorConfig
  }

  customTags.value.push(newTag)
  await saveTagsToFirebase()
  newTagName.value = ''
  newTagColor.value = 'blue'
}

const removeTag = async (tagId) => {
  customTags.value = customTags.value.filter(t => t.id !== tagId)
  await saveTagsToFirebase()
}

// Firebase保存機能
const saveTagsToFirebase = async () => {
  try {
    const { $firebaseFirestore } = useNuxtApp()
    const auth = getAuth()
    const user = auth.currentUser

    if (!user) return

    const { doc, setDoc } = await import('firebase/firestore')
    const userTagsRef = doc($firebaseFirestore, 'userTags', user.uid)

    await setDoc(userTagsRef, {
      tags: customTags.value,
      updatedAt: new Date()
    })

    console.log('✅ Tags saved to Firebase')
  } catch (error) {
    console.error('❌ Failed to save tags to Firebase:', error)
    // フォールバックとしてlocalStorageに保存
    localStorage.setItem('customTags', JSON.stringify(customTags.value))
  }
}

const loadTagsFromFirebase = async () => {
  try {
    const { $firebaseFirestore } = useNuxtApp()
    const auth = getAuth()
    const user = auth.currentUser

    if (!user) {
      // 未認証の場合はlocalStorageから読み込み
      const saved = localStorage.getItem('customTags')
      if (saved) {
        customTags.value = JSON.parse(saved)
      }
      return
    }

    const { doc, getDoc } = await import('firebase/firestore')
    const userTagsRef = doc($firebaseFirestore, 'userTags', user.uid)
    const docSnap = await getDoc(userTagsRef)

    if (docSnap.exists()) {
      const data = docSnap.data()
      customTags.value = data.tags || []
      console.log('✅ Tags loaded from Firebase')
    } else {
      // Firebaseにデータがない場合はlocalStorageから移行
      const saved = localStorage.getItem('customTags')
      if (saved) {
        customTags.value = JSON.parse(saved)
        // Firebaseに保存して移行完了
        await saveTagsToFirebase()
        localStorage.removeItem('customTags')
      }
    }
  } catch (error) {
    console.error('❌ Failed to load tags from Firebase:', error)
    // エラー時はlocalStorageから読み込み
    const saved = localStorage.getItem('customTags')
    if (saved) {
      customTags.value = JSON.parse(saved)
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

// ドロップダウンメニューの外側クリックを監視
const handleClickOutside = (event) => {
  if (!event.target.closest('.relative')) {
    showMenuDropdown.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await loadTagsFromFirebase()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* スクロールバーを隠す */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* カレンダースクロールコンテナ */
.calendar-scroll-container {
  height: calc(100vh - 200px);
  overflow-y: auto;
  overflow-x: hidden;
}

/* 各日のコンテンツ */
.calendar-day-content {
  height: 650px;
  position: relative;
}

/* レスポンシブ対応 */
@media (min-width: 768px) {
  .calendar-scroll-container {
    height: calc(100vh - 180px);
  }

  .calendar-day-content {
    height: 650px;
  }

  .calendar-container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 1rem;
  }
}
</style>
