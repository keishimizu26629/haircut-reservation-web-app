// エンドツーエンドテスト - 完全な予約フロー
// ブラウザ環境での実際のユーザー操作をシミュレート

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import BookingPage from '~/pages/booking.vue'
import AdminDashboard from '~/pages/admin/index.vue'
import EmailSettingsPage from '~/pages/admin/email-settings.vue'
import {
  createMountOptions,
  createMockBookingData,
  createMockService,
  createMockStylist,
  expectElementToHaveText,
  waitForElement,
  mockApiSuccess,
  mockApiError,
  fillFormField,
  submitForm,
  expectSuccessMessage,
  expectErrorMessage
} from '../utils/test-helpers'

// E2Eテスト用の統合モック
const mockBookingApi = {
  getServices: vi.fn(),
  getStylists: vi.fn(),
  getAvailability: vi.fn(),
  createBooking: vi.fn(),
  getBookings: vi.fn(),
  updateBooking: vi.fn(),
  cancelBooking: vi.fn()
}

const mockEmailNotification = {
  sendConfirmationEmail: vi.fn(),
  sendReminderEmail: vi.fn(),
  retryEmail: vi.fn(),
  notifications: ref([]),
  notificationStats: ref({
    total: 0,
    sent: 0,
    failed: 0,
    pending: 0,
    successRate: 100
  }),
  settings: ref({
    enabled: true,
    confirmationEnabled: true,
    reminderEnabled: true,
    reminderHours: 24,
    template: 'default',
    customTemplate: ''
  }),
  saveSettings: vi.fn(),
  getNotificationHistory: vi.fn()
}

const mockFirebaseConfig = {
  currentEnvironment: ref('development'),
  useEmulator: ref(true),
  connectionStatus: ref('connected'),
  lastError: ref(null),
  checkFirebaseConnection: vi.fn(),
  switchEnvironment: vi.fn(),
  toggleEmulatorUsage: vi.fn(),
  getEmulatorInfo: vi.fn()
}

const mockAuth = {
  currentUser: ref({
    uid: 'admin-user',
    email: 'admin@salon.com',
    displayName: 'Admin User'
  }),
  signIn: vi.fn(),
  signOut: vi.fn()
}

// グローバルモック設定
vi.mock('~/composables/useBookingApi', () => ({
  useBookingApi: () => mockBookingApi
}))

vi.mock('~/composables/useEmailNotification', () => ({
  useEmailNotification: () => mockEmailNotification
}))

vi.mock('~/composables/useFirebaseConfig', () => ({
  useFirebaseConfig: () => mockFirebaseConfig
}))

vi.mock('~/composables/useAuth', () => ({
  useAuth: () => mockAuth
}))

describe('エンドツーエンドテスト - 完全予約システムフロー', () => {
  let bookingWrapper: VueWrapper<any>
  let adminWrapper: VueWrapper<any>
  let emailSettingsWrapper: VueWrapper<any>

  const mockServices = [
    createMockService({ id: 'cut', name: 'カット', price: 4000, duration: 60 }),
    createMockService({ id: 'color', name: 'カラー', price: 7000, duration: 120 }),
    createMockService({ id: 'perm', name: 'パーマ', price: 8500, duration: 180 })
  ]

  const mockStylists = [
    createMockStylist({ id: 'stylist1', displayName: 'スタイリスト A', specialties: ['cut', 'color'] }),
    createMockStylist({ id: 'stylist2', displayName: 'スタイリスト B', specialties: ['color', 'perm'] }),
    createMockStylist({ id: 'stylist3', displayName: 'スタイリスト C', specialties: ['cut', 'perm'] })
  ]

  const mockAvailability = {
    date: '2024-01-15',
    availableSlots: [
      { time: '09:00', endTime: '10:00', isAvailable: true, duration: 60 },
      { time: '10:00', endTime: '11:00', isAvailable: true, duration: 60 },
      { time: '11:00', endTime: '12:00', isAvailable: false, duration: 60 },
      { time: '14:00', endTime: '15:00', isAvailable: true, duration: 60 },
      { time: '15:00', endTime: '16:00', isAvailable: true, duration: 60 },
      { time: '16:00', endTime: '17:00', isAvailable: true, duration: 60 }
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // API モックの初期設定
    mockBookingApi.getServices.mockResolvedValue(mockServices)
    mockBookingApi.getStylists.mockResolvedValue(mockStylists)
    mockBookingApi.getAvailability.mockResolvedValue(mockAvailability)
    mockBookingApi.createBooking.mockResolvedValue(mockApiSuccess(createMockBookingData()))
    mockBookingApi.getBookings.mockResolvedValue([])
    
    // メール通知モック設定
    mockEmailNotification.sendConfirmationEmail.mockResolvedValue(true)
    mockEmailNotification.sendReminderEmail.mockResolvedValue(true)
    mockEmailNotification.getNotificationHistory.mockResolvedValue([])
    mockEmailNotification.saveSettings.mockResolvedValue(true)
    
    // Firebase設定モック
    mockFirebaseConfig.checkFirebaseConnection.mockResolvedValue(true)
    mockFirebaseConfig.getEmulatorInfo.mockReturnValue({
      auth: 'http://localhost:9099',
      firestore: 'localhost:8080',
      storage: 'localhost:9199',
      functions: 'localhost:5001'
    })
  })

  afterEach(() => {
    if (bookingWrapper) bookingWrapper.unmount()
    if (adminWrapper) adminWrapper.unmount()
    if (emailSettingsWrapper) emailSettingsWrapper.unmount()
  })

  describe('完全予約フロー - ユーザー視点', () => {
    it('予約作成から確認メール送信まで完全フロー', async () => {
      // === 1. 予約ページ初期化 ===
      bookingWrapper = mount(BookingPage, createMountOptions())
      await bookingWrapper.vm.$nextTick()

      // サービス読み込み確認
      expect(mockBookingApi.getServices).toHaveBeenCalled()
      
      // === 2. サービス選択（複数選択） ===
      const cutCheckbox = bookingWrapper.find('input[value="cut"]')
      const colorCheckbox = bookingWrapper.find('input[value="color"]')
      
      await cutCheckbox.setValue(true)
      await colorCheckbox.setValue(true)
      
      // 合計金額計算確認
      const totalPrice = bookingWrapper.find('[data-testid="total-price"]')
      expectElementToHaveText(totalPrice.element, '11,000円') // 4000 + 7000

      const nextButton1 = bookingWrapper.find('[data-testid="next-button"]')
      await nextButton1.trigger('click')

      // === 3. スタイリスト選択 ===
      expect(mockBookingApi.getStylists).toHaveBeenCalled()
      
      // カット・カラー両方できるスタイリストが推奨されることを確認
      const recommendedStylist = bookingWrapper.find('[data-testid="recommended-stylist"]')
      expectElementToHaveText(recommendedStylist.element, 'スタイリスト A')

      const stylistRadio = bookingWrapper.find('input[value="stylist1"]')
      await stylistRadio.setValue(true)

      const nextButton2 = bookingWrapper.find('[data-testid="next-button"]')
      await nextButton2.trigger('click')

      // === 4. 日時選択 ===
      expect(mockBookingApi.getAvailability).toHaveBeenCalledWith(
        expect.objectContaining({
          services: ['cut', 'color'],
          stylistId: 'stylist1',
          duration: 180 // カット60分 + カラー120分
        })
      )

      // 日付選択
      const dateButton = bookingWrapper.find('[data-date="2024-01-15"]')
      await dateButton.trigger('click')

      // 利用可能時間スロット確認（180分必要なので連続した3時間必要）
      const availableSlots = bookingWrapper.findAll('[data-testid="available-slot"]')
      expect(availableSlots.length).toBeGreaterThan(0)

      // 14:00開始スロット選択（14:00-17:00の3時間）
      const timeSlot = bookingWrapper.find('[data-time="14:00"]')
      await timeSlot.trigger('click')

      const nextButton3 = bookingWrapper.find('[data-testid="next-button"]')
      await nextButton3.trigger('click')

      // === 5. 顧客情報入力 ===
      await fillFormField(bookingWrapper, '#customer-name', 'テスト花子')
      await fillFormField(bookingWrapper, '#customer-email', 'hanako@example.com')
      await fillFormField(bookingWrapper, '#customer-phone', '090-9876-5432')
      await fillFormField(bookingWrapper, '#customer-notes', '初回利用です。よろしくお願いします。')

      // 確認画面表示確認
      const confirmationData = {
        services: ['カット', 'カラー'],
        stylist: 'スタイリスト A',
        date: '2024年1月15日',
        time: '14:00-17:00',
        total: '11,000円'
      }

      Object.entries(confirmationData).forEach(([key, value]) => {
        const element = bookingWrapper.find(`[data-testid="confirm-${key}"]`)
        if (Array.isArray(value)) {
          value.forEach(item => {
            expectElementToHaveText(element.element, item)
          })
        } else {
          expectElementToHaveText(element.element, value)
        }
      })

      // === 6. 予約確定 ===
      const submitButton = bookingWrapper.find('[data-testid="submit-button"]')
      await submitButton.trigger('click')

      // バックエンドAPI呼び出し確認
      expect(mockBookingApi.createBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          services: expect.arrayContaining([
            expect.objectContaining({ id: 'cut', name: 'カット' }),
            expect.objectContaining({ id: 'color', name: 'カラー' })
          ]),
          stylist: expect.objectContaining({ id: 'stylist1' }),
          customerInfo: expect.objectContaining({
            name: 'テスト花子',
            email: 'hanako@example.com',
            phone: '090-9876-5432'
          }),
          timeSlot: expect.objectContaining({
            time: '14:00',
            endTime: '17:00'
          }),
          totalPrice: 11000
        })
      )

      // === 7. 確認メール送信 ===
      await bookingWrapper.vm.$nextTick()
      expect(mockEmailNotification.sendConfirmationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          customerInfo: expect.objectContaining({
            email: 'hanako@example.com'
          })
        })
      )

      // === 8. 完了画面表示 ===
      const completionMessage = await waitForElement(
        bookingWrapper.element,
        '[data-testid="completion-message"]'
      )
      expect(completionMessage).toBeTruthy()
      expectElementToHaveText(completionMessage, 'ご予約が完了しました')

      // メール送信状況表示
      const emailStatus = bookingWrapper.find('[data-testid="email-notification-status"]')
      expect(emailStatus.exists()).toBe(true)
      expectElementToHaveText(emailStatus.element, 'メール送信完了')

      // 予約詳細情報表示
      const bookingDetails = bookingWrapper.find('[data-testid="booking-details"]')
      expect(bookingDetails.exists()).toBe(true)
      expectElementToHaveText(bookingDetails.element, 'テスト花子')
      expectElementToHaveText(bookingDetails.element, '2024年1月15日')
      expectElementToHaveText(bookingDetails.element, '14:00-17:00')
    })

    it('予約エラー時のユーザーフィードバック完全フロー', async () => {
      // API エラーをシミュレート
      mockBookingApi.createBooking.mockRejectedValue(new Error('予約がいっぱいです'))
      
      bookingWrapper = mount(BookingPage, createMountOptions())
      
      // 予約フロー実行（簡略版）
      await this.executeQuickBookingFlow(bookingWrapper)

      // エラーメッセージ表示確認
      const errorMessage = await waitForElement(
        bookingWrapper.element,
        '[data-testid="booking-error"]'
      )
      expect(errorMessage).toBeTruthy()
      expectElementToHaveText(errorMessage, '予約がいっぱいです')

      // 再試行ボタン表示確認
      const retryButton = bookingWrapper.find('[data-testid="retry-button"]')
      expect(retryButton.exists()).toBe(true)

      // 再試行実行
      mockBookingApi.createBooking.mockResolvedValue(mockApiSuccess(createMockBookingData()))
      await retryButton.trigger('click')

      // 再試行成功確認
      expect(mockBookingApi.createBooking).toHaveBeenCalledTimes(2)
      
      const successMessage = await waitForElement(
        bookingWrapper.element,
        '[data-testid="completion-message"]'
      )
      expect(successMessage).toBeTruthy()
    })
  })

  describe('管理者フロー - メール設定管理', () => {
    it('管理者がメール設定を変更して予約フローに反映される完全フロー', async () => {
      // === 1. 管理者ダッシュボード初期化 ===
      adminWrapper = mount(AdminDashboard, createMountOptions())
      await adminWrapper.vm.$nextTick()

      // ダッシュボード統計確認
      const stats = adminWrapper.find('[data-testid="dashboard-stats"]')
      expect(stats.exists()).toBe(true)

      // === 2. メール設定ページ遷移 ===
      const emailSettingsLink = adminWrapper.find('[data-testid="email-settings-link"]')
      await emailSettingsLink.trigger('click')

      emailSettingsWrapper = mount(EmailSettingsPage, createMountOptions())
      await emailSettingsWrapper.vm.$nextTick()

      // === 3. 現在設定確認 ===
      const enabledSwitch = emailSettingsWrapper.find('#email-enabled') as any
      expect(enabledSwitch.element.checked).toBe(true)

      const confirmationSwitch = emailSettingsWrapper.find('#confirmation-enabled') as any
      expect(confirmationSwitch.element.checked).toBe(true)

      // === 4. 設定変更 ===
      // リマインダーを有効化
      const reminderSwitch = emailSettingsWrapper.find('#reminder-enabled')
      await reminderSwitch.setValue(true)

      // リマインダー時間を48時間に変更
      const reminderHoursSelect = emailSettingsWrapper.find('select[v-model="localSettings.reminderHours"]')
      await reminderHoursSelect.setValue(48)

      // カスタムテンプレート使用に変更
      const templateSelect = emailSettingsWrapper.find('select[v-model="localSettings.template"]')
      await templateSelect.setValue('custom')

      // カスタムテンプレート入力
      const customTemplateTextarea = emailSettingsWrapper.find('.custom-template textarea')
      await customTemplateTextarea.setValue(`
        {customerName}様

        ご予約ありがとうございます。
        
        予約詳細：
        日時: {date} {time}
        サービス: {services}
        
        {salon}でお待ちしております。
      `)

      // === 5. テストメール送信 ===
      const testEmailInput = emailSettingsWrapper.find('input[v-model="testEmail"]')
      await testEmailInput.setValue('test@example.com')

      const testSendButton = emailSettingsWrapper.find('.btn-outline-primary')
      await testSendButton.trigger('click')

      // テスト送信API呼び出し確認
      await emailSettingsWrapper.vm.$nextTick()
      expectSuccessMessage(emailSettingsWrapper, 'テストメールを送信しました')

      // === 6. 設定保存 ===
      const saveButton = emailSettingsWrapper.find('.btn-primary')
      await saveButton.trigger('click')

      expect(mockEmailNotification.saveSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          reminderEnabled: true,
          reminderHours: 48,
          template: 'custom',
          customTemplate: expect.stringContaining('{customerName}様')
        })
      )

      expectSuccessMessage(emailSettingsWrapper, '設定を保存しました')

      // === 7. 新しい設定での予約テスト ===
      // 設定更新をシミュレート
      mockEmailNotification.settings.value = {
        enabled: true,
        confirmationEnabled: true,
        reminderEnabled: true,
        reminderHours: 48,
        template: 'custom',
        customTemplate: customTemplateTextarea.element.value
      }

      // 新しい予約を作成
      bookingWrapper = mount(BookingPage, createMountOptions())
      await this.executeQuickBookingFlow(bookingWrapper)

      // 新しい設定でメール送信されることを確認
      expect(mockEmailNotification.sendConfirmationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          templateData: expect.objectContaining({
            customerName: expect.any(String),
            date: expect.any(String),
            time: expect.any(String)
          })
        })
      )
    })

    it('Firebase環境切り替えと予約フロー連携完全テスト', async () => {
      // === 1. 管理者ダッシュボード初期化（開発環境） ===
      adminWrapper = mount(AdminDashboard, createMountOptions())
      await adminWrapper.vm.$nextTick()

      // 環境状態確認
      const environmentBadge = adminWrapper.find('[data-testid="environment-badge"]')
      expectElementToHaveText(environmentBadge.element, 'DEVELOPMENT')

      // エミュレーター情報確認
      const emulatorInfo = adminWrapper.find('[data-testid="emulator-info"]')
      expect(emulatorInfo.exists()).toBe(true)

      // === 2. 開発環境での予約作成 ===
      bookingWrapper = mount(BookingPage, createMountOptions())
      
      // 開発環境設定確認
      expect(mockFirebaseConfig.currentEnvironment.value).toBe('development')
      expect(mockFirebaseConfig.useEmulator.value).toBe(true)

      await this.executeQuickBookingFlow(bookingWrapper)

      // 開発環境でのAPI呼び出し確認
      expect(mockBookingApi.createBooking).toHaveBeenCalled()
      expect(mockEmailNotification.sendConfirmationEmail).toHaveBeenCalled()

      bookingWrapper.unmount()

      // === 3. 本番環境への切り替え ===
      const environmentSwitcher = adminWrapper.find('[data-testid="environment-switcher"]')
      const prodRadio = environmentSwitcher.find('#env-prod')
      await prodRadio.setValue(true)

      // 未保存変更警告確認
      const warningAlert = adminWrapper.find('.alert-warning')
      expect(warningAlert.exists()).toBe(true)

      // リロード実行（モック）
      const mockReload = vi.fn()
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true
      })

      const reloadButton = adminWrapper.find('.btn-warning')
      await reloadButton.trigger('click')
      expect(mockReload).toHaveBeenCalled()

      // 本番環境設定で再初期化をシミュレート
      mockFirebaseConfig.currentEnvironment.value = 'production'
      mockFirebaseConfig.useEmulator.value = false

      // === 4. 本番環境での予約作成 ===
      bookingWrapper = mount(BookingPage, createMountOptions())
      
      // 本番環境設定確認
      expect(mockFirebaseConfig.currentEnvironment.value).toBe('production')
      expect(mockFirebaseConfig.useEmulator.value).toBe(false)

      await this.executeQuickBookingFlow(bookingWrapper)

      // 本番環境でのAPI呼び出し確認
      expect(mockBookingApi.createBooking).toHaveBeenCalledTimes(2) // 開発 + 本番
      expect(mockEmailNotification.sendConfirmationEmail).toHaveBeenCalledTimes(2)

      // === 5. 環境間データ分離確認 ===
      // 本番環境では異なるデータセットが使用されることを確認
      expect(mockBookingApi.getServices).toHaveBeenCalledTimes(2) // 各環境で1回ずつ
    })
  })

  describe('エラー回復フロー', () => {
    it('ネットワークエラーから予約完了までの回復フロー', async () => {
      // === 1. 初期ネットワークエラー ===
      mockBookingApi.getServices.mockRejectedValue(new Error('Network Error'))
      
      bookingWrapper = mount(BookingPage, createMountOptions())
      await bookingWrapper.vm.$nextTick()

      // エラー表示確認
      const networkError = await waitForElement(
        bookingWrapper.element,
        '[data-testid="network-error"]'
      )
      expect(networkError).toBeTruthy()

      // === 2. 再試行ボタン表示 ===
      const retryButton = bookingWrapper.find('[data-testid="retry-network"]')
      expect(retryButton.exists()).toBe(true)

      // === 3. ネットワーク回復シミュレート ===
      mockBookingApi.getServices.mockResolvedValue(mockServices)
      await retryButton.trigger('click')

      // サービス読み込み成功確認
      await bookingWrapper.vm.$nextTick()
      const servicesList = bookingWrapper.find('[data-testid="services-list"]')
      expect(servicesList.exists()).toBe(true)

      // === 4. 途中でのメール送信エラー ===
      mockEmailNotification.sendConfirmationEmail.mockRejectedValue(new Error('Email Service Unavailable'))
      
      await this.executeQuickBookingFlow(bookingWrapper)

      // 予約は成功、メール送信のみ失敗
      const partialSuccessMessage = await waitForElement(
        bookingWrapper.element,
        '[data-testid="partial-success"]'
      )
      expect(partialSuccessMessage).toBeTruthy()
      expectElementToHaveText(partialSuccessMessage, '予約は完了しましたが、確認メールの送信に失敗しました')

      // === 5. メール再送信 ===
      mockEmailNotification.sendConfirmationEmail.mockResolvedValue(true)
      
      const resendEmailButton = bookingWrapper.find('[data-testid="resend-email"]')
      await resendEmailButton.trigger('click')

      // 再送信成功確認
      expectSuccessMessage(bookingWrapper, '確認メールを再送信しました')
    })

    it('Firebase接続エラーからの回復完全フロー', async () => {
      // === 1. Firebase接続エラー ===
      mockFirebaseConfig.connectionStatus.value = 'error'
      mockFirebaseConfig.lastError.value = 'Firebase接続に失敗しました'
      mockFirebaseConfig.checkFirebaseConnection.mockResolvedValue(false)

      adminWrapper = mount(AdminDashboard, createMountOptions())
      await adminWrapper.vm.$nextTick()

      // エラー状態表示確認
      const connectionError = adminWrapper.find('[data-testid="firebase-error"]')
      expect(connectionError.exists()).toBe(true)
      expectElementToHaveText(connectionError.element, 'Firebase接続に失敗しました')

      // === 2. 予約ページでのエラー表示 ===
      bookingWrapper = mount(BookingPage, createMountOptions())
      
      const firebaseWarning = bookingWrapper.find('[data-testid="firebase-connection-warning"]')
      expect(firebaseWarning.exists()).toBe(true)

      // === 3. 管理者による接続回復 ===
      const testConnectionButton = adminWrapper.find('[data-testid="test-connection"]')
      
      // 接続回復をシミュレート
      mockFirebaseConfig.connectionStatus.value = 'connected'
      mockFirebaseConfig.lastError.value = null
      mockFirebaseConfig.checkFirebaseConnection.mockResolvedValue(true)
      
      await testConnectionButton.trigger('click')

      // 接続成功確認
      await adminWrapper.vm.$nextTick()
      const connectionSuccess = adminWrapper.find('[data-testid="connection-success"]')
      expect(connectionSuccess.exists()).toBe(true)

      // === 4. 予約フロー正常動作確認 ===
      bookingWrapper.unmount()
      bookingWrapper = mount(BookingPage, createMountOptions())

      // Firebase警告が消えることを確認
      const warningAfterRecovery = bookingWrapper.find('[data-testid="firebase-connection-warning"]')
      expect(warningAfterRecovery.exists()).toBe(false)

      // 正常な予約フロー実行
      await this.executeQuickBookingFlow(bookingWrapper)
      
      expect(mockBookingApi.createBooking).toHaveBeenCalled()
      expect(mockEmailNotification.sendConfirmationEmail).toHaveBeenCalled()
    })
  })

  describe('パフォーマンステスト', () => {
    it('大量データでの完全フローパフォーマンス', async () => {
      // 大量のサービス・スタイリストデータ
      const largeServices = Array.from({ length: 100 }, (_, i) =>
        createMockService({ id: `service${i}`, name: `サービス${i}`, price: 1000 + i * 100 })
      )
      const largeStylists = Array.from({ length: 50 }, (_, i) =>
        createMockStylist({ id: `stylist${i}`, displayName: `スタイリスト${i}` })
      )

      mockBookingApi.getServices.mockResolvedValue(largeServices)
      mockBookingApi.getStylists.mockResolvedValue(largeStylists)

      const startTime = performance.now()
      
      bookingWrapper = mount(BookingPage, createMountOptions())
      await bookingWrapper.vm.$nextTick()

      // 大量データでも初期レンダリングが適切な時間内に完了
      const renderTime = performance.now() - startTime
      expect(renderTime).toBeLessThan(2000) // 2秒以内

      // フィルタリング機能のパフォーマンス
      const searchInput = bookingWrapper.find('[data-testid="service-search"]')
      
      const searchStartTime = performance.now()
      await searchInput.setValue('サービス1')
      await bookingWrapper.vm.$nextTick()
      const searchTime = performance.now() - searchStartTime
      
      expect(searchTime).toBeLessThan(500) // 500ms以内
    })
  })

  // ヘルパーメソッド
  async function executeQuickBookingFlow(wrapper: VueWrapper<any>) {
    // サービス選択
    const serviceCheckbox = wrapper.find('input[value="cut"]')
    await serviceCheckbox.setValue(true)
    let nextButton = wrapper.find('[data-testid="next-button"]')
    await nextButton.trigger('click')

    // スタイリスト選択
    const stylistRadio = wrapper.find('input[value="stylist1"]')
    await stylistRadio.setValue(true)
    nextButton = wrapper.find('[data-testid="next-button"]')
    await nextButton.trigger('click')

    // 日時選択
    const dateButton = wrapper.find('[data-date="2024-01-15"]')
    await dateButton.trigger('click')
    const timeSlot = wrapper.find('[data-time="14:00"]')
    await timeSlot.trigger('click')
    nextButton = wrapper.find('[data-testid="next-button"]')
    await nextButton.trigger('click')

    // 顧客情報入力
    await fillFormField(wrapper, '#customer-name', 'テスト太郎')
    await fillFormField(wrapper, '#customer-email', 'test@example.com')
    await fillFormField(wrapper, '#customer-phone', '090-1234-5678')

    // 予約確定
    const submitButton = wrapper.find('[data-testid="submit-button"]')
    await submitButton.trigger('click')
    await wrapper.vm.$nextTick()
  }
})