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

          <!-- 集計ボタン -->
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
            <span class="hidden sm:inline">{{ showStats ? 'カレンダー' : '集計' }}</span>
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
      <!-- 集計表示（デスクトップのみ） -->
      <div
        v-if="showStats"
        class="hidden md:block max-w-7xl mx-auto px-4 py-6"
      >
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold">
              {{ selectedMonthText }}の集計
            </h2>
            <!-- 月選択 -->
            <div class="flex items-center gap-2">
              <button
                class="p-1 hover:bg-gray-100 rounded"
                @click="previousMonth"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <span class="text-sm font-medium min-w-[100px] text-center">
                {{ selectedMonthText }}
              </span>
              <button
                class="p-1 hover:bg-gray-100 rounded"
                @click="nextMonth"
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
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
          <div class="flex bg-gray-200">
            <!-- 時間カラム（固定幅） -->
            <div
              class="bg-white"
              style="width: 60px; min-width: 60px;"
            >
              <!-- ヘッダースペーサー -->
              <div
                class="px-1 py-2 text-center border-b border-gray-200"
                style="height: 60px;"
              >
                <div class="text-xs font-medium text-gray-500">
                  時間
                </div>
              </div>
              <!-- 時間表示エリア -->
              <div class="relative calendar-day-content">
                <div
                  v-for="hour in displayHours"
                  :key="hour"
                  class="absolute left-0 right-0 border-t border-gray-100"
                  :style="{ top: `${(hour - 8) * 50}px` }"
                >
                  <span class="absolute -top-2 left-1 text-xs text-gray-500">
                    {{ hour }}:00
                  </span>
                </div>
              </div>
            </div>

            <!-- 日付ごとの予約表示エリア -->
            <div class="flex-1 grid grid-cols-3 gap-px bg-gray-200">
              <div
                v-for="day in displayDays"
                :key="day.date"
                class="bg-white"
              >
                <!-- 日付ヘッダー -->
                <div
                  :class="[
                    'px-2 py-2 text-center border-b sticky top-0 bg-white z-20',
                    day.isToday ? 'bg-blue-50 border-blue-200' : 'border-gray-200'
                  ]"
                  style="height: 60px;"
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

                <!-- 予約表示エリア -->
                <div class="relative calendar-day-content">
                  <!-- 時間線（補助線） -->
                  <div
                    v-for="hour in displayHours"
                    :key="hour"
                    class="absolute left-0 right-0 border-t border-gray-100"
                    :style="{ top: `${(hour - 8) * 50}px` }"
                  />

                  <!-- 予約ブロック -->
                  <div
                    v-for="reservation in getReservationsForDay(day.date)"
                    :key="reservation.id"
                    :class="[
                      'absolute p-1 rounded text-xs cursor-pointer shadow-sm hover:shadow-md transition-shadow z-10',
                      getTagColor(reservation.tagId),
                      reservation.status === 'completed' ? 'opacity-70' : '',
                      reservation.status === 'cancelled' ? 'opacity-50 line-through' : ''
                    ]"
                    :style="getReservationStyle(reservation)"
                    @click="editReservation(reservation)"
                  >
                    <div class="font-medium truncate leading-3">
                      {{ reservation.customerName }}
                      <span
                        v-if="reservation.status === 'completed'"
                        class="ml-1"
                      >✓</span>
                      <span
                        v-if="reservation.status === 'cancelled'"
                        class="ml-1"
                      >✗</span>
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
        <div
          :class="[
            'sticky top-0 border-b px-4 py-3 flex justify-between items-center',
            editingReservation ? 'bg-blue-50' : 'bg-green-50'
          ]"
        >
          <div class="flex items-center gap-2">
            <div
              :class="[
                'w-3 h-3 rounded-full',
                editingReservation ? 'bg-blue-500' : 'bg-green-500'
              ]"
            />
            <h2
              :class="[
                'text-lg font-semibold',
                editingReservation ? 'text-blue-700' : 'text-green-700'
              ]"
            >
              {{ editingReservation ? '📝 予約編集' : '➕ 新規予約' }}
            </h2>
          </div>
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
          <div data-screen="reservation-form">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              タグ
            </label>
            <div
              v-if="tags.length > 0"
              class="tag-selection"
            >
              <button
                v-for="tag in tags"
                :key="tag.id"
                type="button"
                :class="[
                  'tag-option',
                  reservationForm.tagId === tag.id ? 'selected' : ''
                ]"
                :data-color="tag.color"
                @click="reservationForm.tagId = tag.id"
              >
                <span
                  class="swatch"
                  aria-hidden="true"
                />
                <span class="tag-name">{{ tag.label }}</span>
              </button>
            </div>
            <div
              v-else
              class="text-sm text-gray-500 italic"
            >
              タグが設定されていません。「タグ管理」から追加してください。
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

          <!-- 状態選択（編集時のみ表示） -->
          <div v-if="editingReservation">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              状態
            </label>
            <div class="grid grid-cols-3 gap-2">
              <button
                type="button"
                :class="[
                  'px-3 py-2 text-sm rounded-lg transition-colors font-medium',
                  reservationForm.status === 'active'
                    ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-300'
                ]"
                @click="reservationForm.status = 'active'"
              >
                予約中
              </button>
              <button
                type="button"
                :class="[
                  'px-3 py-2 text-sm rounded-lg transition-colors font-medium',
                  reservationForm.status === 'completed'
                    ? 'bg-green-100 text-green-800 border-2 border-green-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-300'
                ]"
                @click="reservationForm.status = 'completed'"
              >
                完了
              </button>
              <button
                type="button"
                :class="[
                  'px-3 py-2 text-sm rounded-lg transition-colors font-medium',
                  reservationForm.status === 'cancelled'
                    ? 'bg-red-100 text-red-800 border-2 border-red-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-300'
                ]"
                @click="reservationForm.status = 'cancelled'"
              >
                キャンセル
              </button>
            </div>
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

        <div
          class="p-4"
          data-screen="tag-settings"
        >
          <!-- 既存タグ一覧 -->
          <div class="mb-4">
            <h3 class="text-sm font-medium text-gray-700 mb-2">
              現在のタグ
            </h3>
            <div class="max-h-60 overflow-y-auto">
              <ul class="tag-list">
                <li
                  v-for="tag in tags"
                  :key="tag.id"
                  class="tag-item"
                  :data-color="tag.color"
                >
                  <span
                    class="swatch"
                    aria-hidden="true"
                  />
                  <span class="tag-name">{{ tag.label }}</span>
                  <button
                    v-if="tag.id.startsWith('custom_')"
                    class="ml-auto p-1 hover:bg-black hover:bg-opacity-10 rounded"
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
                </li>
              </ul>
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
const selectedStatsMonth = ref(new Date()) // 集計用の月選択
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
  { name: 'pink', bgClass: 'tag-color-picker-pink' },
  { name: 'blue', bgClass: 'tag-color-picker-blue' },
  { name: 'green', bgClass: 'tag-color-picker-green' },
  { name: 'yellow', bgClass: 'tag-color-picker-yellow' },
  { name: 'purple', bgClass: 'tag-color-picker-purple' },
  { name: 'orange', bgClass: 'tag-color-picker-orange' },
  { name: 'red', bgClass: 'tag-color-picker-red' },
  { name: 'gray', bgClass: 'tag-color-picker-gray' },
]

// 全タグ（カスタムタグのみ）
const tags = computed(() => customTags.value)

const reservationForm = reactive({
  customerName: '',
  date: '',
  startTime: '09:00',
  duration: 60, // デフォルト1時間（内部処理用）
  tagId: 'default',
  category: 'default', // 互換性のため残す
  status: 'active'
})



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



const currentMonthText = computed(() => {
  const date = currentDate.value
  return `${date.getFullYear()}年${date.getMonth() + 1}月`
})

const selectedMonthText = computed(() => {
  const date = selectedStatsMonth.value
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
  const selectedMonth = selectedStatsMonth.value.getMonth()
  const selectedYear = selectedStatsMonth.value.getFullYear()

  const monthlyReservations = reservations.value.filter(reservation => {
    const reservationDate = new Date(reservation.date)
    return reservationDate.getMonth() === selectedMonth &&
           reservationDate.getFullYear() === selectedYear
  })

  const total = monthlyReservations.length
  const completed = monthlyReservations.filter(r => r.status === 'completed').length
  const active = monthlyReservations.filter(r => r.status === 'active').length
  const cancelled = monthlyReservations.filter(r => r.status === 'cancelled').length

  return { total, completed, active, cancelled }
})

// Methods
const getReservationsForDay = (date) => {
  // すべての予約を表示（キャンセルされた予約も含む）
  const dayReservations = reservations.value.filter(r =>
    r.date === date
  )

  // 同じ時間の予約をグループ化して、横並びインデックスを付与
  const groupedByTime = {}
  dayReservations.forEach(reservation => {
    const time = reservation.startTime
    if (!groupedByTime[time]) {
      groupedByTime[time] = []
    }
    groupedByTime[time].push(reservation)
  })

  // 各予約に横並びインデックスと同時間の総数を付与
  const result = []
  Object.entries(groupedByTime).forEach(([_time, reservationsAtTime]) => {
    const total = Math.min(reservationsAtTime.length, 3) // 最大3つまで横並び
    reservationsAtTime.slice(0, 3).forEach((reservation, index) => {
      result.push({
        ...reservation,
        horizontalIndex: index,
        totalAtSameTime: total
      })
    })
  })

  return result
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
  if (tag && tag.color) {
    return `tag-color-${tag.color}`
  }
  return 'tag-color-default'
}

const getReservationStyle = (reservation) => {
  const top = calculatePosition(reservation.startTime)
  const total = reservation.totalAtSameTime || 1
  const index = reservation.horizontalIndex || 0
  const width = `calc((100% - 16px) / ${total})`
  const left = `calc(8px + ((100% - 16px) / ${total}) * ${index})`

  return {
    top: `${top}px`,
    left: left,
    width: width,
    height: '30px',
    fontSize: '10px'
  }
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

// 集計月のナビゲーション
const previousMonth = () => {
  const newDate = new Date(selectedStatsMonth.value)
  newDate.setMonth(newDate.getMonth() - 1)
  selectedStatsMonth.value = newDate
}

const nextMonth = () => {
  const newDate = new Date(selectedStatsMonth.value)
  newDate.setMonth(newDate.getMonth() + 1)
  selectedStatsMonth.value = newDate
}

const openReservationModal = (date = null, startTime = null) => {
  editingReservation.value = null
  reservationForm.customerName = ''
  reservationForm.date = date || displayDays.value[Math.floor(displayDays.value.length / 2)].date
  reservationForm.startTime = startTime || '09:00'
  reservationForm.duration = 60 // デフォルト1時間
  reservationForm.tagId = selectedTag.value?.id || (tags.value[0]?.id || 'default')
  reservationForm.category = selectedTag.value?.id || (tags.value[0]?.id || 'default')
  reservationForm.status = 'active'
  showModal.value = true
}

const editReservation = (reservation) => {
  editingReservation.value = reservation
  Object.assign(reservationForm, {
    customerName: reservation.customerName,
    date: reservation.date,
    startTime: reservation.startTime || reservation.timeSlot,
    duration: reservation.duration || 60,
    tagId: reservation.tagId || reservation.category || 'default',
    category: reservation.category || reservation.tagId || 'default',
    status: reservation.status || 'active'
  })
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingReservation.value = null
}

const saveReservation = async () => {
  try {
    // Firestoreルールに合わせてデータを整形
    const data = {
      customerName: reservationForm.customerName,
      date: reservationForm.date,
      startTime: reservationForm.startTime,
      duration: reservationForm.duration || 60,
      status: reservationForm.status || 'active',
      // tagIdまたはcategoryを設定（互換性のため）
      tagId: reservationForm.tagId || 'default',
      category: reservationForm.category || reservationForm.tagId || 'default',
      // tagオブジェクトは保存しない（表示用のみ）
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

  const newTag = {
    id: `custom_${Date.now()}`,
    label: newTagName.value,
    color: newTagColor.value
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
      } else {
        // 初回利用時は空の配列（ユーザーが自分で作成する）
        customTags.value = []
      }
    }
  } catch (error) {
    console.error('❌ Failed to load tags from Firebase:', error)
    // エラー時はlocalStorageから読み込み
    const saved = localStorage.getItem('customTags')
    if (saved) {
      customTags.value = JSON.parse(saved)
    } else {
      customTags.value = []
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
