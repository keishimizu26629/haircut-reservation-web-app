<template>
  <div class="min-h-screen bg-gray-50 overflow-hidden">
    <!-- ヘッダー -->
    <CalendarHeader
      :current-month-text="currentMonthText"
      :show-stats="showStats"
      @previous-days="previousDays"
      @next-days="nextDays"
      @go-to-today="goToToday"
      @show-calendar-modal="openCalendarModal"
      @open-tag-modal="openTagModal"
      @show-stats="showStats = true"
      @logout="logout"
    />

    <!-- メインコンテンツ -->
    <main class="pb-4 px-2 sm:px-4">
      <!-- 集計表示 -->
      <CalendarStats
        :show-stats="showStats"
        :selected-month-text="selectedMonthText"
        :monthly-stats="monthlyStats"
        @hide-stats="showStats = false"
        @previous-month="previousMonth"
        @next-month="nextMonth"
      />

      <!-- カレンダーグリッド -->
      <CalendarGrid
        :show-stats="showStats"
        :display-days="displayDays"
        :display-hours="displayHours"
        :reservations="reservations"
        :tags="tags"
        :is-single-day-view="isSingleDayView"
        :selected-single-date="selectedSingleDate"
        @edit-reservation="editReservation"
        @time-click="handleTimeClickFromGrid"
        @date-header-click="handleDateHeaderClick"
      />
    </main>

    <!-- フローティングアクションボタン（モバイル） -->
    <button
      class="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center z-30 transition-all hover:scale-110"
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
    <ReservationModal
      :show-modal="showModal"
      :editing-reservation="editingReservation"
      :reservation-form="reservationForm"
      :tags="tags"
      :time-slots="timeSlots"
      :loading="loading"
      @close-modal="closeModal"
      @save-reservation="saveReservation"
      @delete-reservation="deleteReservation"
      @update-form="updateReservationForm"
    />

    <!-- タグ管理モーダル -->
    <TagModal
      :show-tag-modal="showTagModal"
      :tags="tags"
      :new-tag-name="newTagName"
      :new-tag-color="newTagColor"
      :tag-colors="tagColors"
      @close-tag-modal="closeTagModal"
      @remove-tag="removeTag"
      @add-tag="addTag"
      @update-new-tag-name="newTagName = $event"
      @update-new-tag-color="newTagColor = $event"
    />

    <!-- カレンダーモーダル -->
    <CalendarModal
      :show-calendar-modal="showCalendarModal"
      :calendar-month-text="calendarMonthText"
      :calendar-dates="getCalendarDates()"
      @close-calendar-modal="showCalendarModal = false"
      @previous-calendar-month="calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1)"
      @next-calendar-month="calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1)"
      @select-date="selectDate"
    />
  </div>
</template>

<script setup>
import { signOut } from 'firebase/auth'
import { getAuth } from 'firebase/auth'
import { useSimpleReservations } from '../composables/useSimpleReservations'
import CalendarHeader from '../components/Calendar/CalendarHeader.vue'
import CalendarStats from '../components/Calendar/CalendarStats.vue'
import CalendarGrid from '../components/Calendar/CalendarGrid.vue'
import ReservationModal from '../components/Calendar/ReservationModal.vue'
import TagModal from '../components/Calendar/TagModal.vue'
import CalendarModal from '../components/Calendar/CalendarModal.vue'

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

const showCalendarModal = ref(false)
const calendarMonth = ref(new Date())
const editingReservation = ref(null)
const selectedTag = ref(null)
const newTagName = ref('')
const newTagColor = ref('blue')

// 表示モード管理
const isSingleDayView = ref(false)
const selectedSingleDate = ref(null)

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
  status: 'active',
  memo: ''
})



// Computed
const displayDays = computed(() => {
  console.log('🔍 [DEBUG] displayDays計算開始')
  console.log('🔍 [DEBUG] displayDays - currentDate:', currentDate.value)
  console.log('🔍 [DEBUG] displayDays - isSingleDayView:', isSingleDayView.value)
  console.log('🔍 [DEBUG] displayDays - selectedSingleDate:', selectedSingleDate.value)

  const days = []
  const startDate = new Date(currentDate.value)
  console.log('🔍 [DEBUG] displayDays - startDate:', startDate)

  for (let i = 0; i < 3; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)

    // タイムゾーンを考慮した正確な日付文字列を生成
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateString = `${year}-${month}-${day}`

    const dayData = {
      date: dateString,
      dayName: ['日', '月', '火', '水', '木', '金', '土'][date.getDay()],
      dateNumber: date.getDate(),
      isToday: date.toDateString() === new Date().toDateString()
    }

    console.log(`🔍 [DEBUG] displayDays - 日付${i}:`, {
      originalDate: date,
      dateString: dayData.date,
      dateNumber: dayData.dateNumber,
      dayName: dayData.dayName,
      isToday: dayData.isToday,
      generatedString: `${year}-${month}-${day}`
    })

    days.push(dayData)
  }

  console.log('🔍 [DEBUG] displayDays計算完了 - 結果:', days)
  return days
})



const currentMonthText = computed(() => {
  console.log('🔍 [DEBUG] currentMonthText計算開始')
  console.log('🔍 [DEBUG] isSingleDayView:', isSingleDayView.value)
  console.log('🔍 [DEBUG] selectedSingleDate:', selectedSingleDate.value)
  console.log('🔍 [DEBUG] currentDate:', currentDate.value)

  // 単日表示時は選択された日付の月を表示
  if (isSingleDayView.value && selectedSingleDate.value) {
    // 日付文字列から直接年月を抽出（より確実）
    const [year, month] = selectedSingleDate.value.split('-').map(Number)
    const result = `${year}年${month}月`
    console.log('🔍 [DEBUG] 単日表示モード - selectedSingleDate解析:', { year, month, result })
    return result
  }
  // 通常表示時はcurrentDateの月を表示
  const date = currentDate.value
  const result = `${date.getFullYear()}年${date.getMonth() + 1}月`
  console.log('🔍 [DEBUG] 通常表示モード - currentDate解析:', {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    result
  })
  return result
})

const selectedMonthText = computed(() => {
  const date = selectedStatsMonth.value
  return `${date.getFullYear()}年${date.getMonth() + 1}月`
})

const calendarMonthText = computed(() => {
  if (!calendarMonth.value) return ''
  return `${calendarMonth.value.getFullYear()}年${calendarMonth.value.getMonth() + 1}月`
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
const handleTimeClickFromGrid = ({ date, startTime }) => {
  openReservationModal(date, startTime)
}

const updateReservationForm = ({ field, value }) => {
  reservationForm[field] = value
}

const _selectTag = (tag) => {
  selectedTag.value = tag
  reservationForm.tagId = tag.id
  reservationForm.category = tag.id // 互換性のため
}



const previousDays = () => {
  console.log('🔍 [DEBUG] previousDays呼び出し開始')
  console.log('🔍 [DEBUG] previousDays - 現在のcurrentDate:', currentDate.value)
  console.log('🔍 [DEBUG] previousDays - 現在のisSingleDayView:', isSingleDayView.value)
  console.log('🔍 [DEBUG] previousDays - 現在のselectedSingleDate:', selectedSingleDate.value)

  const newDate = new Date(currentDate.value)
  if (isSingleDayView.value) {
    // 単日表示時は1日前に移動
    newDate.setDate(newDate.getDate() - 1)
    selectedSingleDate.value = newDate.toISOString().split('T')[0]
    console.log('🔍 [DEBUG] previousDays - 単日表示モード - 新しい日付:', newDate)
    console.log('🔍 [DEBUG] previousDays - 単日表示モード - 新しいselectedSingleDate:', selectedSingleDate.value)
  } else {
    // 3日表示時は3日前に移動
    newDate.setDate(newDate.getDate() - 3)
    console.log('🔍 [DEBUG] previousDays - 3日表示モード - 新しい日付:', newDate)
  }
  currentDate.value = newDate
  console.log('🔍 [DEBUG] previousDays - 最終的なcurrentDate:', currentDate.value)
}

const nextDays = () => {
  console.log('🔍 [DEBUG] nextDays呼び出し開始')
  console.log('🔍 [DEBUG] nextDays - 現在のcurrentDate:', currentDate.value)
  console.log('🔍 [DEBUG] nextDays - 現在のisSingleDayView:', isSingleDayView.value)
  console.log('🔍 [DEBUG] nextDays - 現在のselectedSingleDate:', selectedSingleDate.value)

  const newDate = new Date(currentDate.value)
  if (isSingleDayView.value) {
    // 単日表示時は1日後に移動
    newDate.setDate(newDate.getDate() + 1)
    selectedSingleDate.value = newDate.toISOString().split('T')[0]
    console.log('🔍 [DEBUG] nextDays - 単日表示モード - 新しい日付:', newDate)
    console.log('🔍 [DEBUG] nextDays - 単日表示モード - 新しいselectedSingleDate:', selectedSingleDate.value)
  } else {
    // 3日表示時は3日後に移動
    newDate.setDate(newDate.getDate() + 3)
    console.log('🔍 [DEBUG] nextDays - 3日表示モード - 新しい日付:', newDate)
  }
  currentDate.value = newDate
  console.log('🔍 [DEBUG] nextDays - 最終的なcurrentDate:', currentDate.value)
}

const goToToday = () => {
  currentDate.value = new Date()
  // 今日に移動する時は3日表示に戻る
  isSingleDayView.value = false
  selectedSingleDate.value = null
}

// 単日表示関連のメソッド
const handleDateHeaderClick = (date) => {
  console.log('🔍 [DEBUG] handleDateHeaderClick呼び出し - クリックされた日付:', date)
  console.log('🔍 [DEBUG] handleDateHeaderClick - 現在のisSingleDayView:', isSingleDayView.value)
  console.log('🔍 [DEBUG] handleDateHeaderClick - 現在のselectedSingleDate:', selectedSingleDate.value)
  console.log('🔍 [DEBUG] handleDateHeaderClick - 現在のcurrentDate:', currentDate.value)

  if (isSingleDayView.value && selectedSingleDate.value === date) {
    // 同じ日付をクリックした場合は3日表示に戻る
    console.log('🔍 [DEBUG] handleDateHeaderClick - 同じ日付クリック、3日表示に戻る')
    isSingleDayView.value = false
    selectedSingleDate.value = null
  } else {
    // 異なる日付をクリックした場合はその日の単日表示
    console.log('🔍 [DEBUG] handleDateHeaderClick - 異なる日付クリック、単日表示に切り替え')
    isSingleDayView.value = true
    selectedSingleDate.value = date
    // currentDateも更新して一貫性を保つ
    const [year, month, day] = date.split('-').map(Number)
    console.log('🔍 [DEBUG] handleDateHeaderClick - 日付解析:', { year, month, day })
    currentDate.value = new Date(year, month - 1, day)
    console.log('🔍 [DEBUG] handleDateHeaderClick - currentDate更新後:', currentDate.value)
  }

  console.log('🔍 [DEBUG] handleDateHeaderClick完了 - 最終状態:')
  console.log('🔍 [DEBUG] - isSingleDayView:', isSingleDayView.value)
  console.log('🔍 [DEBUG] - selectedSingleDate:', selectedSingleDate.value)
  console.log('🔍 [DEBUG] - currentDate:', currentDate.value)
}



// カレンダーモーダル用の関数
const getCalendarDates = () => {
  const dates = []
  const year = calendarMonth.value.getFullYear()
  const month = calendarMonth.value.getMonth()

  // 月の最初の日
  const firstDay = new Date(year, month, 1)

  // 最初の週の日曜日から開始
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())

  // 6週間分表示
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)

    const dateStr = date.toISOString().split('T')[0]
    const isCurrentMonth = date.getMonth() === month
    const isToday = dateStr === new Date().toISOString().split('T')[0]
    const isSelected = dateStr === currentDate.value.toISOString().split('T')[0]

    dates.push({
      date: date,
      dateStr: dateStr,
      day: date.getDate(),
      isCurrentMonth: isCurrentMonth,
      isToday: isToday,
      isSelected: isSelected
    })
  }

  return dates
}

const openCalendarModal = () => {
  // カレンダーモーダルを開く時は現在の表示日付の月を初期値にする
  calendarMonth.value = new Date(currentDate.value)
  showCalendarModal.value = true
}

const selectDate = (date) => {
  console.log('🔍 [DEBUG] selectDate呼び出し - 選択された日付:', date)
  console.log('🔍 [DEBUG] selectDate呼び出し前 - currentDate:', currentDate.value)
  console.log('🔍 [DEBUG] selectDate呼び出し前 - isSingleDayView:', isSingleDayView.value)
  console.log('🔍 [DEBUG] selectDate呼び出し前 - selectedSingleDate:', selectedSingleDate.value)

  currentDate.value = new Date(date)
  console.log('🔍 [DEBUG] selectDate - currentDate更新後:', currentDate.value)

  // カレンダーモーダルの月表示も選択した日付の月に更新
  calendarMonth.value = new Date(date)
  console.log('🔍 [DEBUG] selectDate - calendarMonth更新後:', calendarMonth.value)

  showCalendarModal.value = false
  console.log('🔍 [DEBUG] selectDate処理完了')
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
  reservationForm.memo = ''
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
    status: reservation.status || 'active',
    memo: reservation.memo || ''
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
      memo: reservationForm.memo || '',
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



// Lifecycle
onMounted(async () => {
  await loadTagsFromFirebase()
})
</script>
