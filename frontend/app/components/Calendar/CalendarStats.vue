<template>
  <!-- 集計表示（レスポンシブ対応） -->
  <div
    v-if="showStats"
    class="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6"
  >
    <div class="bg-white rounded-lg shadow p-3 sm:p-6">
      <!-- ヘッダー部分 -->
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
        <!-- 左側：戻るボタンとタイトル -->
        <div class="flex items-center gap-2 sm:gap-4">
          <button
            class="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-gray-900 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
            @click="$emit('hide-stats')"
          >
            <svg
              class="w-3 h-3 sm:w-4 sm:h-4"
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
            <span class="hidden sm:inline">カレンダーに戻る</span>
            <span class="sm:hidden">戻る</span>
          </button>
          <h2 class="text-base sm:text-lg font-semibold text-gray-900">
            <span class="sm:hidden">{{ selectedMonthText }}</span>
            <span class="hidden sm:inline">{{ selectedMonthText }}の集計</span>
          </h2>
        </div>

        <!-- 右側：月選択 -->
        <div class="flex items-center justify-center gap-2">
          <button
            class="p-1.5 sm:p-1 hover:bg-gray-100 rounded touch-manipulation"
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
            class="p-1.5 sm:p-1 hover:bg-gray-100 rounded touch-manipulation"
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

      <!-- 統計グリッド -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div class="bg-gray-50 rounded-lg p-4 text-center sm:text-left">
          <div class="text-xs sm:text-sm text-gray-600 mb-1">
            総予約数
          </div>
          <div class="text-xl sm:text-2xl font-bold">
            {{ monthlyStats.total }}
          </div>
        </div>
        <div class="bg-green-50 rounded-lg p-4 text-center sm:text-left">
          <div class="text-xs sm:text-sm text-green-600 mb-1">
            完了
          </div>
          <div class="text-xl sm:text-2xl font-bold text-green-700">
            {{ monthlyStats.completed }}
          </div>
        </div>
        <div class="bg-blue-50 rounded-lg p-4 text-center sm:text-left">
          <div class="text-xs sm:text-sm text-blue-600 mb-1">
            予約中
          </div>
          <div class="text-xl sm:text-2xl font-bold text-blue-700">
            {{ monthlyStats.active }}
          </div>
        </div>
        <div class="bg-red-50 rounded-lg p-4 text-center sm:text-left">
          <div class="text-xs sm:text-sm text-red-600 mb-1">
            キャンセル
          </div>
          <div class="text-xl sm:text-2xl font-bold text-red-700">
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
