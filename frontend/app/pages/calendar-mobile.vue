<template>
  <div class="min-h-screen bg-gray-50">
    <!-- モバイルヘッダー -->
    <header class="bg-white shadow-sm border-b sticky top-0 z-40">
      <div class="px-4 py-3">
        <!-- タグセレクター -->
        <div class="mb-3">
          <div class="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
            <button
              v-for="tag in tags"
              :key="tag.id"
              type="button"
              :class="[
                'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all',
                selectedTag?.id === tag.id
                  ? tag.activeClass
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              ]"
              @click="selectTag(tag)"
            >
              {{ tag.label }}
            </button>
            <button
              type="button"
              class="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 whitespace-nowrap"
              @click="openTagModal"
            >
              + タグ追加
            </button>
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
      <!-- カレンダー表示（1日または3日） -->
      <div
        :class="[
          'grid gap-px bg-gray-200',
          isSingleDayView ? 'grid-cols-1' : 'grid-cols-3'
        ]"
      >
        <div
          v-for="(day, index) in displayDays"
          :key="day.date"
          class="bg-white"
        >
          <!-- 日付ヘッダー -->
          <div
            :class="[
              'px-2 py-2 text-center border-b cursor-pointer',
              day.isToday ? 'bg-blue-50 border-blue-200' : 'border-gray-200',
              'hover:bg-gray-50'
            ]"
            @click="handleDateHeaderClick(day.date)"
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
          <div
            class="relative"
            style="height: 600px; overflow-y: auto;"
          >
            <!-- 時間線 -->
            <div
              v-for="hour in displayHours"
              :key="hour"
              class="absolute left-0 right-0 border-t border-gray-100"
              :style="{ top: `${(hour - 8) * 50}px` }"
            >
              <span
                v-if="index === 0 || isSingleDayView"
                :class="[
                  'absolute -left-1 -top-2 bg-white px-1',
                  isSingleDayView ? 'text-sm text-gray-600' : 'text-xs text-gray-400'
                ]"
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

            <!-- タップで予約追加 -->
            <div
              class="absolute inset-0"
              @click="handleTimeClick($event, day.date)"
            />
          </div>
        </div>
      </div>
    </main>

    <!-- フローティングアクションボタン -->
    <button
      class="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center z-30"
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
      class="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-t-2xl w-full max-h-[90vh] overflow-y-auto">
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
          <!-- 新規タグ追加 -->
          <div class="mb-4 p-3 bg-gray-50 rounded-lg">
            <input
              v-model="newTagName"
              type="text"
              placeholder="新しいタグ名"
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
              タグを追加
            </button>
          </div>

          <!-- 既存タグ一覧 -->
          <div class="space-y-2">
            <div
              v-for="tag in customTags"
              :key="tag.id"
              class="flex items-center justify-between p-2 rounded-lg"
              :class="tag.bgClass"
            >
              <span class="font-medium">{{ tag.label }}</span>
              <button
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
import { useSimpleReservations } from '../composables/useSimpleReservations'

definePageMeta({
  ssr: false
})

useHead({
  title: '予約カレンダー（モバイル） - 美容室予約システム'
})

// Composables
const { reservations, loading, addReservation, updateReservation, deleteReservation: removeReservation } = useSimpleReservations()

// State
const currentDate = ref(new Date())
const showModal = ref(false)
const showTagModal = ref(false)
const editingReservation = ref(null)
const selectedTag = ref(null)
const newTagName = ref('')
const newTagColor = ref('blue')

// 表示モード管理（単日表示対応）
const isSingleDayView = ref(false)
const selectedSingleDate = ref(null)

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

  // 単日表示モードの場合
  if (isSingleDayView.value && selectedSingleDate.value) {
    // selectedSingleDateから日付を作成
    const [year, month, day] = selectedSingleDate.value.split('-').map(Number)
    const date = new Date(year, month - 1, day)

    days.push({
      date: selectedSingleDate.value,
      dayName: ['日', '月', '火', '水', '木', '金', '土'][date.getDay()],
      dateNumber: date.getDate(),
      isToday: date.toDateString() === new Date().toDateString()
    })
  } else {
    // 3日表示モード
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
  }

  return days
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

const selectTag = (tag) => {
  selectedTag.value = tag
  reservationForm.tagId = tag.id
}

const previousDays = () => {
  const newDate = new Date(currentDate.value)
  if (isSingleDayView.value) {
    // 単日表示時は1日前に移動
    newDate.setDate(newDate.getDate() - 1)
    // 日付文字列を正確に生成
    const year = newDate.getFullYear()
    const month = String(newDate.getMonth() + 1).padStart(2, '0')
    const day = String(newDate.getDate()).padStart(2, '0')
    selectedSingleDate.value = `${year}-${month}-${day}`
  } else {
    // 3日表示時は3日前に移動
    newDate.setDate(newDate.getDate() - 3)
  }
  currentDate.value = newDate
}

const nextDays = () => {
  const newDate = new Date(currentDate.value)
  if (isSingleDayView.value) {
    // 単日表示時は1日後に移動
    newDate.setDate(newDate.getDate() + 1)
    // 日付文字列を正確に生成
    const year = newDate.getFullYear()
    const month = String(newDate.getMonth() + 1).padStart(2, '0')
    const day = String(newDate.getDate()).padStart(2, '0')
    selectedSingleDate.value = `${year}-${month}-${day}`
  } else {
    // 3日表示時は3日後に移動
    newDate.setDate(newDate.getDate() + 3)
  }
  currentDate.value = newDate
}

const goToToday = () => {
  currentDate.value = new Date()
  // 今日に移動する時は3日表示に戻る
  isSingleDayView.value = false
  selectedSingleDate.value = null
}

// 日付ヘッダークリック処理
const handleDateHeaderClick = (date) => {
  if (isSingleDayView.value && selectedSingleDate.value === date) {
    // 同じ日付をクリックした場合は3日表示に戻る
    isSingleDayView.value = false
    selectedSingleDate.value = null
  } else {
    // 異なる日付をクリックした場合はその日の単日表示
    isSingleDayView.value = true
    selectedSingleDate.value = date
    // currentDateも更新して一貫性を保つ
    const [year, month, day] = date.split('-').map(Number)
    currentDate.value = new Date(year, month - 1, day)
  }
}

const openReservationModal = (date = null, startTime = null) => {
  editingReservation.value = null
  reservationForm.customerName = ''
  reservationForm.notes = ''
  reservationForm.date = date || displayDays.value[1].date
  reservationForm.startTime = startTime || '09:00'
  reservationForm.duration = 60
  reservationForm.tagId = selectedTag.value?.id || (tags.value[0]?.id || 'default')
  reservationForm.status = 'active'
  showModal.value = true
}

const editReservation = (reservation) => {
  editingReservation.value = reservation
  Object.assign(reservationForm, {
    customerName: reservation.customerName,
    notes: reservation.notes || '',
    date: reservation.date,
    startTime: reservation.startTime,
    duration: reservation.duration || 60,
    tagId: reservation.tagId || (tags.value[0]?.id || 'default'),
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

// Firebase保存機能（calendar.vueと共通）
const saveTagsToFirebase = async () => {
  try {
    const { $firebaseFirestore } = useNuxtApp()
    const { getAuth } = await import('firebase/auth')
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
    localStorage.setItem('customTags', JSON.stringify(customTags.value))
  }
}

const loadTagsFromFirebase = async () => {
  try {
    const { $firebaseFirestore } = useNuxtApp()
    const { getAuth } = await import('firebase/auth')
    const auth = getAuth()
    const user = auth.currentUser

    if (!user) {
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
      const saved = localStorage.getItem('customTags')
      if (saved) {
        customTags.value = JSON.parse(saved)
        await saveTagsToFirebase()
        localStorage.removeItem('customTags')
      }
    }
  } catch (error) {
    console.error('❌ Failed to load tags from Firebase:', error)
    const saved = localStorage.getItem('customTags')
    if (saved) {
      customTags.value = JSON.parse(saved)
    }
  }
}

// Lifecycle
onMounted(async () => {
  await loadTagsFromFirebase()
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
</style>
