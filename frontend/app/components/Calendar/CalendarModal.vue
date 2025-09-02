<template>
  <!-- カレンダーモーダル -->
  <div
    v-if="showCalendarModal"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
    @click.self="$emit('close-calendar-modal')"
  >
    <div class="bg-white rounded-2xl w-full max-w-xs sm:max-w-sm modal-content">
      <div class="p-3 sm:p-4 border-b">
        <div class="flex justify-between items-center">
          <h2 class="text-base sm:text-lg font-semibold text-gray-900">
            日付を選択
          </h2>
          <button
            class="p-1 hover:bg-gray-100 rounded"
            @click="$emit('close-calendar-modal')"
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
      </div>

      <div class="p-3 sm:p-4">
        <!-- 月選択 -->
        <div class="flex justify-between items-center mb-4">
          <button
            class="p-1 hover:bg-gray-100 rounded"
            @click="$emit('previous-calendar-month')"
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
          <h3 class="text-base font-medium text-gray-900">
            {{ calendarMonthText }}
          </h3>
          <button
            class="p-1 hover:bg-gray-100 rounded"
            @click="$emit('next-calendar-month')"
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

        <!-- 曜日ヘッダー -->
        <div class="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
          <div
            v-for="day in ['日', '月', '火', '水', '木', '金', '土']"
            :key="day"
            class="text-center text-xs font-medium text-gray-500 py-0.5 sm:py-1"
          >
            {{ day }}
          </div>
        </div>

        <!-- 日付グリッド -->
        <div class="grid grid-cols-7 gap-0.5 sm:gap-1">
          <button
            v-for="date in calendarDates"
            :key="date.dateStr"
            :class="[
              'p-1 sm:p-2 text-xs sm:text-sm rounded hover:bg-gray-100 transition-colors min-h-[32px] sm:min-h-[36px]',
              date.isCurrentMonth ? 'text-gray-900' : 'text-gray-400',
              date.isToday ? 'bg-blue-100 text-blue-600 font-bold' : '',
              date.isSelected ? 'bg-blue-500 text-white hover:bg-blue-600' : ''
            ]"
            @click="$emit('select-date', date.date)"
          >
            {{ date.day }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const _props = defineProps({
  showCalendarModal: {
    type: Boolean,
    default: false
  },
  calendarMonthText: {
    type: String,
    required: true
  },
  calendarDates: {
    type: Array,
    default: () => []
  }
})

const _emit = defineEmits([
  'close-calendar-modal',
  'previous-calendar-month',
  'next-calendar-month',
  'select-date'
])
</script>
