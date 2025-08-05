<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">
          {{ isEditing ? '予約編集' : '新規予約' }}
        </h3>
        <button 
          class="btn-close" 
          @click="closeModal"
          aria-label="閉じる"
        >
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <div class="modal-body">
        <form @submit.prevent="handleSubmit">
          <!-- 日付・時間選択 -->
          <div class="form-section">
            <h4>日時</h4>
            <div class="datetime-grid">
              <div class="form-group">
                <label for="date">日付 *</label>
                <input
                  id="date"
                  v-model="formData.date"
                  type="date"
                  class="form-control"
                  :class="{ 'is-invalid': errors.date }"
                  required
                />
                <div v-if="errors.date" class="invalid-feedback">
                  {{ errors.date }}
                </div>
              </div>
              <div class="form-group">
                <label for="time">時間 *</label>
                <input
                  id="time"
                  v-model="formData.time"
                  type="time"
                  class="form-control"
                  :class="{ 'is-invalid': errors.time }"
                  required
                />
                <div v-if="errors.time" class="invalid-feedback">
                  {{ errors.time }}
                </div>
              </div>
            </div>
          </div>

          <!-- 顧客情報 -->
          <div class="form-section">
            <h4>顧客情報</h4>
            <div class="form-group">
              <label for="customerName">お名前 *</label>
              <input
                id="customerName"
                v-model="formData.customerName"
                type="text"
                class="form-control"
                :class="{ 'is-invalid': errors.customerName }"
                placeholder="お客様のお名前"
                required
              />
              <div v-if="errors.customerName" class="invalid-feedback">
                {{ errors.customerName }}
              </div>
            </div>
            
            <div class="form-group">
              <label for="customerPhone">電話番号</label>
              <input
                id="customerPhone"
                v-model="formData.customerPhone"
                type="tel"
                class="form-control"
                :class="{ 'is-invalid': errors.customerPhone }"
                placeholder="090-1234-5678"
              />
              <div v-if="errors.customerPhone" class="invalid-feedback">
                {{ errors.customerPhone }}
              </div>
            </div>
          </div>

          <!-- カテゴリー選択 -->
          <div class="form-section">
            <h4>カテゴリー</h4>
            <div class="category-selection">
              <div 
                v-for="category in availableCategories"
                :key="category.value"
                class="category-item"
                :class="{ selected: formData.category === category.value }"
                @click="selectCategory(category.value)"
              >
                <div class="category-icon">
                  <i :class="category.icon"></i>
                </div>
                <div class="category-info">
                  <div class="category-name">{{ category.label }}</div>
                  <div class="category-description">{{ category.description }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 自由テキスト入力 -->
          <div class="form-section">
            <h4>詳細・メモ</h4>
            <div class="form-group">
              <label for="details">予約内容</label>
              <textarea
                id="details"
                v-model="formData.details"
                class="form-control"
                :class="{ 'is-invalid': errors.details }"
                rows="4"
                placeholder="具体的な施術内容、ご要望、注意事項などを自由にご記入ください"
              ></textarea>
              <div v-if="errors.details" class="invalid-feedback">
                {{ errors.details }}
              </div>
              <div class="form-text">
                例：カット＋カラー、前回と同じスタイル、アレルギーあり など
              </div>
            </div>
          </div>

          <!-- ステータス選択（編集時のみ） -->
          <div v-if="isEditing" class="form-section">
            <h4>ステータス</h4>
            <div class="status-selection">
              <label 
                v-for="status in availableStatuses"
                :key="status.value"
                class="status-item"
                :class="{ selected: formData.status === status.value }"
              >
                <input
                  v-model="formData.status"
                  type="radio"
                  :value="status.value"
                  name="status"
                />
                <div class="status-info">
                  <div class="status-icon" :class="`status-${status.value}`">
                    <i :class="status.icon"></i>
                  </div>
                  <div class="status-details">
                    <div class="status-name">{{ status.label }}</div>
                    <div class="status-description">{{ status.description }}</div>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </form>
      </div>

      <div class="modal-footer">
        <div class="button-group">
          <button 
            type="button" 
            class="btn btn-outline-secondary"
            @click="closeModal"
          >
            キャンセル
          </button>
          
          <button 
            v-if="isEditing"
            type="button" 
            class="btn btn-outline-danger"
            @click="handleDelete"
          >
            <i class="bi bi-trash"></i>
            削除
          </button>
          
          <button 
            type="button"
            class="btn btn-primary"
            @click="handleSubmit"
            :disabled="!isFormValid"
          >
            <i class="bi" :class="isEditing ? 'bi-check-lg' : 'bi-plus-lg'"></i>
            {{ isEditing ? '更新' : '予約作成' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'

// 型定義
interface ReservationData {
  id?: string
  date: string
  time: string
  customerName: string
  customerPhone: string
  category: string
  details: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  createdAt?: Date
  updatedAt?: Date
}

interface Category {
  value: string
  label: string
  description: string
  icon: string
}

interface Status {
  value: string
  label: string
  description: string
  icon: string
}

interface ValidationErrors {
  date?: string
  time?: string
  customerName?: string
  customerPhone?: string
  details?: string
}

// Props
const props = defineProps<{
  show: boolean
  selectedDate?: Date
  reservation?: ReservationData | null
}>()

// Emit
const emit = defineEmits<{
  close: []
  save: [reservation: ReservationData]
  delete: [reservationId: string]
}>()

// リアクティブ状態
const formData = ref({
  date: '',
  time: '',
  customerName: '',
  customerPhone: '',
  category: '',
  details: '',
  status: 'pending' as const
})

const errors = ref<ValidationErrors>({})

// カテゴリー定義
const availableCategories = ref<Category[]>([
  {
    value: 'cut',
    label: 'カット',
    description: 'ヘアカット・スタイリング',
    icon: 'bi bi-scissors'
  },
  {
    value: 'color',
    label: 'カラー',
    description: 'ヘアカラー・ブリーチ',
    icon: 'bi bi-palette'
  },
  {
    value: 'perm',
    label: 'パーマ',
    description: 'パーマ・縮毛矯正',
    icon: 'bi bi-hurricane'
  },
  {
    value: 'treatment',
    label: 'トリートメント',
    description: 'ヘアケア・頭皮ケア',
    icon: 'bi bi-droplet'
  },
  {
    value: 'set',
    label: 'セット',
    description: 'ヘアセット・着付け',
    icon: 'bi bi-brush'
  },
  {
    value: 'other',
    label: 'その他',
    description: 'その他のサービス',
    icon: 'bi bi-three-dots'
  }
])

// ステータス定義
const availableStatuses = ref<Status[]>([
  {
    value: 'pending',
    label: '予約済み',
    description: '予約受付済み、来店待ち',
    icon: 'bi bi-clock'
  },
  {
    value: 'confirmed',
    label: '確認済み',
    description: '予約確認完了',
    icon: 'bi bi-check-circle'
  },
  {
    value: 'completed',
    label: '来店完了',
    description: '施術完了',
    icon: 'bi bi-check-circle-fill'
  },
  {
    value: 'cancelled',
    label: 'キャンセル',
    description: 'キャンセル済み',
    icon: 'bi bi-x-circle'
  }
])

// 計算プロパティ
const isEditing = computed(() => !!props.reservation)

const isFormValid = computed(() => {
  return !!(
    formData.value.date &&
    formData.value.time &&
    formData.value.customerName.trim() &&
    formData.value.category
  ) && Object.keys(errors.value).length === 0
})

// バリデーション
const validateForm = (): boolean => {
  const newErrors: ValidationErrors = {}

  // 日付バリデーション
  if (!formData.value.date) {
    newErrors.date = '日付を選択してください'
  } else {
    const selectedDate = new Date(formData.value.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (selectedDate < today) {
      newErrors.date = '過去の日付は選択できません'
    }
  }

  // 時間バリデーション
  if (!formData.value.time) {
    newErrors.time = '時間を入力してください'
  }

  // 顧客名バリデーション
  if (!formData.value.customerName.trim()) {
    newErrors.customerName = 'お名前を入力してください'
  } else if (formData.value.customerName.trim().length < 2) {
    newErrors.customerName = 'お名前は2文字以上で入力してください'
  }

  // 電話番号バリデーション（任意入力の場合）
  if (formData.value.customerPhone && !isValidPhoneNumber(formData.value.customerPhone)) {
    newErrors.customerPhone = '正しい電話番号を入力してください'
  }

  // 詳細の文字数制限
  if (formData.value.details && formData.value.details.length > 500) {
    newErrors.details = '詳細は500文字以内で入力してください'
  }

  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[0-9-+\s()]{10,15}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

// メソッド
const selectCategory = (categoryValue: string) => {
  formData.value.category = categoryValue
  validateForm()
}

const handleSubmit = () => {
  if (!validateForm()) return

  const reservationData: ReservationData = {
    id: props.reservation?.id,
    date: formData.value.date,
    time: formData.value.time,
    customerName: formData.value.customerName.trim(),
    customerPhone: formData.value.customerPhone.trim(),
    category: formData.value.category,
    details: formData.value.details.trim(),
    status: formData.value.status,
    updatedAt: new Date()
  }

  if (!isEditing.value) {
    reservationData.createdAt = new Date()
  }

  emit('save', reservationData)
}

const handleDelete = () => {
  if (props.reservation?.id) {
    if (confirm('この予約を削除しますか？\n削除した予約は元に戻せません。')) {
      emit('delete', props.reservation.id)
    }
  }
}

const closeModal = () => {
  emit('close')
  // フォームリセット
  errors.value = {}
}

const initializeForm = () => {
  if (props.reservation) {
    // 編集モード：既存データを設定
    formData.value = {
      date: props.reservation.date,
      time: props.reservation.time,
      customerName: props.reservation.customerName,
      customerPhone: props.reservation.customerPhone,
      category: props.reservation.category,
      details: props.reservation.details,
      status: props.reservation.status
    }
  } else {
    // 新規作成モード：初期値を設定
    const today = props.selectedDate || new Date()
    const defaultTime = new Date()
    defaultTime.setHours(10, 0, 0, 0)
    
    formData.value = {
      date: today.toISOString().split('T')[0],
      time: '10:00',
      customerName: '',
      customerPhone: '',
      category: '',
      details: '',
      status: 'pending'
    }
  }
  errors.value = {}
}

// ウォッチャー
watch(() => props.show, (newValue) => {
  if (newValue) {
    initializeForm()
  }
})

// リアルタイムバリデーション
watch(formData, () => {
  if (Object.keys(errors.value).length > 0) {
    validateForm()
  }
}, { deep: true })

// 初期化
onMounted(() => {
  if (props.show) {
    initializeForm()
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