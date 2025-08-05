<template>
  <div 
    class="appointment-card"
    :class="[
      `status-${appointment.status}`,
      { 
        selected: isSelected,
        dragging: isDragging,
        'past-appointment': isPast,
        'upcoming': isUpcoming,
        'current': isCurrent
      }
    ]"
    :aria-label="appointmentLabel"
    :tabindex="0"
    role="article"
    @click="handleClick"
    @keydown="handleKeydown"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    :draggable="canDrag"
  >
    <!-- Status Indicator -->
    <div class="status-indicator">
      <div class="status-dot" :class="`status-${appointment.status}`"></div>
      <span class="status-text sr-only">{{ statusText }}</span>
    </div>

    <!-- Time Display -->
    <div class="appointment-time">
      <div class="time-range">
        <time :datetime="appointment.startTime.toISOString()">
          {{ formatTime(appointment.startTime) }}
        </time>
        <span class="time-separator">-</span>
        <time :datetime="appointment.endTime.toISOString()">
          {{ formatTime(appointment.endTime) }}
        </time>
      </div>
      <div class="duration-badge" :title="`所要時間: ${formatDuration(appointment.duration)}`">
        {{ formatDuration(appointment.duration) }}
      </div>
    </div>

    <!-- Main Content -->
    <div class="appointment-content">
      <!-- Customer Information -->
      <div class="customer-info">
        <div class="customer-name">
          <i class="bi bi-person-fill customer-icon" aria-hidden="true"></i>
          {{ appointment.customerName }}
        </div>
        <div v-if="appointment.customerPhone" class="customer-phone">
          <i class="bi bi-telephone customer-icon" aria-hidden="true"></i>
          <a :href="`tel:${appointment.customerPhone}`" class="phone-link">
            {{ formatPhone(appointment.customerPhone) }}
          </a>
        </div>
      </div>

      <!-- Service Information -->
      <div class="service-info">
        <div class="service-name">
          <i class="bi bi-scissors service-icon" aria-hidden="true"></i>
          {{ appointment.serviceName }}
        </div>
        <div v-if="appointment.servicePrice" class="service-price">
          ¥{{ appointment.servicePrice.toLocaleString() }}
        </div>
      </div>

      <!-- Staff Assignment -->
      <div v-if="appointment.staff" class="staff-assignment">
        <div class="staff-info">
          <div class="staff-avatar">
            <img 
              v-if="appointment.staff.photoURL" 
              :src="appointment.staff.photoURL" 
              :alt="appointment.staff.displayName"
              class="staff-photo"
            >
            <div v-else class="staff-initials">
              {{ getInitials(appointment.staff.displayName) }}
            </div>
          </div>
          <div class="staff-details">
            <div class="staff-name">{{ appointment.staff.displayName }}</div>
            <div v-if="appointment.staff.title" class="staff-title">
              {{ appointment.staff.title }}
            </div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div v-if="appointment.notes" class="appointment-notes">
        <i class="bi bi-chat-left-text notes-icon" aria-hidden="true"></i>
        <p class="notes-text">{{ appointment.notes }}</p>
      </div>
    </div>

    <!-- Action Menu -->
    <div v-if="showActions" class="appointment-actions">
      <div class="action-buttons">
        <button
          v-if="canEdit"
          class="btn btn-sm btn-outline-primary action-btn"
          @click.stop="$emit('edit', appointment)"
          :aria-label="`${appointment.customerName}様の予約を編集`"
        >
          <i class="bi bi-pencil" aria-hidden="true"></i>
          <span class="btn-text">編集</span>
        </button>
        
        <button
          v-if="canReschedule"
          class="btn btn-sm btn-outline-secondary action-btn"
          @click.stop="$emit('reschedule', appointment)"
          :aria-label="`${appointment.customerName}様の予約を変更`"
        >
          <i class="bi bi-calendar-event" aria-hidden="true"></i>
          <span class="btn-text">変更</span>
        </button>
        
        <button
          v-if="canComplete && appointment.status === 'confirmed'"
          class="btn btn-sm btn-outline-success action-btn"
          @click.stop="$emit('complete', appointment)"
          :aria-label="`${appointment.customerName}様の予約を完了`"
        >
          <i class="bi bi-check-lg" aria-hidden="true"></i>
          <span class="btn-text">完了</span>
        </button>
        
        <button
          v-if="canCancel && appointment.status !== 'cancelled'"
          class="btn btn-sm btn-outline-danger action-btn"
          @click.stop="$emit('cancel', appointment)"
          :aria-label="`${appointment.customerName}様の予約をキャンセル`"
        >
          <i class="bi bi-x-lg" aria-hidden="true"></i>
          <span class="btn-text">キャンセル</span>
        </button>
      </div>
    </div>

    <!-- Drag Handle -->
    <div v-if="canDrag" class="drag-handle" aria-hidden="true">
      <i class="bi bi-grip-vertical"></i>
    </div>

    <!-- Notification Indicators -->
    <div v-if="hasNotifications" class="notification-indicators">
      <div 
        v-if="appointment.hasReminder" 
        class="notification-item"
        title="リマインダー設定済み"
      >
        <i class="bi bi-bell-fill"></i>
      </div>
      <div 
        v-if="appointment.hasConfirmation" 
        class="notification-item"
        title="確認メール送信済み"
      >
        <i class="bi bi-envelope-check-fill"></i>
      </div>
    </div>

    <!-- Priority Indicator -->
    <div 
      v-if="appointment.priority === 'high'" 
      class="priority-indicator high-priority"
      title="優先予約"
    >
      <i class="bi bi-exclamation-triangle-fill"></i>
    </div>

    <!-- Recurring Appointment Indicator -->
    <div 
      v-if="appointment.isRecurring" 
      class="recurring-indicator"
      title="繰り返し予約"
    >
      <i class="bi bi-arrow-repeat"></i>
    </div>

    <!-- Selection Overlay -->
    <div v-if="isSelected" class="selection-overlay">
      <div class="selection-checkmark">
        <i class="bi bi-check-lg"></i>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner-border spinner-border-sm" role="status">
        <span class="sr-only">処理中...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { format, isBefore, isAfter, isSameDay } from 'date-fns'

// Types
interface Staff {
  id: string
  displayName: string
  photoURL?: string
  title?: string
}

interface Appointment {
  id: string
  customerName: string
  customerPhone?: string
  serviceName: string
  servicePrice?: number
  startTime: Date
  endTime: Date
  duration: number
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed'
  staff?: Staff
  notes?: string
  hasReminder?: boolean
  hasConfirmation?: boolean
  priority?: 'normal' | 'high'
  isRecurring?: boolean
}

interface Props {
  appointment: Appointment
  isSelected?: boolean
  showActions?: boolean
  canEdit?: boolean
  canReschedule?: boolean
  canComplete?: boolean
  canCancel?: boolean
  canDrag?: boolean
  isLoading?: boolean
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  showActions: true,
  canEdit: true,
  canReschedule: true,
  canComplete: true,
  canCancel: true,
  canDrag: false,
  isLoading: false,
  compact: false
})

const emit = defineEmits<{
  'click': [appointment: Appointment]
  'edit': [appointment: Appointment]
  'reschedule': [appointment: Appointment]
  'complete': [appointment: Appointment]
  'cancel': [appointment: Appointment]
  'drag-start': [appointment: Appointment]
  'drag-end': [appointment: Appointment]
}>()

// Reactive State
const isDragging = ref(false)

// Computed Properties
const appointmentLabel = computed(() => {
  const timeStr = `${formatTime(props.appointment.startTime)}から${formatTime(props.appointment.endTime)}`
  const customerStr = `${props.appointment.customerName}様`
  const serviceStr = `${props.appointment.serviceName}`
  const statusStr = statusText.value
  
  return `${timeStr} ${customerStr} ${serviceStr} ${statusStr}`
})

const statusText = computed(() => {
  const statusMap = {
    confirmed: '確定',
    pending: '保留中',
    cancelled: 'キャンセル',
    completed: '完了'
  }
  return statusMap[props.appointment.status] || '不明'
})

const isPast = computed(() => {
  const now = new Date()
  return isBefore(props.appointment.endTime, now)
})

const isUpcoming = computed(() => {
  const now = new Date()
  const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60000)
  return isAfter(props.appointment.startTime, now) && 
         isBefore(props.appointment.startTime, thirtyMinutesFromNow)
})

const isCurrent = computed(() => {
  const now = new Date()
  return now >= props.appointment.startTime && now <= props.appointment.endTime
})

const hasNotifications = computed(() => {
  return props.appointment.hasReminder || props.appointment.hasConfirmation
})

// Helper Functions
const formatTime = (date: Date): string => {
  return format(date, 'HH:mm')
}

const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}分`
  } else {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}時間${remainingMinutes}分` : `${hours}時間`
  }
}

const formatPhone = (phone: string): string => {
  // Format phone number (Japanese format)
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
  } else if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Event Handlers
const handleClick = () => {
  emit('click', props.appointment)
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    handleClick()
  }
}

const handleDragStart = () => {
  isDragging.value = true
  emit('drag-start', props.appointment)
}

const handleDragEnd = () => {
  isDragging.value = false
  emit('drag-end', props.appointment)
}
</script>

<style scoped>
.appointment-card {
  background: var(--neutral-0);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  position: relative;
  transition: all var(--transition-base);
  user-select: none;
}

.appointment-card:hover {
  border-color: var(--primary-300);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.appointment-card:focus {
  box-shadow: 0 0 0 3px var(--primary-100);
  outline: none;
}

/* Status Variations */
.appointment-card.status-confirmed {
  border-left: 4px solid var(--appointment-confirmed);
}

.appointment-card.status-pending {
  border-left: 4px solid var(--appointment-pending);
}

.appointment-card.status-cancelled {
  border-left: 4px solid var(--appointment-cancelled);
  opacity: 0.7;
}

.appointment-card.status-completed {
  border-left: 4px solid var(--appointment-completed);
  background: var(--success-50);
}

.appointment-card.selected {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 2px var(--primary-200);
}

.appointment-card.dragging {
  box-shadow: var(--shadow-xl);
  transform: rotate(2deg);
  z-index: var(--z-modal);
}

.appointment-card.past-appointment {
  opacity: 0.8;
}

.appointment-card.upcoming {
  border-color: var(--warning-400);
  background: var(--warning-50);
}

.appointment-card.current {
  border-color: var(--info-400);
  background: var(--info-50);
  box-shadow: 0 0 12px var(--info-200);
}

/* Status Indicator */
.status-indicator {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--appointment-confirmed);
}

.status-dot.status-pending {
  background: var(--appointment-pending);
}

.status-dot.status-cancelled {
  background: var(--appointment-cancelled);
}

.status-dot.status-completed {
  background: var(--appointment-completed);
}

/* Time Display */
.appointment-time {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}

.time-range {
  color: var(--primary-600);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.time-separator {
  color: var(--neutral-400);
  margin: 0 var(--space-2);
}

.duration-badge {
  background: var(--neutral-200);
  border-radius: var(--radius-full);
  color: var(--neutral-700);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  padding: var(--space-1) var(--space-2);
}

/* Main Content */
.appointment-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  flex: 1;
}

/* Customer Information */
.customer-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.customer-name {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--neutral-800);
}

.customer-phone {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
}

.phone-link {
  color: var(--primary-600);
  text-decoration: none;
}

.phone-link:hover {
  text-decoration: underline;
}

.customer-icon {
  color: var(--neutral-500);
  font-size: var(--font-size-sm);
}

/* Service Information */
.service-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--neutral-50);
  border-radius: var(--radius-md);
  padding: var(--space-2);
}

.service-name {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--neutral-700);
  font-weight: var(--font-weight-medium);
}

.service-icon {
  color: var(--primary-500);
}

.service-price {
  color: var(--success-600);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

/* Staff Assignment */
.staff-assignment {
  background: var(--primary-50);
  border-radius: var(--radius-md);
  padding: var(--space-2);
}

.staff-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.staff-avatar {
  flex-shrink: 0;
}

.staff-photo {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.staff-initials {
  width: 32px;
  height: 32px;
  background: var(--primary-500);
  color: var(--neutral-0);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}

.staff-name {
  color: var(--primary-700);
  font-weight: var(--font-weight-semibold);
}

.staff-title {
  color: var(--primary-600);
  font-size: var(--font-size-sm);
}

/* Notes */
.appointment-notes {
  background: var(--warning-50);
  border-radius: var(--radius-md);
  display: flex;
  gap: var(--space-2);
  padding: var(--space-2);
}

.notes-icon {
  color: var(--warning-600);
  flex-shrink: 0;
  margin-top: 2px;
}

.notes-text {
  color: var(--neutral-700);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
  margin: 0;
}

/* Action Buttons */
.appointment-actions {
  border-top: 1px solid var(--neutral-200);
  margin-top: var(--space-2);
  padding-top: var(--space-3);
  opacity: 0;
  transition: opacity var(--transition-base);
}

.appointment-card:hover .appointment-actions {
  opacity: 1;
}

.action-buttons {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-xs);
  padding: var(--space-1) var(--space-2);
}

.btn-text {
  display: none;
}

/* Drag Handle */
.drag-handle {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  color: var(--neutral-400);
  cursor: grab;
  opacity: 0;
  transition: opacity var(--transition-base);
}

.appointment-card:hover .drag-handle {
  opacity: 1;
}

.drag-handle:active {
  cursor: grabbing;
}

/* Notification Indicators */
.notification-indicators {
  position: absolute;
  bottom: var(--space-2);
  right: var(--space-2);
  display: flex;
  gap: var(--space-1);
}

.notification-item {
  color: var(--info-500);
  font-size: var(--font-size-xs);
}

/* Priority Indicator */
.priority-indicator {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
}

.high-priority {
  color: var(--error-500);
  font-size: var(--font-size-sm);
}

/* Recurring Indicator */
.recurring-indicator {
  position: absolute;
  bottom: var(--space-2);
  left: var(--space-2);
  color: var(--secondary-500);
  font-size: var(--font-size-sm);
}

/* Selection Overlay */
.selection-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(var(--primary-500-rgb), 0.1);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.selection-checkmark {
  background: var(--primary-500);
  color: var(--neutral-0);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-lg);
}

/* Loading Overlay */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(var(--neutral-0-rgb), 0.8);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Responsive Design */
@media (min-width: 768px) {
  .btn-text {
    display: inline;
  }
  
  .action-buttons {
    justify-content: flex-end;
  }
}

@media (max-width: 768px) {
  .appointment-card {
    padding: var(--space-3);
  }
  
  .appointment-time {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-1);
  }
  
  .time-range {
    font-size: var(--font-size-base);
  }
  
  .customer-name {
    font-size: var(--font-size-base);
  }
  
  .staff-info {
    gap: var(--space-2);
  }
  
  .appointment-actions {
    opacity: 1;
  }
}

@media (max-width: 576px) {
  .appointment-card {
    padding: var(--space-2);
  }
  
  .service-info {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-1);
  }
  
  .action-buttons {
    gap: var(--space-1);
  }
  
  .action-btn {
    font-size: 10px;
    padding: var(--space-1);
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .appointment-card.status-completed {
    background: var(--success-900);
  }
  
  .appointment-card.upcoming {
    background: var(--warning-900);
  }
  
  .appointment-card.current {
    background: var(--info-900);
  }
  
  .service-info {
    background: var(--neutral-800);
  }
  
  .staff-assignment {
    background: var(--primary-900);
  }
  
  .appointment-notes {
    background: var(--warning-900);
  }
}

/* Print Styles */
@media print {
  .appointment-card {
    break-inside: avoid;
    box-shadow: none;
    border: 1px solid var(--neutral-400);
  }
  
  .appointment-actions,
  .drag-handle,
  .selection-overlay,
  .loading-overlay {
    display: none;
  }
}
</style>