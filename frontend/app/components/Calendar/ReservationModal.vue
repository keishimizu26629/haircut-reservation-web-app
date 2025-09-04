<template>
  <!-- 予約モーダル -->
  <div
    v-if="showModal"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4"
    @click.self="$emit('close-modal')"
  >
    <div class="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] sm:max-h-[80vh] overflow-y-auto modal-content">
      <div
        :class="[
          'sticky top-0 border-b px-4 py-3 flex justify-between items-center',
          editingReservation ? 'bg-blue-50' : 'bg-green-50'
        ]"
      >
        <div class="flex items-center gap-2">
          <div
            :class="[
              'w-3 h-3 rounded-full',
              editingReservation ? 'bg-blue-500' : 'bg-green-500'
            ]"
          />
          <h2
            :class="[
              'text-lg font-semibold',
              editingReservation ? 'text-blue-700' : 'text-green-700'
            ]"
          >
            {{ editingReservation ? '📝 予約編集' : '➕ 新規予約' }}
          </h2>
        </div>
        <button
          class="p-2 hover:bg-gray-100 rounded-lg"
          @click="$emit('close-modal')"
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
        class="p-3 sm:p-4 space-y-3 sm:space-y-4 modal-body"
        @submit.prevent="$emit('save-reservation')"
      >
        <!-- 顧客名 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
            顧客名 <span class="text-red-500">*</span>
          </label>
          <input
            :value="reservationForm.customerName"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
            placeholder="例: 田中太郎"
            @input="$emit('update-form', { field: 'customerName', value: $event.target.value })"
          >
        </div>

        <!-- タグ選択 -->
        <div data-screen="reservation-form">
          <label class="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
            タグ
          </label>
          <div
            v-if="tags.length > 0"
            class="tag-selection"
          >
            <button
              v-for="tag in tags"
              :key="tag.id"
              type="button"
              :class="[
                'tag-option',
                reservationForm.tagId === tag.id ? 'selected' : ''
              ]"
              :data-color="tag.color"
              @click="$emit('update-form', { field: 'tagId', value: tag.id })"
            >
              <span
                class="swatch"
                aria-hidden="true"
              />
              <span class="tag-name">{{ tag.label }}</span>
            </button>
          </div>
          <div
            v-else
            class="text-sm text-gray-500 italic"
          >
            タグが設定されていません。「タグ管理」から追加してください。
          </div>
        </div>

        <!-- 日付・時間 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              日付
            </label>
            <input
              :value="reservationForm.date"
              type="date"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
              @input="$emit('update-form', { field: 'date', value: $event.target.value })"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              開始時間
            </label>
            <select
              :value="reservationForm.startTime"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
              @change="$emit('update-form', { field: 'startTime', value: $event.target.value })"
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

        <!-- メモ -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
            メモ
          </label>
          <textarea
            :value="reservationForm.memo"
            placeholder="施術内容やお客様の要望など..."
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-base sm:text-sm"
            @input="$emit('update-form', { field: 'memo', value: $event.target.value })"
          />
        </div>

        <!-- 状態選択（編集時のみ表示） -->
        <div v-if="editingReservation">
          <label class="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
            状態
          </label>
          <div class="grid grid-cols-3 gap-1 sm:gap-2">
            <button
              type="button"
              :class="[
                'px-3 py-2 text-sm rounded-lg transition-colors font-medium',
                reservationForm.status === 'active'
                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300'
              ]"
              @click="$emit('update-form', { field: 'status', value: 'active' })"
            >
              予約中
            </button>
            <button
              type="button"
              :class="[
                'px-3 py-2 text-sm rounded-lg transition-colors font-medium',
                reservationForm.status === 'completed'
                  ? 'bg-green-100 text-green-800 border-2 border-green-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300'
              ]"
              @click="$emit('update-form', { field: 'status', value: 'completed' })"
            >
              完了
            </button>
            <button
              type="button"
              :class="[
                'px-3 py-2 text-sm rounded-lg transition-colors font-medium',
                reservationForm.status === 'cancelled'
                  ? 'bg-red-100 text-red-800 border-2 border-red-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300'
              ]"
              @click="$emit('update-form', { field: 'status', value: 'cancelled' })"
            >
              キャンセル
            </button>
          </div>
        </div>

        <!-- ボタン -->
        <div class="flex gap-3 pt-4">
          <button
            v-if="editingReservation"
            type="button"
            class="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            @click="$emit('delete-reservation')"
          >
            削除
          </button>
          <button
            type="button"
            class="flex-1 px-4 py-3 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 font-medium"
            @click="$emit('close-modal')"
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
</template>

<script setup>
const _props = defineProps({
  showModal: {
    type: Boolean,
    default: false
  },
  editingReservation: {
    type: Object,
    default: null
  },
  reservationForm: {
    type: Object,
    required: true
  },
  tags: {
    type: Array,
    default: () => []
  },
  timeSlots: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const _emit = defineEmits([
  'close-modal',
  'save-reservation',
  'delete-reservation',
  'update-form'
])
</script>
