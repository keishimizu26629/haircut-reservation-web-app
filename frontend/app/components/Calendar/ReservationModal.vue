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
                <label for="date">日付</label>
                <input
                  id="date"
                  v-model="formData.date"
                  type="date"
                  class="form-control"
                  required
                />
              </div>
              <div class="form-group">
                <label for="time">開始時間</label>
                <select
                  id="time"
                  v-model="formData.startTime"
                  class="form-control"
                  required
                  @change="calculateEndTime"
                >
                  <option value="">時間を選択</option>
                  <option 
                    v-for="timeSlot in availableTimeSlots"
                    :key="timeSlot.value"
                    :value="timeSlot.value"
                    :disabled="!timeSlot.available"
                  >
                    {{ timeSlot.label }}
                  </option>
                </select>
              </div>
            </div>
            
            <div class="time-info" v-if="formData.startTime && formData.endTime">
              <i class="bi bi-clock"></i>
              <span>{{ formData.startTime }} - {{ formData.endTime }}</span>
              <span class="duration">({{ totalDuration }}分)</span>
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
                placeholder="お客様のお名前"
                required
              />
            </div>
            
            <div class="form-group">
              <label for="customerPhone">電話番号</label>
              <input
                id="customerPhone"
                v-model="formData.customerPhone"
                type="tel"
                class="form-control"
                placeholder="090-1234-5678"
              />
            </div>
            
            <div class="form-group">
              <label for="customerEmail">メールアドレス</label>
              <input
                id="customerEmail"
                v-model="formData.customerEmail"
                type="email"
                class="form-control"
                placeholder="example@email.com"
              />
            </div>
          </div>

          <!-- サービス選択 -->
          <div class="form-section">
            <h4>サービス</h4>
            <div class="service-selection">
              <div 
                v-for="service in availableServices"
                :key="service.id"
                class="service-item"
                :class="{ selected: selectedServices.includes(service.id) }"
                @click="toggleService(service.id)"
              >
                <div class="service-checkbox">
                  <i 
                    class="bi"
                    :class="selectedServices.includes(service.id) ? 'bi-check-square-fill' : 'bi-square'"
                  ></i>
                </div>
                <div class="service-details">
                  <div class="service-name">{{ service.name }}</div>
                  <div class="service-meta">
                    <span class="service-price">¥{{ service.price.toLocaleString() }}</span>
                    <span class="service-duration">{{ service.duration }}分</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- スタイリスト選択 -->
          <div class="form-section">
            <h4>スタイリスト</h4>
            <div class="stylist-selection">
              <label 
                v-for="stylist in availableStylists"
                :key="stylist.id"
                class="stylist-item"
              >
                <input
                  v-model="formData.stylistId"
                  type="radio"
                  :value="stylist.id"
                  name="stylist"
                />
                <div class="stylist-info">
                  <div class="stylist-avatar">
                    <img 
                      v-if="stylist.avatar"
                      :src="stylist.avatar"
                      :alt="stylist.name"
                    />
                    <div v-else class="avatar-placeholder">
                      {{ stylist.name.charAt(0) }}
                    </div>
                  </div>
                  <div class="stylist-details">
                    <div class="stylist-name">{{ stylist.name }}</div>
                    <div class="stylist-specialties">
                      {{ stylist.specialties.join(', ') }}
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <!-- メモ -->
          <div class="form-section">
            <h4>メモ・要望</h4>
            <div class="form-group">
              <textarea
                v-model="formData.notes"
                class="form-control"
                rows="3"
                placeholder="ご要望やアレルギー等ございましたらご記入ください"
              ></textarea>
            </div>
          </div>

          <!-- 料金表示 -->
          <div class="price-summary">
            <div class="price-row">
              <span>合計料金</span>
              <span class="total-price">¥{{ totalPrice.toLocaleString() }}</span>
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
            削除
          </button>
          
          <button 
            type="button"
            class="btn btn-primary"
            @click="handleSubmit"
            :disabled="!isFormValid"
          >
            {{ isEditing ? '更新' : '予約作成' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useTenant } from '~/composables/useTenant'

// 型定義
interface Service {
  id: string
  name: string
  price: number
  duration: number
  description?: string
}

interface Stylist {
  id: string
  name: string
  specialties: string[]
  avatar?: string
}

interface ReservationData {
  id?: string
  date: string
  startTime: string
  endTime: string
  customerName: string
  customerPhone: string
  customerEmail: string
  serviceIds: string[]
  stylistId: string
  notes: string
  status: 'pending' | 'confirmed' | 'cancelled'
  totalPrice: number
  totalDuration: number
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
  startTime: '',
  endTime: '',
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  stylistId: '',
  notes: ''
})

const selectedServices = ref<string[]>([])
const { getCurrentTenant } = useTenant()

// サンプルデータ（実際のアプリではAPIから取得）
const availableServices = ref<Service[]>([
  {
    id: 'cut',
    name: 'カット',
    price: 4000,
    duration: 60,
    description: '丁寧なカウンセリングでお客様に最適なスタイルをご提案'
  },
  {
    id: 'color',
    name: 'カラー',
    price: 7000,
    duration: 120,
    description: '豊富なカラーバリエーションで理想の髪色に'
  },
  {
    id: 'perm',
    name: 'パーマ',
    price: 8500,
    duration: 180,
    description: 'デジタルパーマで長持ちするスタイリング'
  },
  {
    id: 'treatment',
    name: 'トリートメント',
    price: 3000,
    duration: 30,
    description: '髪に栄養を与えてツヤ・ハリを向上'
  }
])

const availableStylists = ref<Stylist[]>([
  {
    id: 'stylist1',
    name: '田中 美咲',
    specialties: ['カット', 'カラー'],
    avatar: '/images/stylists/tanaka.jpg'
  },
  {
    id: 'stylist2',
    name: '佐藤 健太',
    specialties: ['カット', 'パーマ'],
    avatar: '/images/stylists/sato.jpg'
  },
  {
    id: 'stylist3',
    name: '鈴木 あやか',
    specialties: ['カラー', 'トリートメント'],
    avatar: '/images/stylists/suzuki.jpg'
  }
])

// 計算プロパティ
const isEditing = computed(() => !!props.reservation)

const availableTimeSlots = computed(() => {
  const slots = []
  for (let hour = 9; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      slots.push({
        value: timeString,
        label: timeString,
        available: true // 実際のアプリでは予約状況をチェック
      })
    }
  }
  return slots
})

const totalDuration = computed(() => {
  return selectedServices.value.reduce((total, serviceId) => {
    const service = availableServices.value.find(s => s.id === serviceId)
    return total + (service?.duration || 0)
  }, 0)
})

const totalPrice = computed(() => {
  return selectedServices.value.reduce((total, serviceId) => {
    const service = availableServices.value.find(s => s.id === serviceId)
    return total + (service?.price || 0)
  }, 0)
})

const isFormValid = computed(() => {
  return !!(
    formData.value.date &&
    formData.value.startTime &&
    formData.value.customerName &&
    selectedServices.value.length > 0 &&
    formData.value.stylistId
  )
})

// メソッド
const toggleService = (serviceId: string) => {
  const index = selectedServices.value.indexOf(serviceId)
  if (index > -1) {
    selectedServices.value.splice(index, 1)
  } else {
    selectedServices.value.push(serviceId)
  }
  calculateEndTime()
}

const calculateEndTime = () => {
  if (!formData.value.startTime || totalDuration.value === 0) {
    formData.value.endTime = ''
    return
  }

  const [hours, minutes] = formData.value.startTime.split(':').map(Number)
  const startDate = new Date()
  startDate.setHours(hours, minutes, 0, 0)
  
  const endDate = new Date(startDate.getTime() + totalDuration.value * 60000)
  formData.value.endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`
}

const handleSubmit = () => {
  if (!isFormValid.value) return

  const reservationData: ReservationData = {
    id: props.reservation?.id,
    date: formData.value.date,
    startTime: formData.value.startTime,
    endTime: formData.value.endTime,
    customerName: formData.value.customerName,
    customerPhone: formData.value.customerPhone,
    customerEmail: formData.value.customerEmail,
    serviceIds: selectedServices.value,
    stylistId: formData.value.stylistId,
    notes: formData.value.notes,
    status: 'pending',
    totalPrice: totalPrice.value,
    totalDuration: totalDuration.value
  }

  emit('save', reservationData)
}

const handleDelete = () => {
  if (props.reservation?.id) {
    if (confirm('この予約を削除しますか？')) {
      emit('delete', props.reservation.id)
    }
  }
}

const closeModal = () => {
  emit('close')
}

const initializeForm = () => {
  if (props.reservation) {
    // 編集モード：既存データを設定
    formData.value = {
      date: props.reservation.date,
      startTime: props.reservation.startTime,
      endTime: props.reservation.endTime,
      customerName: props.reservation.customerName,
      customerPhone: props.reservation.customerPhone,
      customerEmail: props.reservation.customerEmail,
      stylistId: props.reservation.stylistId,
      notes: props.reservation.notes
    }
    selectedServices.value = [...props.reservation.serviceIds]
  } else {
    // 新規作成モード：初期値を設定
    const today = props.selectedDate || new Date()
    formData.value = {
      date: today.toISOString().split('T')[0],
      startTime: '10:00',
      endTime: '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      stylistId: '',
      notes: ''
    }
    selectedServices.value = []
  }
}

// ウォッチャー
watch(() => props.show, (newValue) => {
  if (newValue) {
    initializeForm()
  }
})

watch(selectedServices, () => {
  calculateEndTime()
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

.time-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem;
  background: #e3f2fd;
  border-radius: 6px;
  color: #1976d2;
}

.duration {
  font-weight: 600;
}

.service-selection {
  display: grid;
  gap: 0.75rem;
}

.service-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.service-item:hover {
  border-color: #007bff;
  background: #f8f9fa;
}

.service-item.selected {
  border-color: #007bff;
  background: #e3f2fd;
}

.service-checkbox {
  font-size: 1.2rem;
  color: #007bff;
}

.service-details {
  flex: 1;
}

.service-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.service-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: #6c757d;
}

.service-price {
  font-weight: 600;
  color: #28a745;
}

.stylist-selection {
  display: grid;
  gap: 0.75rem;
}

.stylist-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.stylist-item:hover {
  border-color: #007bff;
  background: #f8f9fa;
}

.stylist-item:has(input:checked) {
  border-color: #007bff;
  background: #e3f2fd;
}

.stylist-item input {
  margin: 0;
}

.stylist-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.stylist-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  background: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stylist-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  font-size: 1.2rem;
  font-weight: 600;
  color: #6c757d;
}

.stylist-details {
  flex: 1;
}

.stylist-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.stylist-specialties {
  font-size: 0.9rem;
  color: #6c757d;
}

.price-summary {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
}

.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-price {
  font-size: 1.5rem;
  font-weight: 700;
  color: #28a745;
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
  
  .button-group {
    flex-direction: column-reverse;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>