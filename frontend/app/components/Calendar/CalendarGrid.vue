<template>
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
                @click="$emit('edit-reservation', reservation)"
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
  }
})

const emit = defineEmits([
  'edit-reservation',
  'time-click'
])

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

  const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  emit('time-click', { date, startTime })
}
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
