// モックファクトリー - テストで使用する様々なモックデータ生成

import type {
  BookingEntity,
  ServiceEntity,
  StylistEntity,
  CustomerEntity,
  TimeSlotEntity,
  EmailNotificationEntity,
  EmailSettingsEntity
} from '~/types/interfaces'

// === カウンター（一意性確保用） ===
let bookingCounter = 1
let serviceCounter = 1
let stylistCounter = 1
let notificationCounter = 1

// === 基本ファクトリー ===

/**
 * モック顧客エンティティ作成
 */
export const createMockCustomer = (overrides: Partial<CustomerEntity> = {}): CustomerEntity => ({
  name: 'テスト太郎',
  email: 'test@example.com',
  phone: '090-1234-5678',
  notes: '',
  ...overrides
})

/**
 * モック時間スロットエンティティ作成
 */
export const createMockTimeSlot = (overrides: Partial<TimeSlotEntity> = {}): TimeSlotEntity => ({
  time: '14:00',
  endTime: '15:00',
  isAvailable: true,
  duration: 60,
  ...overrides
})

/**
 * モックサービスエンティティ作成
 */
export const createMockService = (overrides: Partial<ServiceEntity> = {}): ServiceEntity => {
  const id = `service${serviceCounter++}`
  return {
    id,
    name: `サービス${id}`,
    description: `${id}の詳細説明`,
    price: 4000,
    duration: 60,
    category: 'basic',
    isActive: true,
    requirements: [],
    ...overrides
  }
}

/**
 * モックスタイリストエンティティ作成
 */
export const createMockStylist = (overrides: Partial<StylistEntity> = {}): StylistEntity => {
  const id = `stylist${stylistCounter++}`
  return {
    id,
    displayName: `スタイリスト${id}`,
    specialties: ['cut', 'color'],
    workingHours: {
      start: '09:00',
      end: '18:00',
      breakStart: '12:00',
      breakEnd: '13:00'
    },
    isActive: true,
    rating: 4.5,
    experience: 5,
    ...overrides
  }
}

/**
 * モック予約エンティティ作成
 */
export const createMockBookingData = (overrides: Partial<BookingEntity> = {}): BookingEntity => {
  const id = `booking${bookingCounter++}`
  const appointmentDate = new Date('2024-01-15T14:00:00')
  
  return {
    id,
    customerInfo: createMockCustomer(),
    services: [createMockService({ id: 'cut', name: 'カット' })],
    stylist: createMockStylist({ id: 'stylist1', displayName: 'スタイリスト A' }),
    appointmentDate,
    timeSlot: createMockTimeSlot(),
    status: 'confirmed',
    totalPrice: 4000,
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }
}

/**
 * モックメール通知エンティティ作成
 */
export const createMockEmailNotification = (overrides: Partial<EmailNotificationEntity> = {}): EmailNotificationEntity => {
  const id = `notification${notificationCounter++}`
  const now = new Date()
  
  return {
    id,
    type: 'confirmation',
    status: 'sent',
    recipientEmail: 'test@example.com',
    bookingId: 'booking1',
    templateData: {
      customerName: 'テスト太郎',
      date: '2024年1月15日',
      time: '14:00',
      services: 'カット',
      salon: 'Beauty Salon'
    },
    retryCount: 0,
    maxRetries: 3,
    sentAt: now,
    createdAt: now,
    updatedAt: now,
    ...overrides
  }
}

/**
 * モックメール設定エンティティ作成
 */
export const createMockEmailSettings = (overrides: Partial<EmailSettingsEntity> = {}): EmailSettingsEntity => ({
  enabled: true,
  confirmationEnabled: true,
  reminderEnabled: true,
  reminderHours: 24,
  template: 'default',
  customTemplate: '',
  ...overrides
})

// === 特殊ファクトリー（業務シナリオ別） ===

/**
 * 複数サービス予約のモック作成
 */
export const createMockMultiServiceBooking = (): BookingEntity => {
  return createMockBookingData({
    services: [
      createMockService({ id: 'cut', name: 'カット', price: 4000, duration: 60 }),
      createMockService({ id: 'color', name: 'カラー', price: 7000, duration: 120 })
    ],
    timeSlot: createMockTimeSlot({ time: '14:00', endTime: '17:00', duration: 180 }),
    totalPrice: 11000
  })
}

/**
 * VIP顧客予約のモック作成
 */
export const createMockVIPBooking = (): BookingEntity => {
  return createMockBookingData({
    customerInfo: createMockCustomer({
      name: 'VIPお客様',
      email: 'vip@example.com',
      notes: 'VIPプラン適用'
    }),
    services: [
      createMockService({ 
        id: 'premium-cut',
        name: 'プレミアムカット',
        price: 8000,
        duration: 90,
        category: 'premium'
      })
    ],
    stylist: createMockStylist({
      id: 'top-stylist',
      displayName: '店長',
      specialties: ['cut', 'color', 'perm'],
      rating: 5.0,
      experience: 15
    }),
    totalPrice: 8000
  })
}

/**
 * キャンセル済み予約のモック作成
 */
export const createMockCancelledBooking = (): BookingEntity => {
  return createMockBookingData({
    status: 'cancelled',
    customerInfo: createMockCustomer({
      name: 'キャンセル太郎',
      email: 'cancelled@example.com'
    }),
    notes: 'お客様都合によりキャンセル'
  })
}

/**
 * 待機中予約のモック作成
 */
export const createMockPendingBooking = (): BookingEntity => {
  return createMockBookingData({
    status: 'pending',
    customerInfo: createMockCustomer({
      name: '待機花子',
      email: 'pending@example.com'
    }),
    appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 明日
  })
}

/**
 * 過去の予約のモック作成
 */
export const createMockPastBooking = (): BookingEntity => {
  const pastDate = new Date()
  pastDate.setDate(pastDate.getDate() - 7) // 1週間前
  
  return createMockBookingData({
    status: 'completed',
    appointmentDate: pastDate,
    customerInfo: createMockCustomer({
      name: '過去田一郎',
      email: 'past@example.com'
    })
  })
}

// === メール通知関連ファクトリー ===

/**
 * 送信失敗メール通知のモック作成
 */
export const createMockFailedEmailNotification = (): EmailNotificationEntity => {
  return createMockEmailNotification({
    status: 'failed',
    retryCount: 3,
    errorMessage: 'SMTP server unavailable',
    lastAttemptAt: new Date(),
    sentAt: undefined
  })
}

/**
 * リマインダーメール通知のモック作成
 */
export const createMockReminderNotification = (): EmailNotificationEntity => {
  return createMockEmailNotification({
    type: 'reminder',
    templateData: {
      customerName: 'リマインダー太郎',
      date: '明日',
      time: '14:00',
      services: 'カット',
      salon: 'Beauty Salon'
    }
  })
}

/**
 * キャンセル通知メールのモック作成
 */
export const createMockCancellationNotification = (): EmailNotificationEntity => {
  return createMockEmailNotification({
    type: 'cancellation',
    templateData: {
      customerName: 'キャンセル太郎',
      date: '2024年1月15日',
      time: '14:00',
      services: 'カット',
      salon: 'Beauty Salon'
    }
  })
}

// === 大量データ生成ファクトリー ===

/**
 * 大量データセットを生成する汎用ファクトリー
 */
export const createLargeDataset = <T>(
  factory: (overrides?: any) => T,
  count: number,
  overridesGenerator?: (index: number) => any
): T[] => {
  return Array.from({ length: count }, (_, index) => {
    const overrides = overridesGenerator ? overridesGenerator(index) : {}
    return factory(overrides)
  })
}

/**
 * 大量サービスデータ生成
 */
export const createLargeServicesList = (count: number = 100): ServiceEntity[] => {
  return createLargeDataset(
    createMockService,
    count,
    (index) => ({
      id: `service${index}`,
      name: `サービス${index}`,
      price: 1000 + (index * 100),
      duration: 30 + (index % 4) * 30, // 30, 60, 90, 120分の循環
      category: ['basic', 'premium', 'specialty'][index % 3]
    })
  )
}

/**
 * 大量スタイリストデータ生成
 */
export const createLargeStylistsList = (count: number = 50): StylistEntity[] => {
  const specialtiesList = [
    ['cut'],
    ['color'],
    ['perm'],
    ['cut', 'color'],
    ['color', 'perm'],
    ['cut', 'perm'],
    ['cut', 'color', 'perm']
  ]
  
  return createLargeDataset(
    createMockStylist,
    count,
    (index) => ({
      id: `stylist${index}`,
      displayName: `スタイリスト${index}`,
      specialties: specialtiesList[index % specialtiesList.length],
      rating: 3.0 + (index % 21) * 0.1, // 3.0-5.0の範囲
      experience: 1 + (index % 20) // 1-20年の経験
    })
  )
}

/**
 * 大量予約データ生成（時系列分散）
 */
export const createLargeBookingsList = (count: number = 1000): BookingEntity[] => {
  const statuses = ['confirmed', 'pending', 'completed', 'cancelled']
  const baseDate = new Date()
  
  return createLargeDataset(
    createMockBookingData,
    count,
    (index) => {
      // 過去30日から未来30日に分散
      const dayOffset = (index % 60) - 30
      const appointmentDate = new Date(baseDate)
      appointmentDate.setDate(baseDate.getDate() + dayOffset)
      
      return {
        id: `booking${index}`,
        customerInfo: createMockCustomer({
          name: `顧客${index}`,
          email: `customer${index}@example.com`,
          phone: `090-${String(index).padStart(4, '0')}-${String(index).padStart(4, '0')}`
        }),
        appointmentDate,
        status: statuses[index % statuses.length],
        totalPrice: 3000 + (index % 10) * 1000
      }
    }
  )
}

// === テスト環境特化ファクトリー ===

/**
 * エラーレスポンス用モック作成
 */
export const createMockErrorResponse = (
  message: string = 'API Error',
  code: string = 'UNKNOWN_ERROR',
  statusCode: number = 500
) => ({
  error: true,
  message,
  code,
  statusCode,
  timestamp: new Date().toISOString()
})

/**
 * 成功レスポンス用モック作成
 */
export const createMockSuccessResponse = <T>(data: T) => ({
  success: true,
  data,
  message: 'Success',
  timestamp: new Date().toISOString()
})

/**
 * ページネーション付きレスポンス用モック作成
 */
export const createMockPaginatedResponse = <T>(
  items: T[],
  page: number = 1,
  limit: number = 20,
  total: number = items.length
) => ({
  success: true,
  data: {
    items: items.slice((page - 1) * limit, page * limit),
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  }
})

// === カスタムファクトリー ===

/**
 * 特定のテストシナリオ用のモック作成
 */
export const createMockForScenario = {
  /**
   * 同時予約競合シナリオ
   */
  concurrentBooking: () => {
    const baseDate = new Date('2024-01-15T14:00:00')
    return [
      createMockBookingData({
        id: 'concurrent1',
        appointmentDate: baseDate,
        customerInfo: createMockCustomer({ name: 'ユーザー1', email: 'user1@example.com' })
      }),
      createMockBookingData({
        id: 'concurrent2',
        appointmentDate: baseDate,
        customerInfo: createMockCustomer({ name: 'ユーザー2', email: 'user2@example.com' })
      })
    ]
  },

  /**
   * メール送信障害シナリオ
   */
  emailFailure: () => ({
    booking: createMockBookingData(),
    failedNotification: createMockFailedEmailNotification(),
    retryAttempts: [
      createMockEmailNotification({ status: 'failed', retryCount: 1 }),
      createMockEmailNotification({ status: 'failed', retryCount: 2 }),
      createMockEmailNotification({ status: 'sent', retryCount: 3 })
    ]
  }),

  /**
   * 高負荷テストシナリオ
   */
  highLoad: () => ({
    services: createLargeServicesList(200),
    stylists: createLargeStylistsList(100),
    bookings: createLargeBookingsList(5000),
    notifications: createLargeDataset(createMockEmailNotification, 2000)
  }),

  /**
   * 環境切り替えシナリオ
   */
  environmentSwitch: () => ({
    development: {
      services: createLargeServicesList(50).map(s => ({ ...s, name: `[DEV] ${s.name}` })),
      bookings: createLargeBookingsList(100)
    },
    production: {
      services: createLargeServicesList(30),
      bookings: createLargeBookingsList(500)
    }
  })
}

// === リセット機能 ===

/**
 * すべてのカウンターをリセット
 */
export const resetMockCounters = () => {
  bookingCounter = 1
  serviceCounter = 1
  stylistCounter = 1
  notificationCounter = 1
}