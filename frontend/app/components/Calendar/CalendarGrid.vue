<template>
  <!-- カレンダー表示 -->
  <div
    v-show="!showStats"
    class="calendar-container"
  >
    <!-- スクロール可能なコンテナ -->
    <div class="calendar-scroll-container overflow-x-auto">
      <div class="bg-gray-200 min-w-max">
        <!-- 3日分のグループごとに表示 -->
        <div
          v-for="(dayGroup, groupIndex) in dayGroups"
          :key="`group-${groupIndex}`"
          class="mb-4"
        >
          <!-- ヘッダー部分（3カラム） -->
          <div class="flex bg-white border-b-2 border-gray-300 sticky top-0 z-20">
            <div
              v-for="day in dayGroup"
              :key="`header-${day.date}`"
              class="flex-1 px-2 py-2 text-center border-r border-gray-200 last:border-r-0 cursor-pointer hover:bg-gray-50"
              :style="{ minWidth: 'clamp(60px, 25vw, 300px)' }"
              @click="handleDateHeaderClick(day)"
            >
              <div
                :class="[
                  'flex items-center justify-center',
                  day.isToday ? 'text-blue-600' : 'text-gray-900'
                ]"
              >
                <span
                  :class="[
                    'font-bold',
                    day.isToday ? 'text-blue-600' : 'text-gray-900'
                  ]"
                  :style="{ fontSize: 'var(--calendar-date-text)' }"
                >
                  {{ day.dateNumber }}日({{ day.dayName }})
                </span>
              </div>
            </div>
          </div>

          <!-- データ部分（6カラム：時間＋日付のペアを3つ） -->
          <div class="flex bg-gray-200">
            <div
              v-for="day in dayGroup"
              :key="`data-${day.date}`"
              class="contents"
            >
              <!-- 時間カラム -->
              <div
                class="bg-white time-column flex-shrink-0 border-l border-gray-200"
                :style="timeColumnStyle"
              >
                <!-- 時間表示エリア -->
                <div class="relative calendar-day-content">
                  <!-- 時間表示 -->
                  <div
                    v-for="hour in displayHours"
                    :key="`${day.date}-hour-${hour}`"
                    class="absolute left-0 right-0"
                    :style="{ top: `${(hour - 8) * timeHeight}px` }"
                  >
                    <span
                      class="absolute -top-2 left-0 right-0 text-center text-gray-500"
                      :style="timeTextStyle"
                    >
                      {{ hour }}<span class="hidden md:inline">:00</span>
                    </span>
                  </div>
                  <!-- 30分マーカー -->
                  <template v-for="(hour, index) in displayHours">
                    <div
                      v-if="index < displayHours.length - 1"
                      :key="`${day.date}-half-${hour}`"
                      class="absolute left-0 right-0 flex justify-center"
                      :style="{ top: `${(hour - 8) * timeHeight + timeHeight / 2}px` }"
                    >
                      <span
                        class="text-gray-600 font-bold leading-none"
                        style="font-size: clamp(4px, 0.67vw, 5.33px); transform: translateY(-50%);"
                      >
                        ●
                      </span>
                    </div>
                  </template>
                </div>
              </div>

              <!-- 日付データカラム -->
              <div
                class="bg-white flex-1 border-l border-gray-200 first:border-l-0"
                :style="{ minWidth: 'clamp(40px, 20vw, 220px)' }"
              >
                <!-- 予約表示エリア -->
                <div class="relative calendar-day-content">
                  <!-- 予約ブロック -->
                  <div
                    v-for="reservation in getReservationsForDay(day.date)"
                    :key="reservation.id"
                    :class="[
                      'absolute p-0.5 rounded cursor-pointer shadow-sm hover:shadow-md transition-shadow z-10 reservation-block',
                      getTagColor(reservation.tagId),
                      reservation.status === 'completed' ? 'opacity-70' : '',
                      reservation.status === 'cancelled' ? 'opacity-50 line-through' : ''
                    ]"
                    :style="getReservationStyle(reservation)"
                    @click="$emit('edit-reservation', reservation)"
                  >
                    <div
                      class="font-medium truncate leading-tight"
                      :style="{ fontSize: 'var(--calendar-reservation-text)' }"
                    >
                      {{ reservation.customerName }}
                      <span
                        v-if="reservation.status === 'completed'"
                        class="ml-0.5"
                        style="font-size: 10px;"
                      >✓</span>
                      <span
                        v-if="reservation.status === 'cancelled'"
                        class="ml-0.5"
                        style="font-size: 10px;"
                      >✗</span>
                      <span
                        v-if="reservation.memo"
                        class="ml-0.5 text-gray-500 hidden lg:inline"
                      >📝</span>
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
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  showStats: {
    type: Boolean,
    default: false
  },
  displayDays: {
    type: Array,
    required: true
  },
  displayHours: {
    type: Array,
    default: () => [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
  },
  reservations: {
    type: Array,
    default: () => []
  },
  tags: {
    type: Array,
    default: () => []
  },
  isSingleDayView: {
    type: Boolean,
    default: false
  },
  selectedSingleDate: {
    type: String,
    default: null
  }
})

const emit = defineEmits([
  'edit-reservation',
  'time-click',
  'date-header-click'
])

// Reactive - レスポンシブな時間高さ
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 768)

const timeHeight = computed(() => {
  if (windowWidth.value >= 1024) return 100 // PC
  if (windowWidth.value >= 768) return 75   // タブレット
  return 50 // モバイル
})

// 時間カラムのスタイル（単日表示時に拡大）
const timeColumnStyle = computed(() => {
  if (props.isSingleDayView) {
    // 単日表示時：幅を大きく（モバイルでも明確に変化）
    return {
      width: 'clamp(50px, 15vw, 140px)',
      minWidth: '50px'
    }
  } else {
    // 3日表示時：「11:00」表記に対応した幅
    return {
      width: 'clamp(20px, 6vw, 60px)',
      minWidth: '20px'
    }
  }
})

// 時間テキストのスタイル（単日表示時に拡大）
const timeTextStyle = computed(() => {
  if (props.isSingleDayView) {
    // 単日表示時：CSS変数を使用
    return {
      fontSize: 'var(--calendar-time-text-lg)'
    }
  } else {
    // 3日表示時：CSS変数を使用
    return {
      fontSize: 'var(--calendar-time-text-sm)'
    }
  }
})

// ウィンドウリサイズ監視
const handleResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleResize)
  }
})

// Methods
const handleDateHeaderClick = (day) => {
  emit('date-header-click', day.date)
}

// Computed
const dayGroups = computed(() => {
  if (props.isSingleDayView && props.selectedSingleDate) {
    // 単日表示の場合：displayDaysは既に1日分のデータのみ
    return [props.displayDays]
  }

  // 通常の3日表示
  const groups = []
  for (let i = 0; i < props.displayDays.length; i += 3) {
    groups.push(props.displayDays.slice(i, i + 3))
  }
  return groups
})

// Methods
const getReservationsForDay = (date) => {
  // すべての予約を表示（キャンセルされた予約も含む）
  const dayReservations = props.reservations.filter(r =>
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
    reservationsAtTime
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(0, 3).forEach((reservation, index) => {
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
  return ((hours - 8) * timeHeight.value) + (minutes / 60 * timeHeight.value) - 4
}

const getCurrentTimePosition = () => {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  return ((hours - 8) * timeHeight.value) + (minutes / 60 * timeHeight.value)
}

const getTagColor = (tagId) => {
  const tag = props.tags.find(t => t.id === tagId)
  if (tag && tag.color) {
    return `tag-color-${tag.color}`
  }
  return 'tag-color-default'
}

const getReservationStyle = (reservation) => {
  const top = calculatePosition(reservation.startTime)
  const total = reservation.totalAtSameTime || 1
  const index = reservation.horizontalIndex || 0
  const width = total > 1 ? `calc((100% - 4px) / ${total})` : 'calc(100% - 4px)'
  const left = total > 1 ? `calc(2px + ((100% - 4px) / ${total}) * ${index})` : '2px'

  // 予約の所要時間に基づいて高さを計算（30分を1ブロックとして）
  const duration = reservation.duration || 30 // デフォルト30分
  const blocksCount = duration / 30 // 30分を1ブロックとして計算
  const height = blocksCount * (timeHeight.value / 2) - 4 // 4pxは上下のマージン分

  return {
    top: `${top}px`,
    left: left,
    width: width,
    height: `${Math.max(20, height)}px`, // 最小20pxを保証
    fontSize: 'inherit' // CSSで制御
  }
}

const handleTimeClick = (event, date) => {
  const rect = event.currentTarget.getBoundingClientRect()
  const y = event.clientY - rect.top
  const hour = Math.floor(y / timeHeight.value) + 8
  const minute = Math.round((y % timeHeight.value) / timeHeight.value * 2) * 30

  const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  emit('time-click', { date, startTime })
}
</script>

<style scoped>
/* タグカラークラス */
.tag-color-blue {
  background-color: #dbeafe;
  border: 1px solid #93c5fd;
  color: #212121;
}
.tag-color-green {
  background-color: #dcfce7;
  border: 1px solid #86efac;
  color: #212121;
}
.tag-color-yellow {
  background-color: #fefce8;
  border: 1px solid #fde047;
  color: #212121;
}
.tag-color-red {
  background-color: #fee2e2;
  border: 1px solid #fca5a5;
  color: #212121;
}
.tag-color-purple {
  background-color: #f3e8ff;
  border: 1px solid #c084fc;
  color: #212121;
}
.tag-color-pink {
  background-color: #fce7f3;
  border: 1px solid #f9a8d4;
  color: #212121;
}
.tag-color-orange {
  background-color: #fed7aa;
  border: 1px solid #fdba74;
  color: #212121;
}
.tag-color-gray,
.tag-color-default {
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  color: #212121;
}

/* カレンダーの基本レイアウト - レスポンシブ高さ */
.calendar-day-content {
  height: 650px; /* モバイル: 50px × 13時間 = 650px */
  position: relative;
}

@media (min-width: 768px) {
  .calendar-day-content {
    height: 975px; /* タブレット: 75px × 13時間 = 975px */
  }
}

@media (min-width: 1024px) {
  .calendar-day-content {
    height: 1300px; /* PC: 100px × 13時間 = 1300px */
  }
}

/* スクロールコンテナの調整 */
.calendar-scroll-container {
  height: calc(100vh - 120px);
  overflow-y: auto;
  overflow-x: auto;
  /* Firefox */
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 transparent;
}

@media (min-width: 768px) {
  .calendar-scroll-container {
    height: calc(100vh - 100px);
  }
}

/* Chrome, Safari */
.calendar-scroll-container::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.calendar-scroll-container::-webkit-scrollbar-track {
  background: transparent;
}

.calendar-scroll-container::-webkit-scrollbar-thumb {
  background-color: #cbd5e0;
  border-radius: 3px;
}

.calendar-scroll-container::-webkit-scrollbar-thumb:hover {
  background-color: #a0aec0;
}
</style>
