<template>
  <header class="bg-white shadow-sm border-b sticky top-0 z-40">
    <div class="px-2 sm:px-4 py-2 sm:py-3">
      <!-- ナビゲーション -->
      <div
        v-show="!showStats"
        class="flex flex-row items-center gap-2 sm:gap-0"
      >
        <!-- 左側エリア：日送りボタンと月表示 -->
        <div class="flex items-center gap-2 sm:gap-3 flex-1 sm:justify-center justify-start order-1 sm:order-1">
          <button
            class="p-2 hover:bg-gray-100 rounded-lg"
            @click="$emit('previous-days')"
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

          <h1 class="text-sm sm:text-base font-semibold text-gray-900 px-1 sm:px-2">
            {{ currentMonthText }}
          </h1>

          <button
            class="p-2 hover:bg-gray-100 rounded-lg"
            @click="$emit('next-days')"
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

        <!-- 右側エリア：カレンダーボタン、今日に戻るボタン、メニュー -->
        <div class="flex justify-end gap-1 sm:gap-2 order-2 sm:order-2">
          <button
            class="px-2 sm:px-3 py-1 text-xs border border-gray-800 rounded-full hover:bg-gray-100 transition-colors flex items-center gap-1"
            @click="$emit('show-calendar-modal')"
          >
            <svg
              class="w-3 h-3 sm:hidden"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span class="hidden sm:inline">カレンダー</span>
          </button>
          <button
            class="px-2 sm:px-3 py-1 text-xs border border-gray-800 rounded-full hover:bg-gray-100 transition-colors flex items-center gap-1"
            @click="$emit('go-to-today')"
          >
            <svg
              class="w-3 h-3 sm:hidden"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span class="hidden sm:inline">今日に戻る</span>
            <span class="sm:hidden">今日</span>
          </button>

          <!-- ドロップダウンメニュー -->
          <div class="relative">
            <button
              class="p-1.5 border border-gray-800 rounded-full hover:bg-gray-100 transition-colors"
              @click="toggleMenuDropdown"
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
              class="absolute right-0 mt-1 w-40 sm:w-48 bg-white rounded-lg shadow-lg border z-60"
              @click="closeMenuDropdown"
            >
              <button
                class="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                @click="$emit('open-tag-modal')"
              >
                <svg
                  class="w-4 h-4 mr-2 text-green-500"
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
              <button
                class="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                @click="$emit('show-stats')"
              >
                <svg
                  class="w-4 h-4 mr-2 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                集計
              </button>
              <button
                class="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                @click="$emit('logout')"
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
      </div>
    </div>
  </header>
</template>

<script setup>
const _props = defineProps({
  currentMonthText: {
    type: String,
    required: true
  },
  showStats: {
    type: Boolean,
    default: false
  }
})

const _emit = defineEmits([
  'previous-days',
  'next-days',
  'go-to-today',
  'show-calendar-modal',
  'open-tag-modal',
  'show-stats',
  'logout'
])

const showMenuDropdown = ref(false)

const toggleMenuDropdown = () => {
  showMenuDropdown.value = !showMenuDropdown.value
}

const closeMenuDropdown = () => {
  showMenuDropdown.value = false
}

// ドロップダウンメニューの外側クリックを監視
const handleClickOutside = (event) => {
  if (!event.target.closest('.relative')) {
    showMenuDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
