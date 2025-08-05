// 予約システム用の型定義

export interface Service {
  id: string
  name: string
  description: string
  duration: number // 分
  price: number
  pricing?: number // dev2 API互換性
  category: ServiceCategory
  isActive: boolean
  availability?: boolean // dev2 API互換性
  requirements?: string[]
}

export interface ServiceCategory {
  id: string
  name: string
  description?: string
  icon: string
  order: number
}

export interface Stylist {
  id: string
  name: string
  displayName: string
  personalInfo?: { // dev2 API互換性
    name: string
    displayName: string
    avatar?: string
    bio?: string
  }
  avatar?: string
  bio?: string
  specialties: string[]
  skills?: string[] // dev2 API互換性
  experience: number // 年数
  rating: number
  availability?: any // dev2 API互換性
  performance?: any // dev2 API互換性
  isActive: boolean
  workingHours: WorkingHours
}

export interface WorkingHours {
  [key: string]: { // 曜日 (monday, tuesday, etc.)
    isWorking: boolean
    startTime: string // "09:00"
    endTime: string   // "18:00"
    breakTime?: {
      start: string
      end: string
    }
  }
}

export interface TimeSlot {
  time: string // "09:00"
  endTime: string // "10:30"
  isAvailable: boolean
  stylistId?: string
  duration: number
}

export interface BookingData {
  // ステップ1: サービス選択
  services: Service[]
  totalDuration: number
  totalPrice: number
  
  // ステップ2: スタイリスト選択
  stylist: Stylist | null
  isAnyStylietOk: boolean
  
  // ステップ3: 日時選択
  date: string // "2024-01-15"
  timeSlot: TimeSlot | null
  
  // ステップ4: 顧客情報
  customerInfo: CustomerInfo
  specialRequests: string
  
  // システム用
  estimatedEndTime?: string
  createdAt?: string
  status: BookingStatus
}

export interface CustomerInfo {
  name: string
  email: string
  phone: string
  isNewCustomer: boolean
  preferences?: {
    preferredStylist?: string
    allergies?: string[]
    notes?: string
  }
}

export enum BookingStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show'
}

export interface AvailabilityQuery {
  date: string
  services: string[] // service IDs
  stylistId?: string
  duration: number
}

export interface AvailabilityResponse {
  date: string
  availableSlots: TimeSlot[]
  unavailableReason?: string
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code?: string
    message: string
    field?: string // dev2 API仕様
    details?: any
  }
  timestamp?: string
}

// dev2 API互換性のための型定義
export interface MenuApiResponse extends ApiResponse<{menus: Service[]}> {}
export interface StaffApiResponse extends ApiResponse<{staffs: Stylist[]}> {}
export interface AvailabilityApiResponse extends ApiResponse<{availableTimeSlots: string[], totalSlots: number}> {}
export interface ReservationApiResponse extends ApiResponse<{reservation: any}> {}

// 従来型定義（後方互換性）
export interface BookingApiResponse extends ApiResponse<BookingData> {}
export interface ServicesApiResponse extends ApiResponse<Service[]> {}
export interface StylistsApiResponse extends ApiResponse<Stylist[]> {}

// Form Validation Types
export interface ValidationError {
  field: string
  message: string
  code?: string
}

export interface FormErrors {
  services?: ValidationError[]
  stylist?: ValidationError[]
  dateTime?: ValidationError[]
  customerInfo?: ValidationError[]
  general?: ValidationError[]
}

// Calendar Types
export interface CalendarDate {
  date: string
  day: number
  isCurrentMonth: boolean
  isToday: boolean
  isPast: boolean
  isAvailable: boolean
  availableSlots: number
  unavailableReason?: string
}

export enum CalendarView {
  MONTH = 'month',
  WEEK = 'week',
  DAY = 'day'
}

export interface CalendarSettings {
  view: CalendarView
  selectedDate: string
  minDate: string
  maxDate: string
  showUnavailable: boolean
  showStylistFilter: boolean
}