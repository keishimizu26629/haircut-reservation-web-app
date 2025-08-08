<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">
          {{ isEdit ? '予約編集' : '新規予約' }}
        </h3>
        <button @click="closeModal" class="close-btn">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-body">
        <!-- 日時表示 -->
        <div class="datetime-display">
          <div class="datetime-info">
            <i class="bi bi-calendar"></i>
            <span>{{ formatDate(date) }} {{ timeSlot }}</span>
          </div>
        </div>

        <!-- 予約内容入力 -->
        <div class="form-group">
          <label for="content" class="form-label">予約内容</label>
          <textarea
            id="content"
            v-model="form.content"
            class="form-textarea"
            placeholder="例：田中様 カット"
            rows="3"
            required
          ></textarea>
        </div>

        <!-- カテゴリ選択 -->
        <div class="form-group">
          <label class="form-label">メニューカテゴリ</label>
          <div class="category-options">
            <label class="category-option" :class="getCategoryClass('cut')">
              <input type="radio" v-model="form.category" value="cut">
              <span class="category-label">カット</span>
            </label>
            <label class="category-option" :class="getCategoryClass('color')">
              <input type="radio" v-model="form.category" value="color">
              <span class="category-label">カラー</span>
            </label>
            <label class="category-option" :class="getCategoryClass('perm')">
              <input type="radio" v-model="form.category" value="perm">
              <span class="category-label">パーマ</span>
            </label>
            <label class="category-option" :class="getCategoryClass('straight')">
              <input type="radio" v-model="form.category" value="straight">
              <span class="category-label">縮毛矯正</span>
            </label>
            <label class="category-option" :class="getCategoryClass('other')">
              <input type="radio" v-model="form.category" value="other">
              <span class="category-label">その他</span>
            </label>
          </div>
        </div>

        <!-- ボタン -->
        <div class="modal-actions">
          <div class="action-buttons">
            <button
              v-if="isEdit"
              type="button"
              @click="handleDelete"
              class="btn-delete"
              :disabled="loading"
            >
              <i class="bi bi-trash"></i>
              削除
            </button>
            <div class="primary-actions">
              <button
                type="button"
                @click="closeModal"
                class="btn-cancel"
                :disabled="loading"
              >
                キャンセル
              </button>
              <button
                type="submit"
                class="btn-save"
                :disabled="loading || !isFormValid"
              >
                <i class="bi bi-check2" v-if="!loading"></i>
                <i class="bi bi-hourglass-split spin" v-if="loading"></i>
                {{ loading ? '保存中...' : '保存' }}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/ja'

dayjs.locale('ja')

const props = defineProps({
  date: {
    type: String,
    required: true
  },
  timeSlot: {
    type: String,
    required: true
  },
  reservation: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'save', 'delete'])

const loading = ref(false)

// フォームデータ
const form = ref({
  content: '',
  category: 'cut'
})

// 編集モード判定
const isEdit = computed(() => !!props.reservation)

// フォームバリデーション
const isFormValid = computed(() => {
  return form.value.content.trim() !== '' && form.value.category !== ''
})

// カテゴリクラス取得
const getCategoryClass = (category) => {
  const baseClass = 'category-option'
  const selectedClass = form.value.category === category ? 'selected' : ''
  const categoryClasses = {
    cut: 'category-cut',
    color: 'category-color',
    perm: 'category-perm',
    straight: 'category-straight',
    other: 'category-other'
  }
  return `${baseClass} ${categoryClasses[category]} ${selectedClass}`
}

// 日付フォーマット
const formatDate = (dateString) => {
  return dayjs(dateString).format('M月D日（ddd）')
}

// フォーム送信
const handleSubmit = async () => {
  if (!isFormValid.value || loading.value) return

  loading.value = true

  try {
    const reservationData = {
      date: props.date,
      timeSlot: props.timeSlot,
      content: form.value.content.trim(),
      category: form.value.category,
      status: 'active'
    }

    emit('save', reservationData)
  } catch (error) {
    console.error('保存エラー:', error)
  } finally {
    loading.value = false
  }
}

// 削除処理
const handleDelete = async () => {
  if (!confirm('この予約を削除しますか？')) return

  loading.value = true

  try {
    emit('delete', props.reservation.id)
  } catch (error) {
    console.error('削除エラー:', error)
  } finally {
    loading.value = false
  }
}

// モーダルを閉じる
const closeModal = () => {
  if (loading.value) return
  emit('close')
}

// 初期データ設定
onMounted(() => {
  if (props.reservation) {
    form.value = {
      content: props.reservation.content || '',
      category: props.reservation.category || 'cut'
    }
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.modal-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  max-width: 600px;
  width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
}

.modal-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #6c757d;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #e9ecef;
  color: #333;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.form-section {
  margin-bottom: 2rem;
}

.form-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 0.5rem;
}

.datetime-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.form-control.is-invalid {
  border-color: #dc3545;
}

.form-control.is-invalid:focus {
  border-color: #dc3545;
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
}

.invalid-feedback {
  display: block;
  width: 100%;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #dc3545;
}

.form-text {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #6c757d;
}

.category-selection {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.category-item:hover {
  border-color: #007bff;
  background: #f8f9fa;
}

.category-item.selected {
  border-color: #007bff;
  background: #e3f2fd;
}

.category-icon {
  font-size: 1.5rem;
  color: #007bff;
  min-width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.category-info {
  flex: 1;
}

.category-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.category-description {
  font-size: 0.9rem;
  color: #6c757d;
}

.status-selection {
  display: grid;
  gap: 0.75rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.status-item:hover {
  border-color: #007bff;
  background: #f8f9fa;
}

.status-item.selected,
.status-item:has(input:checked) {
  border-color: #007bff;
  background: #e3f2fd;
}

.status-item input {
  margin: 0;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.status-icon {
  font-size: 1.2rem;
  min-width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-pending { color: #ffc107; }
.status-confirmed { color: #007bff; }
.status-completed { color: #28a745; }
.status-cancelled { color: #dc3545; }

.status-details {
  flex: 1;
}

.status-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.status-description {
  font-size: 0.9rem;
  color: #6c757d;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
}

.button-group {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
  border-color: #0056b3;
}

.btn-primary:disabled {
  background: #6c757d;
  border-color: #6c757d;
  cursor: not-allowed;
}

.btn-outline-secondary {
  color: #6c757d;
  border-color: #6c757d;
}

.btn-outline-secondary:hover {
  background: #6c757d;
  color: white;
}

.btn-outline-danger {
  color: #dc3545;
  border-color: #dc3545;
}

.btn-outline-danger:hover {
  background: #dc3545;
  color: white;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .modal-container {
    width: 95vw;
    max-height: 95vh;
  }

  .datetime-grid {
    grid-template-columns: 1fr;
  }

  .category-selection {
    grid-template-columns: 1fr;
  }

  .button-group {
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
