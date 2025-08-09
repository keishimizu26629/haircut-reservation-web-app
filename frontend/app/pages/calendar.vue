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
      <div v-if="showStats" class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-lg font-semibold mb-4">
          {{ currentDateText }}の統計
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-sm text-gray-600">総予約数</div>
            <div class="text-2xl font-bold mt-1">{{ monthlyStats.total }}</div>
          </div>
          <div class="bg-green-50 rounded-lg p-4">
            <div class="text-sm text-green-600">完了</div>
            <div class="text-2xl font-bold text-green-700 mt-1">{{ monthlyStats.completed }}</div>
          </div>
          <div class="bg-blue-50 rounded-lg p-4">
            <div class="text-sm text-blue-600">予約中</div>
            <div class="text-2xl font-bold text-blue-700 mt-1">{{ monthlyStats.active }}</div>
          </div>
          <div class="bg-red-50 rounded-lg p-4">
            <div class="text-sm text-red-600">キャンセル</div>
            <div class="text-2xl font-bold text-red-700 mt-1">{{ monthlyStats.cancelled }}</div>
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
      <div v-show="!showStats" class="bg-white rounded-lg shadow-xl overflow-hidden border-2 border-gray-300">
        <!-- 曜日ヘッダー -->
        <div class="grid grid-cols-8 bg-gradient-to-b from-gray-100 to-gray-50 border-b-2 border-gray-400">
          <div class="px-4 py-3 text-sm font-bold text-gray-800 text-center border-r-2 border-gray-400 bg-gray-200">
            時間
          </div>
          <div
            v-for="day in weekDays"
            :key="day.date"
            class="px-4 py-3 text-sm font-bold text-gray-800 text-center border-l border-gray-300"
            :class="{ 'bg-blue-100 text-blue-800 font-extrabold': day.isToday }"
          >
            <div>{{ day.dayName }}</div>
            <div class="text-xs">
              {{ day.dateText }}
            </div>
          </div>
        </div>

        <!-- タイムスロットグリッド -->
        <div class="grid grid-cols-8 divide-y">
          <div
            v-for="timeSlot in timeSlots"
            :key="timeSlot"
            class="contents"
          >
            <!-- 時間ラベル -->
            <div class="px-2 py-3 text-sm font-semibold text-gray-700 text-center border-r-2 border-gray-300"
                 :class="{
                   'text-gray-400 italic': timeSlot < '09:00' || timeSlot >= '19:00',
                   'bg-gray-100': timeSlot < '09:00' || timeSlot >= '19:00',
                   'bg-gray-50': timeSlot >= '09:00' && timeSlot < '19:00'
                 }">
              {{ formatTime(timeSlot) }}
              <span v-if="timeSlot < '09:00' || timeSlot >= '19:00'" class="text-xs block text-gray-400">
                時間外
              </span>
            </div>

            <!-- 各曜日のスロット -->
            <div
              v-for="day in weekDays"
              :key="`${day.date}-${timeSlot}`"
              class="relative px-1 py-1 border border-gray-300 hover:bg-blue-50 cursor-pointer min-h-[50px] transition-colors"
              :class="{
                'bg-gray-50': timeSlot < '09:00' || timeSlot >= '19:00',
                'bg-blue-50': day.isToday,
                'border-b-2': timeSlot.endsWith(':30')
              }"
              @click="openReservationModal(day.date, timeSlot)"
            >
              <!-- 予約表示（ダブルブッキング対応） -->
              <div class="space-y-1">
                <div
                  v-for="reservation in getReservationsForSlot(day.date, timeSlot)"
                  :key="reservation.id"
                  class="mb-1 p-1 rounded-sm cursor-pointer border shadow-sm"
                  :class="[
                    getReservationColor(reservation.category),
                    reservation.status === 'completed' ? 'opacity-70' : '',
                    reservation.status === 'cancelled' ? 'line-through opacity-50' : '',
                    fontSize === 'small' ? 'text-xs' : fontSize === 'large' ? 'text-sm font-medium' : 'text-xs'
                  ]"
                  @click.stop="editReservation(reservation)"
                >
                  <div class="space-y-1">
                    <div class="flex items-center justify-between">
                      <span class="truncate flex-1 font-medium">
                        {{ reservation.customerName }}
                      </span>
                      <span v-if="reservation.status === 'completed'" class="ml-1">✓</span>
                    </div>
                    <div class="text-xs opacity-75">
                      <div v-if="reservation.startTime && reservation.duration">
                        {{ reservation.startTime }}〜{{ calculateEndTime(reservation.startTime, reservation.duration) }}
                        ({{ reservation.duration }}分)
                      </div>
                      <div v-else-if="reservation.timeSlot">
                        {{ reservation.timeSlot }}〜 (旧形式)
                      </div>
                      <div v-if="reservation.notes" class="mt-1">
                        {{ reservation.notes }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
            />
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
            <p class="text-xs text-gray-500 mt-1">※ 施術内容や特記事項など</p>
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
import { getFirebaseInstances } from '../stores/auth'
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
const formatTime = (timeSlot) => {
  return timeSlot // 既に"HH:MM"形式
}

// 削除: formatTimeRangeは不要

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

const getReservationsForSlot = (date, timeSlot) => {
  const filteredReservations = reservations.value.filter(reservation => {
    if (reservation.date !== date || reservation.status === 'cancelled') {
      return false
    }

    // 新しいデータ構造：startTime + durationで時間範囲をチェック
    if (reservation.startTime && reservation.duration) {
      const [slotHours, slotMinutes] = timeSlot.split(':').map(Number)
      const slotTime = slotHours * 60 + slotMinutes

      const [startHours, startMinutes] = reservation.startTime.split(':').map(Number)
      const startTime = startHours * 60 + startMinutes
      const endTime = startTime + reservation.duration

      // 30分スロット内に予約が重なっているかチェック
      const isInSlot = slotTime >= startTime && slotTime < endTime

      // デバッグログ（一時的）
      if (date === '2025-08-05' && timeSlot === '10:30') {
        console.log('🔍 Checking reservation for 2025-08-05 10:30:', {
          reservation,
          slotTime,
          startTime,
          endTime,
          isInSlot
        })
      }

      return isInSlot
    }

    // 旧データ構造との互換性：timeSlotがある場合
    return reservation.timeSlot === timeSlot || reservation.startTime === timeSlot
  })

  // デバッグログ（一時的）
  if (date === '2025-08-05' && filteredReservations.length > 0) {
    console.log(`📅 Found ${filteredReservations.length} reservations for ${date} ${timeSlot}`)
  }

  return filteredReservations
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

const openReservationModal = (date, timeSlot) => {
  editingReservation.value = null
  reservationForm.customerName = ''
  reservationForm.notes = ''
  reservationForm.date = date
  reservationForm.startTime = timeSlot // timeSlot → startTime
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
    const { auth } = getFirebaseInstances()
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
