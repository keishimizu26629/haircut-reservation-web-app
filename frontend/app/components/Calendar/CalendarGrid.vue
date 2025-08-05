<template>
  <div class="calendar-container">
    <!-- Calendar Header - Google Calendar Style -->
    <div class="calendar-header bg-white rounded-lg shadow-sm border border-gray-200">
      <div class="flex items-center justify-between p-4">
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-2">
            <button
              class="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
              @click="previousPeriod"
              :aria-label="`前の${currentViewMode === 'month' ? '月' : currentViewMode === 'week' ? '週' : '日'}に移動`"
            >
              <i class="bi bi-chevron-left text-gray-600"></i>
            </button>
            
            <h2 class="text-2xl font-normal text-gray-900 min-w-[200px]">
              {{ formatTitle }}
            </h2>
            
            <button
              class="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
              @click="nextPeriod"
              :aria-label="`次の${currentViewMode === 'month' ? '月' : currentViewMode === 'week' ? '週' : '日'}に移動`"
            >
              <i class="bi bi-chevron-right text-gray-600"></i>
            </button>
          </div>
          
          <button
            class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            @click="goToToday"
            :class="{ 'bg-blue-50 border-blue-200 text-blue-700': isCurrentPeriod }"
          >
            今日
          </button>
        </div>
        
        <!-- View Mode Selector - Google Calendar Style -->
        <div class="flex space-x-1 bg-gray-100 rounded-md p-1">
          <button
            class="px-3 py-2 text-sm font-medium rounded-md transition-all duration-200"
            :class="currentViewMode === 'month' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'"
            @click="setViewMode('month')"
          >
            月
          </button>
          <button
            class="px-3 py-2 text-sm font-medium rounded-md transition-all duration-200"
            :class="currentViewMode === 'week' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'"
            @click="setViewMode('week')"
          >
            週
          </button>
        </div>
      </div>
    </div>

    <!-- Calendar Body - Excel-like Grid -->
    <div class="calendar-body mt-4">
      <!-- Month View - Google Calendar + Excel Style -->
      <div v-if="currentViewMode === 'month'" class="calendar-month-view">
        <!-- Days of Week Header - Excel Style -->
        <div class="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          <div
            v-for="(dayName, index) in ['月', '火', '水', '木', '金', '土', '日']"
            :key="dayName"
            class="px-4 py-3 text-sm font-medium text-gray-700 text-center border-r border-gray-200 last:border-r-0"
            :class="{
              'text-blue-600': index === 5, // 土曜日
              'text-red-600': index === 6   // 日曜日
            }"
          >
            {{ dayName }}
          </div>
        </div>
        
        <!-- Calendar Grid - Excel-like with Pastel Colors -->
        <div class="grid grid-cols-7 border-l border-gray-200 bg-white">
          <div
            v-for="day in calendarDays"
            :key="day.key"
            class="min-h-[120px] border-r border-b border-gray-200 p-2 cursor-pointer transition-all duration-150 hover:bg-gray-50"
            :class="{
              'bg-blue-50 hover:bg-blue-100': day.isToday,
              'bg-gray-100': day.isOtherMonth,
              'bg-reservation-selected': day.isSelected,
              'bg-pastel-blue': day.appointments.length > 0,
              'opacity-50': day.isDisabled
            }"
            @click="selectDay(day)"
          >
            <!-- Day Number -->
            <div class="flex justify-between items-start mb-1">
              <span 
                class="text-sm font-medium"
                :class="{
                  'text-blue-600 font-semibold': day.isToday,
                  'text-gray-400': day.isOtherMonth,
                  'text-gray-900': !day.isOtherMonth && !day.isToday
                }"
              >
                {{ day.date.getDate() }}
              </span>
              
              <!-- Appointment Count Badge -->
              <span 
                v-if="day.appointments.length > 0"
                class="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full"
                :class="getAppointmentBadgeClass(day.appointments)"
              >
                {{ day.appointments.length }}
              </span>
            </div>
            
            <!-- Appointment List -->
            <div class="space-y-1">
              <div
                v-for="appointment in day.appointments.slice(0, 3)"
                :key="appointment.id"
                class="text-xs px-2 py-1 rounded text-gray-700 truncate"
                :class="getAppointmentClass(appointment.status)"
                :title="`${appointment.title} - ${appointment.customerName}`"
              >
                {{ appointment.title }}
              </div>
              <div
                v-if="day.appointments.length > 3"
                class="text-xs text-gray-500 px-2"
              >
                +{{ day.appointments.length - 3 }}件
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Week View - Google Calendar Style with Pastel Colors -->
      <div v-else-if="currentViewMode === 'week'" class="calendar-week-view bg-white rounded-lg border border-gray-200">
        <!-- Week Header -->
        <div class="grid grid-cols-8 border-b border-gray-200">
          <div class="w-16 p-2"></div>
          <div
            v-for="day in currentWeekDays"
            :key="day.date.toISOString()"
            class="p-3 text-center border-r border-gray-200 last:border-r-0"
            :class="{
              'bg-blue-50': day.isToday,
              'text-blue-600': day.isToday
            }"
          >
            <div class="text-xs text-gray-600 mb-1">{{ day.dayName }}</div>
            <div 
              class="text-lg font-medium"
              :class="day.isToday ? 'text-blue-600' : 'text-gray-900'"
            >
              {{ day.date.getDate() }}
            </div>
          </div>
        </div>
        
        <!-- Time Grid -->
        <div class="overflow-y-auto max-h-[600px]">
          <div
            v-for="hour in businessTimeSlots"
            :key="hour"
            class="grid grid-cols-8 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150"
            :class="{ 'bg-gray-50': hour % 2 === 0 }"
          >
            <!-- Time Label -->
            <div class="w-16 px-3 py-4 text-right text-sm text-gray-600 border-r border-gray-200">
              {{ formatHour(hour) }}
            </div>
            
            <!-- Day Columns -->
            <div
              v-for="day in currentWeekDays"
              :key="`${day.date.toDateString()}-${hour}`"
              class="relative min-h-[60px] border-r border-gray-200 last:border-r-0 cursor-pointer"
              :class="{
                'bg-blue-50': isCurrentTimeSlot(day.date, hour),
                'hover:bg-pastel-blue': isAvailable(day.date, hour)
              }"
              @click="selectTimeSlot(day.date, hour)"
            >
              <!-- Time Slot Appointments -->
              <div
                v-for="appointment in getAppointmentsForTimeSlot(day.date, hour)"
                :key="appointment.id"
                class="absolute inset-x-1 top-1 px-2 py-1 rounded text-xs font-medium cursor-pointer z-10"
                :class="getAppointmentClass(appointment.status)"
                :style="{ height: `${Math.max(appointment.duration || 60, 30)}px` }"
                @click.stop="selectAppointment(appointment)"
              >
                <div class="truncate">{{ appointment.title }}</div>
                <div class="text-xs opacity-80 truncate">{{ appointment.customerName }}</div>
              </div>
              
              <!-- Available Slot Indicator -->
              <div 
                v-if="isAvailable(day.date, hour) && isBusinessHour(hour)"
                class="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200"
              >
                <i class="bi bi-plus-circle text-gray-400 text-lg"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Day View - Simple List Style -->
      <div v-else-if="currentViewMode === 'day'" class="calendar-day-view bg-white rounded-lg border border-gray-200">
        <div class="p-4 border-b border-gray-200">
          <h3 class="text-xl font-medium text-gray-900">
            {{ formatDayTitle(currentDate) }}
          </h3>
          <div class="text-sm text-gray-600 mt-1">
            {{ dayAppointments.length }}件の予約
          </div>
        </div>
        
        <div class="divide-y divide-gray-200">
          <div
            v-for="hour in businessTimeSlots"
            :key="hour"
            class="p-4 hover:bg-gray-50 transition-colors duration-150"
          >
            <div class="flex items-start space-x-4">
              <div class="w-16 text-sm text-gray-600 font-medium">
                {{ formatHour(hour) }}
              </div>
              
              <div class="flex-1">
                <div
                  v-for="appointment in getAppointmentsForHour(hour)"
                  :key="appointment.id"
                  class="mb-2 p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-all duration-150"
                  :class="getAppointmentClass(appointment.status)"
                  @click="selectAppointment(appointment)"
                >
                  <div class="flex justify-between items-start">
                    <div>
                      <div class="font-medium text-gray-900">{{ appointment.title }}</div>
                      <div class="text-sm text-gray-600 mt-1">{{ appointment.customerName }}</div>
                      <div class="text-xs text-gray-500 mt-1">
                        {{ formatTime(appointment.startTime) }} - {{ formatTime(appointment.endTime) }}
                      </div>
                    </div>
                    <div class="text-xs px-2 py-1 rounded-full font-medium" :class="getStatusBadgeClass(appointment.status)">
                      {{ getStatusText(appointment.status) }}
                    </div>
                  </div>
                </div>
                
                <!-- Empty time slot -->
                <div
                  v-if="getAppointmentsForHour(hour).length === 0 && isBusinessHour(hour)"
                  class="p-3 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all duration-150"
                  @click="createAppointment(currentDate, hour)"
                >
                  <i class="bi bi-plus-circle text-gray-400 text-lg mb-2"></i>
                  <div class="text-sm text-gray-500">予約を追加</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, isSameMonth, isWeekend } from 'date-fns'
import { ja } from 'date-fns/locale'

// Props & Emits
interface Props {
  modelValue?: Date
  appointments?: Appointment[]
  viewMode?: 'month' | 'week' | 'day'
  businessHours?: { start: number; end: number }
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  disabledDates?: Date[]
  minDate?: Date
  maxDate?: Date
}

interface Appointment {
  id: string
  title: string
  startTime: Date
  endTime: Date
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed'
  customerName: string
  duration?: number
}

interface CalendarDay {
  date: Date
  key: string
  isToday: boolean
  isSelected: boolean
  isOtherMonth: boolean
  isWeekend: boolean
  isDisabled: boolean
  appointments: Appointment[]
}

const props = withDefaults(defineProps<Props>(), {
  viewMode: 'month',
  businessHours: () => ({ start: 9, end: 18 }),
  weekStartsOn: 1,
  appointments: () => [],
  disabledDates: () => []
})

const emit = defineEmits<{
  'update:modelValue': [date: Date]
  'update:viewMode': [mode: string]
  'select-day': [day: CalendarDay]
  'select-appointment': [appointment: Appointment]
  'create-appointment': [date: Date, hour?: number]
  'select-time-slot': [date: Date, hour: number]
}>()

// Reactive State
const currentDate = ref(props.modelValue || new Date())
const selectedDate = ref<Date | null>(props.modelValue || null)
const currentViewMode = ref(props.viewMode)

// Pastel Color Classes for Appointments
const getAppointmentClass = (status: string) => {
  const classes = {
    'confirmed': 'bg-pastel-green border-green-200 text-green-800',
    'pending': 'bg-pastel-yellow border-yellow-200 text-yellow-800', 
    'cancelled': 'bg-pastel-pink border-red-200 text-red-800',
    'completed': 'bg-pastel-blue border-blue-200 text-blue-800'
  }
  return classes[status as keyof typeof classes] || 'bg-gray-100 border-gray-200 text-gray-800'
}

const getAppointmentBadgeClass = (appointments: Appointment[]) => {
  const hasConfirmed = appointments.some(apt => apt.status === 'confirmed')
  const hasPending = appointments.some(apt => apt.status === 'pending')
  
  if (hasConfirmed) return 'bg-green-100 text-green-800'
  if (hasPending) return 'bg-yellow-100 text-yellow-800'
  return 'bg-gray-100 text-gray-800'
}

const getStatusBadgeClass = (status: string) => {
  const classes = {
    'confirmed': 'bg-green-100 text-green-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'cancelled': 'bg-red-100 text-red-800',
    'completed': 'bg-blue-100 text-blue-800'
  }
  return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800'
}

const getStatusText = (status: string) => {
  const texts = {
    'confirmed': '確定',
    'pending': '保留',
    'cancelled': 'キャンセル',
    'completed': '完了'
  }
  return texts[status as keyof typeof texts] || status
}

// Time Configuration
const timeSlots = computed(() => {
  const slots = []
  for (let hour = 0; hour < 24; hour++) {
    slots.push(hour)
  }
  return slots
})

// Business Hours Time Slots (9:00 - 18:00)
const businessTimeSlots = computed(() => {
  const slots = []
  for (let hour = props.businessHours.start; hour < props.businessHours.end; hour++) {
    slots.push(hour)
  }
  return slots
})

// Current Week Days for Week View
const currentWeekDays = computed(() => {
  const weekStart = startOfWeek(currentDate.value, { weekStartsOn: props.weekStartsOn })
  const weekEnd = endOfWeek(currentDate.value, { weekStartsOn: props.weekStartsOn })
  
  return eachDayOfInterval({ start: weekStart, end: weekEnd }).map(date => ({
    date,
    dayName: format(date, 'E', { locale: ja }),
    isToday: isToday(date),
    isWeekend: isWeekend(date)
  }))
})


// Calendar Computeds
const formatTitle = computed(() => {
  switch (currentViewMode.value) {
    case 'month':
      return format(currentDate.value, 'yyyy年M月', { locale: ja })
    case 'week':
      const weekStart = startOfWeek(currentDate.value, { weekStartsOn: props.weekStartsOn })
      const weekEnd = endOfWeek(currentDate.value, { weekStartsOn: props.weekStartsOn })
      return `${format(weekStart, 'M月d日', { locale: ja })} - ${format(weekEnd, 'M月d日', { locale: ja })}`
    case 'day':
      return format(currentDate.value, 'yyyy年M月d日（E）', { locale: ja })
    default:
      return ''
  }
})

const isCurrentPeriod = computed(() => {
  const today = new Date()
  switch (currentViewMode.value) {
    case 'month':
      return isSameMonth(currentDate.value, today)
    case 'week':
      const weekStart = startOfWeek(today, { weekStartsOn: props.weekStartsOn })
      const weekEnd = endOfWeek(today, { weekStartsOn: props.weekStartsOn })
      return currentDate.value >= weekStart && currentDate.value <= weekEnd
    case 'day':
      return isSameDay(currentDate.value, today)
    default:
      return false
  }
})

const calendarDays = computed((): CalendarDay[] => {
  if (currentViewMode.value !== 'month') return []
  
  const monthStart = startOfMonth(currentDate.value)
  const monthEnd = endOfMonth(currentDate.value)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: props.weekStartsOn })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: props.weekStartsOn })
  
  return eachDayOfInterval({ start: calendarStart, end: calendarEnd }).map(date => ({
    date,
    key: date.toISOString(),
    isToday: isToday(date),
    isSelected: selectedDate.value ? isSameDay(date, selectedDate.value) : false,
    isOtherMonth: !isSameMonth(date, currentDate.value),
    isWeekend: isWeekend(date),
    isDisabled: isDateDisabled(date),
    appointments: getAppointmentsForDate(date)
  }))
})

const dayAppointments = computed(() => {
  return getAppointmentsForDate(currentDate.value)
})

// Helper Functions
const isDateDisabled = (date: Date): boolean => {
  if (props.minDate && date < props.minDate) return true
  if (props.maxDate && date > props.maxDate) return true
  return props.disabledDates.some(disabledDate => isSameDay(date, disabledDate))
}

const getAppointmentsForDate = (date: Date): Appointment[] => {
  return props.appointments.filter(appointment =>
    isSameDay(appointment.startTime, date)
  )
}

const getAppointmentsForTimeSlot = (date: Date, hour: number): Appointment[] => {
  return props.appointments.filter(appointment => {
    const appointmentHour = appointment.startTime.getHours()
    return isSameDay(appointment.startTime, date) && appointmentHour === hour
  })
}

const getAppointmentsForHour = (hour: number): Appointment[] => {
  return dayAppointments.value.filter(appointment =>
    appointment.startTime.getHours() === hour
  )
}

const isBusinessHour = (hour: number): boolean => {
  return hour >= props.businessHours.start && hour < props.businessHours.end
}

const isAvailable = (date: Date, hour: number): boolean => {
  if (!isBusinessHour(hour)) return false
  const appointments = getAppointmentsForTimeSlot(date, hour)
  return appointments.length === 0
}

const isCurrentTimeSlot = (date: Date, hour: number): boolean => {
  const now = new Date()
  return isSameDay(date, now) && now.getHours() === hour
}

const formatHour = (hour: number): string => {
  return `${hour.toString().padStart(2, '0')}:00`
}

const formatTime = (date: Date): string => {
  return format(date, 'HH:mm')
}

const formatDayTitle = (date: Date): string => {
  return format(date, 'M月d日（E）', { locale: ja })
}

const formatDayLabel = (day: CalendarDay): string => {
  const dateStr = format(day.date, 'yyyy年M月d日', { locale: ja })
  const appointmentCount = day.appointments.length
  const appointmentStr = appointmentCount > 0 ? `、${appointmentCount}件の予約` : ''
  return `${dateStr}${appointmentStr}`
}

// Event Handlers
const selectDay = (day: CalendarDay) => {
  if (day.isDisabled) return
  
  selectedDate.value = day.date
  currentDate.value = day.date
  emit('update:modelValue', day.date)
  emit('select-day', day)
}

const selectAppointment = (appointment: Appointment) => {
  emit('select-appointment', appointment)
}

const createAppointment = (date: Date, hour?: number) => {
  emit('create-appointment', date, hour)
}

const selectTimeSlot = (date: Date, hour: number) => {
  emit('select-time-slot', date, hour)
}

const setViewMode = (mode: string) => {
  currentViewMode.value = mode as 'month' | 'week' | 'day'
  emit('update:viewMode', mode)
}

const previousPeriod = () => {
  switch (currentViewMode.value) {
    case 'month':
      currentDate.value = subMonths(currentDate.value, 1)
      break
    case 'week':
      currentDate.value = subWeeks(currentDate.value, 1)
      break
    case 'day':
      currentDate.value = subDays(currentDate.value, 1)
      break
  }
}

const nextPeriod = () => {
  switch (currentViewMode.value) {
    case 'month':
      currentDate.value = addMonths(currentDate.value, 1)
      break
    case 'week':
      currentDate.value = addWeeks(currentDate.value, 1)
      break
    case 'day':
      currentDate.value = addDays(currentDate.value, 1)
      break
  }
}

const goToToday = () => {
  const today = new Date()
  currentDate.value = today
  selectedDate.value = today
  emit('update:modelValue', today)
}

const handleDayKeydown = (event: KeyboardEvent, day: CalendarDay) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    selectDay(day)
  }
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    currentDate.value = newValue
    selectedDate.value = newValue
  }
})

watch(() => props.viewMode, (newMode) => {
  currentViewMode.value = newMode
})
</script>

<style scoped>
/* Tailwind CSSで置き換えられたため、カスタムスタイルのみ残す */
.calendar-container {
  @apply w-full max-w-6xl mx-auto;
}

/* パステルカラーのカスタム定義 */
.bg-pastel-pink {
  background-color: #FFE4E1;
}

.bg-pastel-blue {
  background-color: #E0E4FF;
}

.bg-pastel-green {
  background-color: #E1F5E4;
}

.bg-pastel-yellow {
  background-color: #FFF7E0;
}

.bg-pastel-purple {
  background-color: #F0E4FF;
}

.bg-pastel-mint {
  background-color: #E0F7FA;
}

/* 予約状態用のカスタムスタイル */
.bg-reservation-available {
  background-color: #E1F5E4;
}

.bg-reservation-booked {
  background-color: #FFE4E1;
}

.bg-reservation-closed {
  background-color: #F5F5F5;
}

.bg-reservation-selected {
  background-color: #E0E4FF;
}

.bg-reservation-pending {
  background-color: #FFF7E0;
}

.bg-reservation-confirmed {
  background-color: #E0F7FA;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .calendar-container {
    @apply px-2;
  }
}

@media (max-width: 640px) {
  .calendar-header {
    @apply flex-col space-y-4;
  }
  
  .calendar-header .flex:first-child {
    @apply flex-col space-y-2 space-x-0;
  }
  
  .calendar-header .flex:first-child > div:first-child {
    @apply flex-col space-x-0 space-y-2;
  }
}
</style>