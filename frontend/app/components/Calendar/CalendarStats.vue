<template>
  <!-- 集計表示（デスクトップのみ） -->
  <div
    v-if="showStats"
    class="hidden md:block max-w-7xl mx-auto px-4 py-6"
  >
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex justify-between items-center mb-4">
        <div class="flex items-center gap-4">
          <button
            class="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
            @click="$emit('hide-stats')"
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
            カレンダーに戻る
          </button>
          <h2 class="text-lg font-semibold">
            {{ selectedMonthText }}の集計
          </h2>
        </div>
        <!-- 月選択 -->
        <div class="flex items-center gap-2">
          <button
            class="p-1 hover:bg-gray-100 rounded"
            @click="$emit('previous-month')"
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
            @click="$emit('next-month')"
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
</template>

<script setup>
const _props = defineProps({
  showStats: {
    type: Boolean,
    default: false
  },
  selectedMonthText: {
    type: String,
    required: true
  },
  monthlyStats: {
    type: Object,
    required: true,
    default: () => ({
      total: 0,
      completed: 0,
      active: 0,
      cancelled: 0
    })
  }
})

const _emit = defineEmits([
  'hide-stats',
  'previous-month',
  'next-month'
])
</script>
