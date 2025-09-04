// Clean Architecture インターフェース定義

// ドメイン層インターフェース
export interface IEmailNotificationRepository {
  send(notification: EmailNotificationEntity): Promise<boolean>
  retry(notificationId: string): Promise<boolean>
  getHistory(bookingId?: string): Promise<EmailNotificationEntity[]>
  getSettings(): Promise<EmailSettingsEntity>
  saveSettings(settings: Partial<EmailSettingsEntity>): Promise<boolean>
}

export interface IBookingRepository {
  getServices(): Promise<ServiceEntity[]>
  getStylists(): Promise<StylistEntity[]>
  getAvailability(query: AvailabilityQuery): Promise<AvailabilityResponse>
  createBooking(booking: BookingEntity): Promise<BookingEntity>
  getBooking(id: string): Promise<BookingEntity>
  updateBooking(id: string, booking: Partial<BookingEntity>): Promise<BookingEntity>
  cancelBooking(id: string): Promise<void>
}

export interface IFirebaseConfigRepository {
  getCurrentEnvironment(): string
  switchEnvironment(env: 'development' | 'production'): Promise<void>
  toggleEmulator(enabled: boolean): Promise<void>
  checkConnection(): Promise<boolean>
  getEmulatorInfo(): EmulatorInfo | null
}

// ユースケース層インターフェース
export interface IEmailNotificationUseCase {
  sendConfirmationEmail(bookingData: BookingEntity): Promise<boolean>
  sendReminderEmail(bookingData: BookingEntity): Promise<boolean>
  retryFailedEmail(notificationId: string): Promise<boolean>
  getNotificationHistory(bookingId?: string): Promise<EmailNotificationEntity[]>
  updateSettings(settings: Partial<EmailSettingsEntity>): Promise<boolean>
}

export interface IBookingUseCase {
  getAvailableServices(): Promise<ServiceEntity[]>
  getAvailableStylists(): Promise<StylistEntity[]>
  checkAvailability(query: AvailabilityQuery): Promise<AvailabilityResponse>
  createBooking(bookingData: BookingEntity): Promise<BookingEntity>
  updateBooking(id: string, updates: Partial<BookingEntity>): Promise<BookingEntity>
  cancelBooking(id: string): Promise<void>
}

export interface IFirebaseConfigUseCase {
  getCurrentConfig(): FirebaseEnvironmentConfig
  switchToProduction(): Promise<void>
  switchToDevelopment(): Promise<void>
  enableEmulator(): Promise<void>
  disableEmulator(): Promise<void>
  testConnection(): Promise<boolean>
}

// エンティティ定義
export interface EmailNotificationEntity {
  id: string
  type: 'confirmation' | 'reminder' | 'cancellation' | 'modification'
  status: 'pending' | 'sending' | 'sent' | 'failed' | 'retry'
  recipientEmail: string
  bookingId: string
  templateData: Record<string, unknown>
  sentAt?: Date
  error?: string
  retryCount: number
  maxRetries: number
  createdAt: Date
  updatedAt: Date
}

export interface EmailSettingsEntity {
  enabled: boolean
  confirmationEnabled: boolean
  reminderEnabled: boolean
  reminderHours: number
  template: 'default' | 'custom'
  customTemplate?: string
  createdAt: Date
  updatedAt: Date
}

export interface BookingEntity {
  id?: string
  customerId: string
  tenantId: string
  services: ServiceEntity[]
  stylist?: StylistEntity
  isAnyStylietOk: boolean
  appointmentDate: Date
  timeSlot: TimeSlotEntity
  customerInfo: CustomerInfoEntity
  specialRequests: string
  status: BookingStatus
  totalDuration: number
  totalPrice: number
  createdAt?: Date
  updatedAt?: Date
}

export interface ServiceEntity {
  id: string
  tenantId: string
  name: string
  description: string
  duration: number
  price: number
  category: ServiceCategoryEntity
  isActive: boolean
  requirements?: string[]
  createdAt: Date
  updatedAt: Date
}

export interface StylistEntity {
  id: string
  tenantId: string
  name: string
  displayName: string
  email?: string
  avatar?: string
  specialties: string[]
  experience: number
  rating: number
  isActive: boolean
  workingHours: WorkingHoursEntity
  createdAt: Date
  updatedAt: Date
}

export interface TimeSlotEntity {
  time: string
  endTime: string
  isAvailable: boolean
  stylistId?: string
  duration: number
  date: Date
}

export interface CustomerInfoEntity {
  name: string
  email: string
  phone: string
  isNewCustomer: boolean
}

export interface ServiceCategoryEntity {
  id: string
  name: string
  icon: string
  order: number
}

export interface WorkingHoursEntity {
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
  sunday: DaySchedule
}

export interface DaySchedule {
  isWorking: boolean
  startTime: string
  endTime: string
}

export interface FirebaseEnvironmentConfig {
  name: 'development' | 'production'
  useEmulator: boolean
  projectId: string
  apiKey: string
  authDomain: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

export interface EmulatorInfo {
  auth: string
  firestore: string
  storage: string
  functions: string
}

// 値オブジェクト
export type BookingStatus = 'draft' | 'confirmed' | 'completed' | 'cancelled'

export interface AvailabilityQuery {
  date: string
  services: string[]
  stylistId?: string
  duration: number
}

export interface AvailabilityResponse {
  date: string
  availableSlots: TimeSlotEntity[]
}

// エラー型
export class DomainError extends Error {
  constructor(message: string, public readonly code: string, public readonly details?: unknown) {
    super(message)
    this.name = 'DomainError'
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class NetworkError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(message, 'NETWORK_ERROR', details)
    this.name = 'NetworkError'
  }
}

export class AuthenticationError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(message, 'AUTHENTICATION_ERROR', details)
    this.name = 'AuthenticationError'
  }
}

// リポジトリレスポンス型
export interface RepositoryResponse<T> {
  success: boolean
  data?: T
  error?: {
    message: string
    code: string
    details?: unknown
  }
}

// API応答型（互換性のため維持）
export interface ApiResponse<T = unknown> extends RepositoryResponse<T> {}

// イベント型
export interface DomainEvent {
  id: string
  type: string
  aggregateId: string
  data: unknown
  occurredAt: Date
}

export interface EmailSentEvent extends DomainEvent {
  type: 'EMAIL_SENT'
  data: {
    notificationId: string
    recipientEmail: string
    notificationType: string
  }
}

export interface BookingCreatedEvent extends DomainEvent {
  type: 'BOOKING_CREATED'
  data: {
    bookingId: string
    customerId: string
    appointmentDate: Date
  }
}

// ファクトリーインターフェース
export interface IEmailNotificationFactory {
  createConfirmationNotification(bookingData: BookingEntity): EmailNotificationEntity
  createReminderNotification(bookingData: BookingEntity): EmailNotificationEntity
  createCancellationNotification(bookingData: BookingEntity): EmailNotificationEntity
}

export interface IBookingFactory {
  createDraftBooking(data: Partial<BookingEntity>): BookingEntity
  createConfirmedBooking(draftBooking: BookingEntity): BookingEntity
}

// バリデーターインターフェース
export interface IValidator<T> {
  validate(data: T): ValidationResult
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

// サービスインターフェース
export interface IEmailTemplateService {
  renderTemplate(template: string, data: Record<string, unknown>): string
  getDefaultTemplate(type: string): string
  validateTemplate(template: string): ValidationResult
}

export interface INotificationService {
  scheduleReminder(booking: BookingEntity): Promise<void>
  cancelScheduledReminder(bookingId: string): Promise<void>
}

// イベントハンドラーインターフェース
export interface IEventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>
}

// ドメインサービスインターフェース
export interface IAvailabilityDomainService {
  calculateAvailableSlots(
    date: Date,
    services: ServiceEntity[],
    stylist?: StylistEntity
  ): Promise<TimeSlotEntity[]>

  isSlotAvailable(slot: TimeSlotEntity, existingBookings: BookingEntity[]): boolean
}

export interface IPricingDomainService {
  calculateTotalPrice(services: ServiceEntity[]): number
  calculateTotalDuration(services: ServiceEntity[]): number
  applyDiscount(price: number, discountCode?: string): number
}
