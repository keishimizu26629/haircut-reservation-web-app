<template>
  <div 
    class="time-slot"
    :class="{
      available: isAvailable,
      booked: isBooked,
      selected: isSelected,
      disabled: isDisabled,
      'business-hours': isBusinessHours,
      'current-time': isCurrentTime,
      'past-time': isPastTime
    }"
    :aria-label="timeSlotLabel"
    :aria-selected="isSelected"
    :tabindex="isDisabled ? -1 : 0"
    role="gridcell"
    @click="handleClick"
    @keydown="handleKeydown"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Time Label -->
    <div class="time-label">
      <span class="time-text">{{ formattedTime }}</span>
      <span v-if="duration > 30" class="duration-indicator">
        {{ duration }}分
      </span>
    </div>

    <!-- Availability Status -->
    <div class="availability-status">
      <div v-if="isAvailable" class="status-indicator available">
        <i class="bi bi-check-circle" aria-hidden="true"></i>
        <span class="status-text">予約可能</span>
      </div>
      
      <div v-else-if="isBooked" class="status-indicator booked">
        <i class="bi bi-person-fill" aria-hidden="true"></i>
        <span class="status-text">予約済み</span>
      </div>
      
      <div v-else-if="isPastTime" class="status-indicator past">
        <i class="bi bi-clock-history" aria-hidden="true"></i>
        <span class="status-text">終了</span>
      </div>
      
      <div v-else class="status-indicator unavailable">
        <i class="bi bi-x-circle" aria-hidden="true"></i>
        <span class="status-text">利用不可</span>
      </div>
    </div>

    <!-- Current Appointment Info -->
    <div v-if="appointment" class="appointment-info">
      <div class="appointment-customer">
        {{ appointment.customerName }}
      </div>
      <div class="appointment-service">
        {{ appointment.serviceName }}
      </div>
      <div class="appointment-duration">
        {{ formatDuration(appointment.duration) }}
      </div>
    </div>

    <!-- Staff Assignment -->
    <div v-if="staff && showStaff" class="staff-info">
      <div class="staff-avatar">
        <img 
          v-if="staff.photoURL" 
          :src="staff.photoURL" 
          :alt="staff.displayName"
          class="staff-photo"
        >
        <div v-else class="staff-initials">
          {{ getInitials(staff.displayName) }}
        </div>
      </div>
      <div class="staff-name">{{ staff.displayName }}</div>
    </div>

    <!-- Action Buttons -->
    <div v-if="showActions" class="time-slot-actions">
      <button
        v-if="isAvailable"
        class="btn btn-sm btn-primary action-btn"
        @click.stop="$emit('book-slot')"
        :aria-label="`${formattedTime}に予約を作成`"
      >
        <i class="bi bi-plus" aria-hidden="true"></i>
        <span class="d-none d-sm-inline">予約</span>
      </button>
      
      <button
        v-if="appointment && canEdit"
        class="btn btn-sm btn-outline-secondary action-btn"
        @click.stop="$emit('edit-appointment', appointment)"
        :aria-label="`${formattedTime}の予約を編集`"
      >
        <i class="bi bi-pencil" aria-hidden="true"></i>
        <span class="d-none d-sm-inline">編集</span>
      </button>
      
      <button
        v-if="appointment && canCancel"
        class="btn btn-sm btn-outline-danger action-btn"
        @click.stop="$emit('cancel-appointment', appointment)"
        :aria-label="`${formattedTime}の予約をキャンセル`"
      >
        <i class="bi bi-x" aria-hidden="true"></i>
        <span class="d-none d-sm-inline">キャンセル</span>
      </button>
    </div>

    <!-- Hover Preview -->
    <div v-if="isHovered && isAvailable" class="hover-preview">
      <div class="preview-content">
        <div class="preview-time">{{ formattedTime }}</div>
        <div class="preview-action">クリックして予約を作成</div>
      </div>
    </div>

    <!-- Selection Indicator -->
    <div v-if="isSelected" class="selection-indicator">
      <i class="bi bi-check-lg" aria-hidden="true"></i>
    </div>

    <!-- Current Time Indicator -->
    <div v-if="isCurrentTime" class="current-time-indicator">
      <div class="time-marker"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { format, isBefore, isAfter, isSameMinute } from 'date-fns'

// Types
interface Appointment {
  id: string
  customerName: string
  serviceName: string
  duration: number
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed'
  startTime: Date
  endTime: Date
}

interface Staff {
  id: string
  displayName: string
  photoURL?: string
}

interface Props {
  time: Date
  duration?: number
  appointment?: Appointment
  staff?: Staff
  isSelected?: boolean
  showActions?: boolean
  showStaff?: boolean
  canEdit?: boolean
  canCancel?: boolean
  businessHours?: { start: number; end: number }
  breakTimes?: { start: Date; end: Date }[]
}

const props = withDefaults(defineProps<Props>(), {
  duration: 30,
  isSelected: false,
  showActions: true,
  showStaff: false,
  canEdit: true,
  canCancel: true,
  businessHours: () => ({ start: 9, end: 18 }),
  breakTimes: () => []
})

const emit = defineEmits<{
  'click': [time: Date]
  'book-slot': []
  'edit-appointment': [appointment: Appointment]
  'cancel-appointment': [appointment: Appointment]
  'select': [time: Date]
}>()

// Reactive State
const isHovered = ref(false)

// Computed Properties
const formattedTime = computed(() => {
  return format(props.time, 'HH:mm')
})

const timeSlotLabel = computed(() => {
  const timeStr = formattedTime.value
  const statusStr = isAvailable.value ? '予約可能' : 
                   isBooked.value ? '予約済み' : 
                   isPastTime.value ? '終了' : '利用不可'
  
  let label = `${timeStr} ${statusStr}`
  
  if (props.appointment) {
    label += ` ${props.appointment.customerName}様 ${props.appointment.serviceName}`
  }
  
  return label
})

const isCurrentTime = computed(() => {
  const now = new Date()
  const slotStart = props.time
  const slotEnd = new Date(slotStart.getTime() + props.duration * 60000)
  
  return now >= slotStart && now < slotEnd
})

const isPastTime = computed(() => {
  const now = new Date()
  return isBefore(props.time, now)
})

const isBusinessHours = computed(() => {
  const hour = props.time.getHours()
  return hour >= props.businessHours.start && hour < props.businessHours.end
})

const isBreakTime = computed(() => {
  return props.breakTimes.some(breakTime => 
    props.time >= breakTime.start && props.time < breakTime.end
  )
})

const isBooked = computed(() => {
  return !!props.appointment
})

const isAvailable = computed(() => {
  return !isBooked.value && 
         !isPastTime.value && 
         isBusinessHours.value && 
         !isBreakTime.value &&
         !isDisabled.value
})

const isDisabled = computed(() => {
  return isPastTime.value || !isBusinessHours.value || isBreakTime.value
})

// Helper Functions
const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}分`
  } else {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}時間${remainingMinutes}分` : `${hours}時間`
  }
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
  if (isDisabled.value) return
  
  emit('click', props.time)
  emit('select', props.time)
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    handleClick()
  }
}

const handleMouseEnter = () => {
  isHovered.value = true
}

const handleMouseLeave = () => {
  isHovered.value = false
}
</script>

<style scoped>
.time-slot {
  background: var(--neutral-0);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-height: 80px;
  padding: var(--space-3);
  position: relative;
  transition: all var(--transition-fast);
  user-select: none;
}

.time-slot:hover {
  border-color: var(--primary-300);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.time-slot:focus {
  box-shadow: 0 0 0 3px var(--primary-100);
  outline: none;
}

/* State Variations */
.time-slot.available {
  background: var(--success-50);
  border-color: var(--success-200);
}

.time-slot.available:hover {
  background: var(--success-100);
  border-color: var(--success-300);
}

.time-slot.booked {
  background: var(--neutral-100);
  border-color: var(--neutral-300);
}

.time-slot.booked:hover {
  background: var(--neutral-150);
}

.time-slot.selected {
  background: var(--primary-100);
  border-color: var(--primary-400);
  box-shadow: 0 0 0 2px var(--primary-200);
}

.time-slot.disabled {
  background: var(--neutral-50);
  border-color: var(--neutral-200);
  color: var(--neutral-400);
  cursor: not-allowed;
}

.time-slot.disabled:hover {
  transform: none;
  box-shadow: none;
}

.time-slot.current-time {
  border-color: var(--warning-400);
  box-shadow: 0 0 8px var(--warning-200);
}

.time-slot.past-time {
  background: var(--neutral-50);
  color: var(--neutral-400);
  opacity: 0.7;
}

/* Time Label */
.time-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: var(--font-weight-semibold);
}

.time-text {
  font-size: var(--font-size-base);
  color: var(--neutral-800);
}

.duration-indicator {
  background: var(--neutral-200);
  border-radius: var(--radius-sm);
  color: var(--neutral-600);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  padding: var(--space-1) var(--space-2);
}

/* Status Indicator */
.availability-status {
  flex: 1;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
}

.status-indicator.available {
  color: var(--success-600);
}

.status-indicator.booked {
  color: var(--info-600);
}

.status-indicator.past {
  color: var(--neutral-500);
}

.status-indicator.unavailable {
  color: var(--error-600);
}

.status-text {
  font-weight: var(--font-weight-medium);
}

/* Appointment Info */
.appointment-info {
  background: var(--neutral-0);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-base);
  padding: var(--space-2);
  margin-top: var(--space-2);
}

.appointment-customer {
  font-weight: var(--font-weight-semibold);
  color: var(--neutral-800);
  margin-bottom: var(--space-1);
}

.appointment-service {
  color: var(--neutral-600);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-1);
}

.appointment-duration {
  color: var(--primary-600);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

/* Staff Info */
.staff-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.staff-avatar {
  flex-shrink: 0;
}

.staff-photo {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.staff-initials {
  width: 24px;
  height: 24px;
  background: var(--primary-500);
  color: var(--neutral-0);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
}

.staff-name {
  color: var(--neutral-700);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

/* Action Buttons */
.time-slot-actions {
  display: flex;
  gap: var(--space-1);
  margin-top: var(--space-2);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.time-slot:hover .time-slot-actions {
  opacity: 1;
}

.action-btn {
  font-size: var(--font-size-xs);
  padding: var(--space-1) var(--space-2);
}

/* Hover Preview */
.hover-preview {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--neutral-900);
  color: var(--neutral-0);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-sm);
  white-space: nowrap;
  z-index: var(--z-tooltip);
  pointer-events: none;
}

.hover-preview::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: var(--neutral-900);
}

.preview-content {
  text-align: center;
}

.preview-time {
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-1);
}

.preview-action {
  color: var(--neutral-300);
  font-size: var(--font-size-xs);
}

/* Selection Indicator */
.selection-indicator {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  background: var(--primary-500);
  color: var(--neutral-0);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
}

/* Current Time Indicator */
.current-time-indicator {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--warning-500);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.time-marker {
  position: absolute;
  left: -4px;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  background: var(--warning-500);
  border-radius: 50%;
  box-shadow: 0 0 4px var(--warning-300);
}

/* Responsive Design */
@media (max-width: 768px) {
  .time-slot {
    min-height: 60px;
    padding: var(--space-2);
  }
  
  .time-text {
    font-size: var(--font-size-sm);
  }
  
  .status-text {
    display: none;
  }
  
  .appointment-info {
    padding: var(--space-1);
  }
  
  .appointment-customer {
    font-size: var(--font-size-sm);
  }
  
  .appointment-service,
  .appointment-duration {
    font-size: var(--font-size-xs);
  }
  
  .hover-preview {
    display: none;
  }
}

@media (max-width: 576px) {
  .time-slot {
    min-height: 50px;
    padding: var(--space-1);
  }
  
  .time-label {
    gap: var(--space-1);
  }
  
  .status-indicator {
    gap: var(--space-1);
  }
  
  .staff-info {
    margin-top: var(--space-1);
  }
  
  .time-slot-actions {
    margin-top: var(--space-1);
    opacity: 1; /* Always show on mobile */
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .time-slot.available {
    background: var(--success-900);
    border-color: var(--success-700);
  }
  
  .time-slot.booked {
    background: var(--neutral-800);
    border-color: var(--neutral-600);
  }
  
  .appointment-info {
    background: var(--neutral-800);
    border-color: var(--neutral-600);
  }
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  .time-slot {
    border-width: 2px;
  }
  
  .time-slot.available {
    border-color: var(--success-600);
  }
  
  .time-slot.booked {
    border-color: var(--info-600);
  }
  
  .time-slot.disabled {
    border-color: var(--neutral-500);
  }
}

/* Animations */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.current-time-indicator .time-marker {
  animation: pulse 2s infinite;
}
</style>