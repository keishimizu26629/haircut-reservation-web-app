// EmailNotification ユースケース層実装

import type {
  IEmailNotificationUseCase,
  IEmailNotificationRepository,
  IEmailNotificationFactory,
  EmailNotificationEntity,
  EmailSettingsEntity,
  BookingEntity,
  ValidationError,
  DomainError
} from '~/types/interfaces'

export class EmailNotificationUseCase implements IEmailNotificationUseCase {
  constructor(
    private readonly repository: IEmailNotificationRepository,
    private readonly factory: IEmailNotificationFactory
  ) {}

  async sendConfirmationEmail(bookingData: BookingEntity): Promise<boolean> {
    // 1. ビジネスルール検証
    this.validateBookingData(bookingData)
    
    // 2. 設定確認
    const settings = await this.repository.getSettings()
    if (!settings.enabled || !settings.confirmationEnabled) {
      throw new DomainError(
        'Confirmation email is disabled',
        'EMAIL_DISABLED'
      )
    }

    // 3. エンティティ作成
    const notification = this.factory.createConfirmationNotification(bookingData)
    
    // 4. 送信実行
    try {
      const success = await this.repository.send(notification)
      
      if (success) {
        // ドメインイベント発行（実装予定）
        // this.eventPublisher.publish(new EmailSentEvent(...))
      }
      
      return success
    } catch (error) {
      throw new DomainError(
        'Failed to send confirmation email',
        'SEND_FAILED',
        error
      )
    }
  }

  async sendReminderEmail(bookingData: BookingEntity): Promise<boolean> {
    // 1. ビジネスルール検証
    this.validateBookingData(bookingData)
    this.validateReminderTiming(bookingData)
    
    // 2. 設定確認
    const settings = await this.repository.getSettings()
    if (!settings.enabled || !settings.reminderEnabled) {
      throw new DomainError(
        'Reminder email is disabled',
        'EMAIL_DISABLED'
      )
    }

    // 3. エンティティ作成
    const notification = this.factory.createReminderNotification(bookingData)
    
    // 4. 送信実行
    try {
      return await this.repository.send(notification)
    } catch (error) {
      throw new DomainError(
        'Failed to send reminder email',
        'SEND_FAILED',
        error
      )
    }
  }

  async retryFailedEmail(notificationId: string): Promise<boolean> {
    // 1. 入力値検証
    if (!notificationId) {
      throw new ValidationError('Notification ID is required')
    }

    // 2. 再送信実行
    try {
      return await this.repository.retry(notificationId)
    } catch (error) {
      throw new DomainError(
        'Failed to retry email',
        'RETRY_FAILED',
        error
      )
    }
  }

  async getNotificationHistory(bookingId?: string): Promise<EmailNotificationEntity[]> {
    try {
      return await this.repository.getHistory(bookingId)
    } catch (error) {
      throw new DomainError(
        'Failed to get notification history',
        'HISTORY_FAILED',
        error
      )
    }
  }

  async updateSettings(settings: Partial<EmailSettingsEntity>): Promise<boolean> {
    // 1. 設定値検証
    this.validateSettings(settings)
    
    // 2. 設定保存
    try {
      return await this.repository.saveSettings(settings)
    } catch (error) {
      throw new DomainError(
        'Failed to update settings',
        'SETTINGS_UPDATE_FAILED',
        error
      )
    }
  }

  // プライベートメソッド
  private validateBookingData(bookingData: BookingEntity): void {
    const errors: string[] = []

    if (!bookingData.customerInfo?.email) {
      errors.push('Customer email is required')
    }

    if (!bookingData.appointmentDate) {
      errors.push('Appointment date is required')
    }

    if (!bookingData.services || bookingData.services.length === 0) {
      errors.push('At least one service is required')
    }

    // メールアドレス形式検証
    if (bookingData.customerInfo?.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(bookingData.customerInfo.email)) {
        errors.push('Invalid email format')
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(
        'Booking data validation failed',
        { errors }
      )
    }
  }

  private validateReminderTiming(bookingData: BookingEntity): void {
    const appointmentDate = new Date(bookingData.appointmentDate)
    const now = new Date()
    
    // 過去の予約にはリマインダーを送信しない
    if (appointmentDate <= now) {
      throw new DomainError(
        'Cannot send reminder for past appointments',
        'INVALID_TIMING'
      )
    }

    // 予約時間まで1時間を切っている場合は送信しない
    const oneHourBefore = new Date(appointmentDate.getTime() - 60 * 60 * 1000)
    if (now >= oneHourBefore) {
      throw new DomainError(
        'Too close to appointment time',
        'INVALID_TIMING'
      )
    }
  }

  private validateSettings(settings: Partial<EmailSettingsEntity>): void {
    const errors: string[] = []

    // リマインダー時間の検証
    if (settings.reminderHours !== undefined) {
      if (settings.reminderHours < 1 || settings.reminderHours > 72) {
        errors.push('Reminder hours must be between 1 and 72')
      }
    }

    // カスタムテンプレートの検証
    if (settings.template === 'custom' && !settings.customTemplate) {
      errors.push('Custom template content is required when using custom template')
    }

    if (settings.customTemplate) {
      // 必要な変数が含まれているかチェック
      const requiredVariables = ['{customerName}', '{date}', '{time}']
      const missingVariables = requiredVariables.filter(
        variable => !settings.customTemplate!.includes(variable)
      )
      
      if (missingVariables.length > 0) {
        errors.push(`Custom template must include: ${missingVariables.join(', ')}`)
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(
        'Settings validation failed',
        { errors }
      )
    }
  }
}

// ファクトリー実装
export class EmailNotificationFactory implements IEmailNotificationFactory {
  createConfirmationNotification(bookingData: BookingEntity): EmailNotificationEntity {
    const now = new Date()
    
    return {
      id: this.generateId(),
      type: 'confirmation',
      status: 'pending',
      recipientEmail: bookingData.customerInfo.email,
      bookingId: bookingData.id || '',
      templateData: {
        customerName: bookingData.customerInfo.name,
        date: this.formatDate(bookingData.appointmentDate),
        time: bookingData.timeSlot.time,
        services: bookingData.services.map(s => s.name).join(', '),
        totalPrice: bookingData.totalPrice,
        salon: 'Beauty Salon' // TODO: テナント情報から取得
      },
      retryCount: 0,
      maxRetries: 3,
      createdAt: now,
      updatedAt: now
    }
  }

  createReminderNotification(bookingData: BookingEntity): EmailNotificationEntity {
    const now = new Date()
    
    return {
      id: this.generateId(),
      type: 'reminder',
      status: 'pending',
      recipientEmail: bookingData.customerInfo.email,
      bookingId: bookingData.id || '',
      templateData: {
        customerName: bookingData.customerInfo.name,
        date: this.formatDate(bookingData.appointmentDate),
        time: bookingData.timeSlot.time,
        services: bookingData.services.map(s => s.name).join(', '),
        salon: 'Beauty Salon'
      },
      retryCount: 0,
      maxRetries: 3,
      createdAt: now,
      updatedAt: now
    }
  }

  createCancellationNotification(bookingData: BookingEntity): EmailNotificationEntity {
    const now = new Date()
    
    return {
      id: this.generateId(),
      type: 'cancellation',
      status: 'pending',
      recipientEmail: bookingData.customerInfo.email,
      bookingId: bookingData.id || '',
      templateData: {
        customerName: bookingData.customerInfo.name,
        date: this.formatDate(bookingData.appointmentDate),
        time: bookingData.timeSlot.time,
        salon: 'Beauty Salon'
      },
      retryCount: 0,
      maxRetries: 3,
      createdAt: now,
      updatedAt: now
    }
  }

  private generateId(): string {
    return `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }).format(date)
  }
}