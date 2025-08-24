<template>
  <!-- タグ管理モーダル -->
  <div
    v-if="showTagModal"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    @click.self="$emit('close-tag-modal')"
  >
    <div class="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
      <div class="sticky top-0 bg-white border-b px-4 py-3">
        <h2 class="text-lg font-semibold">
          タグ管理
        </h2>
      </div>

      <div
        class="p-4"
        data-screen="tag-settings"
      >
        <!-- 既存タグ一覧 -->
        <div class="mb-4">
          <h3 class="text-sm font-medium text-gray-700 mb-2">
            現在のタグ
          </h3>
          <div class="max-h-60 overflow-y-auto">
            <ul class="tag-list">
              <li
                v-for="tag in tags"
                :key="tag.id"
                class="tag-item"
                :data-color="tag.color"
              >
                <span
                  class="swatch"
                  aria-hidden="true"
                />
                <span class="tag-name">{{ tag.label }}</span>
                <button
                  v-if="tag.id.startsWith('custom_')"
                  class="ml-auto p-1 hover:bg-black hover:bg-opacity-10 rounded"
                  @click="$emit('remove-tag', tag.id)"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </li>
            </ul>
          </div>
        </div>

        <!-- 新規タグ追加 -->
        <div class="p-3 bg-gray-50 rounded-lg">
          <h3 class="text-sm font-medium text-gray-700 mb-2">
            新しいタグを追加
          </h3>
          <input
            :value="newTagName"
            type="text"
            placeholder="タグ名を入力"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
            @input="$emit('update-new-tag-name', $event.target.value)"
          >
          <div class="grid grid-cols-4 gap-2 mb-2">
            <button
              v-for="color in tagColors"
              :key="color.name"
              type="button"
              :class="[
                'h-8 rounded',
                color.bgClass,
                newTagColor === color.name ? 'ring-2 ring-offset-2 ring-blue-500' : ''
              ]"
              @click="$emit('update-new-tag-color', color.name)"
            />
          </div>
          <button
            class="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            @click="$emit('add-tag')"
          >
            追加
          </button>
        </div>

        <button
          class="w-full mt-4 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          @click="$emit('close-tag-modal')"
        >
          閉じる
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const _props = defineProps({
  showTagModal: {
    type: Boolean,
    default: false
  },
  tags: {
    type: Array,
    default: () => []
  },
  newTagName: {
    type: String,
    default: ''
  },
  newTagColor: {
    type: String,
    default: 'blue'
  },
  tagColors: {
    type: Array,
    default: () => []
  }
})

const _emit = defineEmits([
  'close-tag-modal',
  'remove-tag',
  'add-tag',
  'update-new-tag-name',
  'update-new-tag-color'
])
</script>
