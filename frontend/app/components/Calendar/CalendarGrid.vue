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
              :style="{ minWidth: 'clamp(120px, 25vw, 300px)' }"
              @click="$emit('date-header-click', day.date)"
            >
              <div
                :class="[
                  'flex flex-col items-center justify-center',
                  day.isToday ? 'text-blue-600' : 'text-gray-900'
                ]"
              >
                <span class="text-xs text-gray-500">{{ day.dayName }}</span>
                <span
                  :class="[
                    'font-bold',
                    day.isToday ? 'text-blue-600' : 'text-gray-900'
                  ]"
                  :style="{ fontSize: 'clamp(14px, 2.5vw, 18px)' }"
                >
                  {{ day.dateNumber }}
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
                :style="{ width: 'clamp(25px, 4vw, 50px)', minWidth: '25px' }"
              >
                <!-- 時間表示エリア -->
                <div class="relative calendar-day-content">
                  <!-- 時間表示 -->
                  <div
                    v-for="hour in displayHours"
                    :key="`${day.date}-hour-${hour}`"
                    class="absolute left-0 right-0"
                    :style="{ top: `${(hour - 8) * 50}px` }"
                  >
                    <span
                      class="absolute -top-2 left-1 text-gray-500"
                      style="font-size: clamp(9px, 1.2vw, 12px);"
                    >
                      {{ hour }}<span class="hidden sm:inline">:00</span>
                    </span>
                  </div>
                  <!-- 30分マーカー -->
                  <template v-for="(hour, index) in displayHours">
                    <div
                      v-if="index < displayHours.length - 1"
                      :key="`${day.date}-half-${hour}`"
                      class="absolute left-0 right-0 flex justify-center"
                      :style="{ top: `${(hour - 8) * 50 + 25}px` }"
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
                :style="{ minWidth: 'clamp(80px, 20vw, 220px)' }"
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
                      :style="{ fontSize: 'clamp(10px, 1.2vw, 14px)' }"
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

// Computed
const dayGroups = computed(() => {
  if (props.isSingleDayView && props.selectedSingleDate) {
    // 単日表示の場合は選択された1日のみ
    const selectedDay = props.displayDays.find(day => day.date === props.selectedSingleDate)
    return selectedDay ? [[selectedDay]] : []
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
  return ((hours - 8) * 50) + (minutes / 60 * 50) - 4
}

const getCurrentTimePosition = () => {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  return ((hours - 8) * 50) + (minutes / 60 * 50)
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

  return {
    top: `${top}px`,
    left: left,
    width: width,
    height: 'clamp(20px, 3vh, 35px)',
    fontSize: 'inherit' // CSSで制御
  }
}

const handleTimeClick = (event, date) => {
  const rect = event.currentTarget.getBoundingClientRect()
  const y = event.clientY - rect.top
  const hour = Math.floor(y / 50) + 8
  const minute = Math.round((y % 50) / 50 * 2) * 30

  const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  emit('time-click', { date, startTime })
}
</script>

<style scoped>
/* タグカラークラス */
.tag-color-blue {
  background-color: #dbeafe;
  border: 1px solid #93c5fd;
  color: #1e3a8a;
}
.tag-color-green {
  background-color: #dcfce7;
  border: 1px solid #86efac;
  color: #14532d;
}
.tag-color-yellow {
  background-color: #fefce8;
  border: 1px solid #fde047;
  color: #854d0e;
}
.tag-color-red {
  background-color: #fee2e2;
  border: 1px solid #fca5a5;
  color: #7f1d1d;
}
.tag-color-purple {
  background-color: #f3e8ff;
  border: 1px solid #c084fc;
  color: #581c87;
}
.tag-color-pink {
  background-color: #fce7f3;
  border: 1px solid #f9a8d4;
  color: #831843;
}
.tag-color-orange {
  background-color: #fed7aa;
  border: 1px solid #fdba74;
  color: #9a3412;
}
.tag-color-gray,
.tag-color-default {
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  color: #374151;
}

/* カレンダーの基本レイアウト */
.calendar-day-content {
  height: 650px;
  position: relative;
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
