// エンドツーエンドテスト - システム信頼性・パフォーマンス
// 実際の運用環境で発生する可能性のある問題とその対処をテスト

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import BookingPage from '~/pages/booking.vue'
import AdminDashboard from '~/pages/admin/index.vue'
import EmailSettingsPage from '~/pages/admin/email-settings.vue'
import EnvironmentSwitcher from '~/components/Admin/EnvironmentSwitcher.vue'
import {
  createMountOptions,
  createMockBookingData,
  createMockService,
  createMockStylist,
  expectElementToHaveText,
  expectElementToHaveClass,
  waitForElement,
  mockApiSuccess,
  mockApiError,
  fillFormField,
  submitForm,
  expectSuccessMessage,
  expectErrorMessage,
  queryByTestId,
  simulateNetworkDelay,
  simulateMemoryLeak,
  createLargeDataset
} from '../utils/test-helpers'

// システム信頼性テスト用モック
const mockBookingApi = {
  getServices: vi.fn(),
  getStylists: vi.fn(),
  getAvailability: vi.fn(),
  createBooking: vi.fn(),
  getBookings: vi.fn(),
  updateBooking: vi.fn(),
  cancelBooking: vi.fn(),
  getBookingStats: vi.fn(),
  exportBookings: vi.fn(),
  healthCheck: vi.fn()
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
  getNotificationHistory: vi.fn(),
  sendTestEmail: vi.fn(),
  bulkRetry: vi.fn(),
  healthCheck: vi.fn()
}

const mockFirebaseConfig = {
  currentEnvironment: ref('development'),
  useEmulator: ref(true),
  connectionStatus: ref('connected'),
  lastError: ref(null),
  checkFirebaseConnection: vi.fn(),
  switchEnvironment: vi.fn(),
  toggleEmulatorUsage: vi.fn(),
  getEmulatorInfo: vi.fn(),
  reconnect: vi.fn(),
  getConnectionLatency: vi.fn()
}

const mockAuth = {
  currentUser: ref({
    uid: 'test-user',
    email: 'user@example.com',
    displayName: 'Test User'
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
  refreshToken: vi.fn(),
  checkConnectionHealth: vi.fn()
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

describe('システム信頼性 E2Eテスト', () => {
  let bookingWrapper: VueWrapper<any>
  let adminWrapper: VueWrapper<any>
  let emailSettingsWrapper: VueWrapper<any>
  let environmentWrapper: VueWrapper<any>

  // 大量データセット
  const largeServicesList = createLargeDataset(createMockService, 100)
  const largeStylistsList = createLargeDataset(createMockStylist, 50)
  const largeBookingsList = createLargeDataset(createMockBookingData, 1000)

  beforeEach(() => {
    vi.clearAllMocks()
    
    // 基本API設定
    mockBookingApi.getServices.mockResolvedValue(largeServicesList.slice(0, 10))
    mockBookingApi.getStylists.mockResolvedValue(largeStylistsList.slice(0, 5))
    mockBookingApi.getBookings.mockResolvedValue(largeBookingsList.slice(0, 20))
    mockBookingApi.createBooking.mockResolvedValue(mockApiSuccess(createMockBookingData()))
    mockBookingApi.healthCheck.mockResolvedValue({ status: 'healthy', responseTime: 120 })
    
    // メール通知設定
    mockEmailNotification.sendConfirmationEmail.mockResolvedValue(true)
    mockEmailNotification.healthCheck.mockResolvedValue({ status: 'healthy', queueSize: 5 })
    
    // Firebase設定
    mockFirebaseConfig.checkFirebaseConnection.mockResolvedValue(true)
    mockFirebaseConfig.getConnectionLatency.mockResolvedValue(85)
    mockFirebaseConfig.getEmulatorInfo.mockReturnValue({
      auth: 'http://localhost:9099',
      firestore: 'localhost:8080',
      storage: 'localhost:9199',
      functions: 'localhost:5001'
    })
    
    // 認証設定
    mockAuth.checkConnectionHealth.mockResolvedValue(true)
  })

  afterEach(() => {
    if (bookingWrapper) bookingWrapper.unmount()
    if (adminWrapper) adminWrapper.unmount()
    if (emailSettingsWrapper) emailSettingsWrapper.unmount()
    if (environmentWrapper) environmentWrapper.unmount()
  })

  describe('ネットワーク信頼性テスト', () => {
    it('断続的なネットワーク切断に対する復旧力テスト', async () => {
      bookingWrapper = mount(BookingPage, createMountOptions())

      // === 1. 初期接続成功 ===
      await bookingWrapper.vm.$nextTick()
      expect(mockBookingApi.getServices).toHaveBeenCalled()

      // === 2. 第1回ネットワーク切断をシミュレート ===
      mockBookingApi.getStylists.mockRejectedValue(new Error('Network timeout'))
      
      const serviceCheckbox = bookingWrapper.find('input[value="cut"]')
      await serviceCheckbox.setValue(true)
      
      const nextButton = bookingWrapper.find('[data-testid="next-button"]')
      await nextButton.trigger('click')

      // ネットワークエラーが表示される
      const networkError = await waitForElement(
        bookingWrapper.element,
        '[data-testid="network-error"]'
      )
      expect(networkError).toBeTruthy()
      expectElementToHaveText(networkError, 'ネットワーク接続エラーが発生しました')

      // === 3. 自動再試行メカニズム ===
      // 3秒後に自動復旧をシミュレート
      setTimeout(() => {
        mockBookingApi.getStylists.mockResolvedValue(largeStylistsList.slice(0, 5))
      }, 3000)

      // 再試行ボタンまたは自動再試行
      const retryButton = bookingWrapper.find('[data-testid="retry-button"]')
      if (retryButton.exists()) {
        await retryButton.trigger('click')
      }

      // 復旧確認
      await waitForElement(bookingWrapper.element, '[data-testid="stylists-list"]', 5000)
      const stylistsList = bookingWrapper.find('[data-testid="stylists-list"]')
      expect(stylistsList.exists()).toBe(true)

      // === 4. 第2回ネットワーク切断（予約作成時） ===
      // 予約フロー完了まで進行
      const stylistRadio = bookingWrapper.find('input[value="stylist1"]')
      await stylistRadio.setValue(true)
      await bookingWrapper.find('[data-testid="next-button"]').trigger('click')

      // 日時選択
      const dateButton = bookingWrapper.find('[data-date="2024-01-15"]')
      await dateButton.trigger('click')
      const timeSlot = bookingWrapper.find('[data-time="14:00"]')
      await timeSlot.trigger('click')
      await bookingWrapper.find('[data-testid="next-button"]').trigger('click')

      // 顧客情報入力
      await fillFormField(bookingWrapper, '#customer-name', 'テスト太郎')
      await fillFormField(bookingWrapper, '#customer-email', 'test@example.com')
      await fillFormField(bookingWrapper, '#customer-phone', '090-1234-5678')

      // 予約作成時にネットワークエラー
      mockBookingApi.createBooking.mockRejectedValueOnce(new Error('Connection reset'))
      
      const submitButton = bookingWrapper.find('[data-testid="submit-button"]')
      await submitButton.trigger('click')

      // === 5. 重要データの保存と復旧 ===
      // 入力データが保持されていることを確認
      const customerName = bookingWrapper.find('#customer-name') as any
      expect(customerName.element.value).toBe('テスト太郎')

      // 再試行で成功
      mockBookingApi.createBooking.mockResolvedValue(mockApiSuccess(createMockBookingData()))
      
      const retryBookingButton = bookingWrapper.find('[data-testid="retry-booking-button"]')
      await retryBookingButton.trigger('click')

      // 最終的な成功確認
      const completionMessage = await waitForElement(
        bookingWrapper.element,
        '[data-testid="completion-message"]'
      )
      expect(completionMessage).toBeTruthy()
    })

    it('高レイテンシー環境での操作性テスト', async () => {
      // 高レイテンシーをシミュレート（2-5秒の遅延）
      const addNetworkDelay = (mockFn: any, delay: number) => {
        return mockFn.mockImplementation((...args: any[]) => 
          simulateNetworkDelay(delay).then(() => mockApiSuccess({}))
        )
      }

      addNetworkDelay(mockBookingApi.getServices, 3000)
      addNetworkDelay(mockBookingApi.getStylists, 4000)
      addNetworkDelay(mockBookingApi.getAvailability, 2500)

      const startTime = performance.now()
      bookingWrapper = mount(BookingPage, createMountOptions())

      // === 1. 初期ローディング状態 ===
      const loadingIndicator = bookingWrapper.find('[data-testid="loading-services"]')
      expect(loadingIndicator.exists()).toBe(true)
      expectElementToHaveText(loadingIndicator.element, '読み込み中...')

      // プログレスバーの確認
      const progressBar = bookingWrapper.find('[data-testid="loading-progress"]')
      expect(progressBar.exists()).toBe(true)

      // === 2. 段階的ローディング ===
      await waitForElement(bookingWrapper.element, '[data-testid="services-list"]', 4000)
      const servicesLoadTime = performance.now() - startTime
      
      // サービス選択
      const serviceCheckbox = bookingWrapper.find('input[value="cut"]')
      await serviceCheckbox.setValue(true)
      
      const nextButton = bookingWrapper.find('[data-testid="next-button"]')
      await nextButton.trigger('click')

      // スタイリスト読み込み待機
      const stylistsLoadingTime = performance.now()
      await waitForElement(bookingWrapper.element, '[data-testid="stylists-list"]', 5000)
      const stylistsLoadTime = performance.now() - stylistsLoadingTime

      // === 3. ユーザビリティ確認 ===
      // 各段階でのフィードバックが適切に表示されている
      expect(servicesLoadTime).toBeGreaterThan(2500) // 実際に遅延が発生している
      expect(stylistsLoadTime).toBeGreaterThan(3500)

      // ローディング中のインタラクション無効化確認
      const disabledButtons = bookingWrapper.findAll('[data-testid*="button"]:disabled')
      expect(disabledButtons.length).toBeGreaterThan(0)

      // === 4. タイムアウト処理 ===
      // 極端に長い遅延をシミュレート
      mockBookingApi.getAvailability.mockImplementation(() => 
        simulateNetworkDelay(10000).then(() => mockApiSuccess({}))
      )

      const stylistRadio = bookingWrapper.find('input[value="stylist1"]')
      await stylistRadio.setValue(true)
      await bookingWrapper.find('[data-testid="next-button"]').trigger('click')

      // タイムアウト警告が表示される（8秒後）
      const timeoutWarning = await waitForElement(
        bookingWrapper.element,
        '[data-testid="timeout-warning"]',
        9000
      )
      expect(timeoutWarning).toBeTruthy()
      expectElementToHaveText(timeoutWarning, 'データの読み込みに時間がかかっています')
    })
  })

  describe('メモリ使用量・パフォーマンステスト', () => {
    it('大量データ処理時のメモリ効率性テスト', async () => {
      // === 1. 大量サービスデータでの初期化 ===
      mockBookingApi.getServices.mockResolvedValue(largeServicesList)
      mockBookingApi.getStylists.mockResolvedValue(largeStylistsList)

      const initialMemory = performance.memory?.usedJSHeapSize || 0
      
      bookingWrapper = mount(BookingPage, createMountOptions())
      await bookingWrapper.vm.$nextTick()

      // === 2. 仮想化確認 ===
      // 100個のサービスがあっても、実際には一部のみレンダリング
      const renderedServices = bookingWrapper.findAll('[data-testid="service-item"]')
      expect(renderedServices.length).toBeLessThanOrEqual(20) // 仮想化により制限

      // スクロール動作確認
      const servicesList = bookingWrapper.find('[data-testid="services-list"]')
      
      // スクロールイベントをシミュレート
      const scrollEvent = new Event('scroll')
      servicesList.element.dispatchEvent(scrollEvent)
      await bookingWrapper.vm.$nextTick()

      // === 3. フィルタリングパフォーマンス ===
      const searchInput = bookingWrapper.find('[data-testid="service-search"]')
      
      const searchStartTime = performance.now()
      await searchInput.setValue('テスト')
      await bookingWrapper.vm.$nextTick()
      const searchTime = performance.now() - searchStartTime

      expect(searchTime).toBeLessThan(100) // 100ms以内での検索

      // メモリ使用量の確認
      const afterSearchMemory = performance.memory?.usedJSHeapSize || 0
      const memoryIncrease = afterSearchMemory - initialMemory
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // 50MB以内の増加

      // === 4. メモリリーク検出 ===
      // 複数回のマウント・アンマウントでメモリリークがないか確認
      const initialMount = performance.memory?.usedJSHeapSize || 0
      
      for (let i = 0; i < 10; i++) {
        const tempWrapper = mount(BookingPage, createMountOptions())
        await tempWrapper.vm.$nextTick()
        tempWrapper.unmount()
      }

      // ガベージコレクションを促進
      if (global.gc) {
        global.gc()
      }

      const afterMultipleMounts = performance.memory?.usedJSHeapSize || 0
      const memoryGrowth = afterMultipleMounts - initialMount
      
      // 10回のマウント・アンマウント後もメモリ使用量が大幅に増加していない
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024) // 10MB以内
    })

    it('リアルタイム更新によるパフォーマンス影響テスト', async () => {
      // === 1. 管理者ダッシュボードでのリアルタイム更新 ===
      adminWrapper = mount(AdminDashboard, createMountOptions())
      await adminWrapper.vm.$nextTick()

      // === 2. 高頻度更新のシミュレート ===
      // 1秒ごとに統計が更新される環境をシミュレート
      let updateCount = 0
      const intervalId = setInterval(() => {
        updateCount++
        mockBookingApi.getBookingStats.mockResolvedValue({
          totalBookings: 245 + updateCount,
          todayBookings: 12 + Math.floor(updateCount / 10),
          revenue: { today: 48000 + updateCount * 1000 }
        })
        
        // 統計更新トリガー
        const statsElement = adminWrapper.find('[data-testid="auto-refresh-stats"]')
        if (statsElement.exists()) {
          statsElement.trigger('update')
        }
      }, 1000)

      // === 3. パフォーマンス測定 ===
      const renderTimes: number[] = []
      
      for (let i = 0; i < 60; i++) { // 1分間の更新をシミュレート
        const renderStart = performance.now()
        await adminWrapper.vm.$nextTick()
        const renderTime = performance.now() - renderStart
        renderTimes.push(renderTime)
        
        await simulateNetworkDelay(1000) // 1秒待機
      }

      clearInterval(intervalId)

      // === 4. パフォーマンス評価 ===
      const averageRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length
      const maxRenderTime = Math.max(...renderTimes)
      
      expect(averageRenderTime).toBeLessThan(50) // 平均50ms以内
      expect(maxRenderTime).toBeLessThan(200) // 最大でも200ms以内

      // フレームドロップが発生していないことを確認
      const slowRenders = renderTimes.filter(time => time > 100).length
      expect(slowRenders).toBeLessThan(renderTimes.length * 0.1) // 10%未満
    })
  })

  describe('データ整合性・トランザクション信頼性テスト', () => {
    it('同時予約作成時の整合性テスト', async () => {
      // === 1. 同じ時間スロットに対する同時予約をシミュレート ===
      const bookingData = createMockBookingData({
        appointmentDate: new Date('2024-01-15T14:00:00'),
        timeSlot: { time: '14:00', endTime: '15:00' }
      })

      // 複数のユーザーが同時に予約を試行
      const booking1Promise = mount(BookingPage, createMountOptions())
      const booking2Promise = mount(BookingPage, createMountOptions())
      const booking3Promise = mount(BookingPage, createMountOptions())

      const [wrapper1, wrapper2, wrapper3] = await Promise.all([
        booking1Promise,
        booking2Promise, 
        booking3Promise
      ])

      // === 2. 同時予約処理 ===
      // 最初の予約は成功
      mockBookingApi.createBooking
        .mockResolvedValueOnce(mockApiSuccess(bookingData))
        .mockRejectedValueOnce(new Error('Time slot already booked'))
        .mockRejectedValueOnce(new Error('Time slot already booked'))

      // すべてのラッパーで同時に予約フローを実行
      const bookingPromises = [wrapper1, wrapper2, wrapper3].map(async (wrapper, index) => {
        await this.executeBookingFlow(wrapper, {
          service: 'cut',
          stylist: 'stylist1',
          date: '2024-01-15',
          time: '14:00',
          customer: {
            name: `テストユーザー${index + 1}`,
            email: `user${index + 1}@example.com`,
            phone: `090-000-${index + 1}${index + 1}${index + 1}${index + 1}`
          }
        })
      })

      const results = await Promise.allSettled(bookingPromises)

      // === 3. 結果確認 ===
      // 1つの予約のみが成功し、他は適切にエラー処理される
      const successfulBookings = results.filter(result => result.status === 'fulfilled').length
      const failedBookings = results.filter(result => result.status === 'rejected').length

      expect(successfulBookings).toBe(1)
      expect(failedBookings).toBe(2)

      // 失敗した予約で適切なエラーメッセージが表示される
      const errorWrapper = wrapper2 // 2番目の予約は失敗
      const errorMessage = errorWrapper.find('[data-testid="booking-error"]')
      expect(errorMessage.exists()).toBe(true)
      expectElementToHaveText(errorMessage.element, '選択された時間は既に予約されています')

      // 代替時間の提案が表示される
      const alternativeSlots = errorWrapper.find('[data-testid="alternative-slots"]')
      expect(alternativeSlots.exists()).toBe(true)

      // クリーンアップ
      wrapper1.unmount()
      wrapper2.unmount()
      wrapper3.unmount()
    })

    it('メール送信失敗時のデータ一貫性テスト', async () => {
      // === 1. 予約作成は成功、メール送信は失敗のシナリオ ===
      const bookingData = createMockBookingData()
      
      mockBookingApi.createBooking.mockResolvedValue(mockApiSuccess(bookingData))
      mockEmailNotification.sendConfirmationEmail.mockRejectedValue(new Error('SMTP server unavailable'))

      bookingWrapper = mount(BookingPage, createMountOptions())
      
      // === 2. 予約フロー実行 ===
      await this.executeBookingFlow(bookingWrapper, {
        service: 'cut',
        stylist: 'stylist1',
        date: '2024-01-15',
        time: '14:00',
        customer: {
          name: 'テスト太郎',
          email: 'test@example.com',
          phone: '090-1234-5678'
        }
      })

      // === 3. 部分成功状態の確認 ===
      // 予約は作成されている
      expect(mockBookingApi.createBooking).toHaveBeenCalled()
      
      // 部分成功メッセージが表示される
      const partialSuccessMessage = await waitForElement(
        bookingWrapper.element,
        '[data-testid="partial-success-message"]'
      )
      expect(partialSuccessMessage).toBeTruthy()
      expectElementToHaveText(partialSuccessMessage, 'ご予約は完了しましたが、確認メールの送信に失敗しました')

      // === 4. 手動でのメール再送信 ===
      mockEmailNotification.sendConfirmationEmail.mockResolvedValue(true)
      
      const resendEmailButton = bookingWrapper.find('[data-testid="resend-email-button"]')
      await resendEmailButton.trigger('click')

      // 再送信成功確認
      expect(mockEmailNotification.sendConfirmationEmail).toHaveBeenCalledTimes(2)
      
      const emailSuccessMessage = await waitForElement(
        bookingWrapper.element,
        '[data-testid="email-success-message"]'
      )
      expect(emailSuccessMessage).toBeTruthy()

      // === 5. 管理者側での状況確認 ===
      adminWrapper = mount(AdminDashboard, createMountOptions())
      await adminWrapper.vm.$nextTick()

      // メール送信失敗のアラートが表示されている
      const emailFailureAlert = adminWrapper.find('[data-testid="email-failure-alert"]')
      expect(emailFailureAlert.exists()).toBe(true)

      // 予約は正常にカウントされている
      const bookingStats = adminWrapper.find('[data-testid="booking-stats"]')
      expectElementToHaveText(bookingStats.element, '予約数が更新されている')
    })
  })

  describe('システム回復力テスト', () => {
    it('Firebase接続完全断絶からの回復テスト', async () => {
      // === 1. 完全な接続断絶をシミュレート ===
      mockFirebaseConfig.connectionStatus.value = 'disconnected'
      mockFirebaseConfig.checkFirebaseConnection.mockRejectedValue(new Error('Network unreachable'))
      mockBookingApi.healthCheck.mockRejectedValue(new Error('Service unavailable'))

      // === 2. システム全体への影響確認 ===
      adminWrapper = mount(AdminDashboard, createMountOptions())
      await adminWrapper.vm.$nextTick()

      // 緊急システムアラート表示
      const emergencyAlert = adminWrapper.find('[data-testid="emergency-alert"]')
      expect(emergencyAlert.exists()).toBe(true)
      expectElementToHaveClass(emergencyAlert.element, 'alert-danger')
      expectElementToHaveText(emergencyAlert.element, 'システム接続エラー: すべての機能が利用できません')

      // 予約ページでの影響確認
      bookingWrapper = mount(BookingPage, createMountOptions())
      await bookingWrapper.vm.$nextTick()

      const serviceUnavailableMessage = bookingWrapper.find('[data-testid="service-unavailable"]')
      expect(serviceUnavailableMessage.exists()).toBe(true)
      expectElementToHaveText(serviceUnavailableMessage.element, '現在システムメンテナンス中です')

      // === 3. 段階的回復プロセス ===
      // Phase 1: 基本接続回復
      mockFirebaseConfig.connectionStatus.value = 'connecting'
      mockFirebaseConfig.checkFirebaseConnection.mockResolvedValue(true)

      const reconnectButton = adminWrapper.find('[data-testid="emergency-reconnect"]')
      await reconnectButton.trigger('click')

      // 接続中表示
      const connectingIndicator = await waitForElement(
        adminWrapper.element,
        '[data-testid="reconnecting-indicator"]'
      )
      expect(connectingIndicator).toBeTruthy()

      // Phase 2: サービス復旧確認
      mockBookingApi.healthCheck.mockResolvedValue({ status: 'healthy', responseTime: 200 })
      mockEmailNotification.healthCheck.mockResolvedValue({ status: 'healthy', queueSize: 0 })

      await simulateNetworkDelay(3000) // 復旧プロセス待機

      // Phase 3: 完全復旧
      mockFirebaseConfig.connectionStatus.value = 'connected'
      
      await adminWrapper.vm.$nextTick()

      // 復旧成功メッセージ
      const recoverySuccess = adminWrapper.find('[data-testid="recovery-success"]')
      expect(recoverySuccess.exists()).toBe(true)
      expectElementToHaveText(recoverySuccess.element, 'システムが正常に復旧しました')

      // === 4. 機能復旧確認 ===
      bookingWrapper.unmount()
      bookingWrapper = mount(BookingPage, createMountOptions())
      
      // 正常な予約フロー実行
      mockBookingApi.getServices.mockResolvedValue([createMockService()])
      await bookingWrapper.vm.$nextTick()

      const servicesAvailable = bookingWrapper.find('[data-testid="services-list"]')
      expect(servicesAvailable.exists()).toBe(true)

      // システム回復後の予約作成テスト
      await this.executeBookingFlow(bookingWrapper, {
        service: 'cut',
        stylist: 'stylist1',
        date: '2024-01-15',
        time: '14:00',
        customer: {
          name: 'テスト復旧',
          email: 'recovery@example.com',
          phone: '090-9999-9999'
        }
      })

      const completionMessage = await waitForElement(
        bookingWrapper.element,
        '[data-testid="completion-message"]'
      )
      expect(completionMessage).toBeTruthy()
    })

    it('段階的機能縮退と復旧テスト', async () => {
      // === 1. 正常状態からの開始 ===
      adminWrapper = mount(AdminDashboard, createMountOptions())
      await adminWrapper.vm.$nextTick()

      const normalStatus = adminWrapper.find('[data-testid="system-status"]')
      expectElementToHaveText(normalStatus.element, 'すべてのシステムが正常です')

      // === 2. メール機能のみ障害 ===
      mockEmailNotification.healthCheck.mockRejectedValue(new Error('SMTP timeout'))
      mockEmailNotification.sendConfirmationEmail.mockRejectedValue(new Error('Email service down'))

      // システムヘルスチェック実行
      const healthCheckButton = adminWrapper.find('[data-testid="health-check-button"]')
      await healthCheckButton.trigger('click')

      await adminWrapper.vm.$nextTick()

      // 部分的システム警告
      const partialWarning = adminWrapper.find('[data-testid="partial-service-warning"]')
      expect(partialWarning.exists()).toBe(true)
      expectElementToHaveText(partialWarning.element, 'メール機能に障害が発生しています')

      // 予約機能は継続利用可能
      bookingWrapper = mount(BookingPage, createMountOptions())
      await this.executeBookingFlow(bookingWrapper, {
        service: 'cut',
        stylist: 'stylist1',
        date: '2024-01-15',
        time: '14:00',
        customer: {
          name: 'テスト縮退',
          email: 'degraded@example.com',
          phone: '090-8888-8888'
        }
      })

      // 予約は成功するが、メール警告が表示される
      const emailWarning = bookingWrapper.find('[data-testid="email-service-warning"]')
      expect(emailWarning.exists()).toBe(true)
      expectElementToHaveText(emailWarning.element, '確認メールの送信に問題が発生している可能性があります')

      // === 3. 追加機能障害（データベース遅延） ===
      mockBookingApi.getServices.mockImplementation(() => simulateNetworkDelay(8000))
      mockBookingApi.getStylists.mockImplementation(() => simulateNetworkDelay(10000))

      // データベース遅延警告
      bookingWrapper.unmount()
      bookingWrapper = mount(BookingPage, createMountOptions())

      const slowLoadWarning = await waitForElement(
        bookingWrapper.element,
        '[data-testid="slow-load-warning"]',
        9000
      )
      expect(slowLoadWarning).toBeTruthy()
      expectElementToHaveText(slowLoadWarning, 'データの読み込みが通常より遅くなっています')

      // === 4. 段階的回復 ===
      // メール機能回復
      mockEmailNotification.healthCheck.mockResolvedValue({ status: 'healthy', queueSize: 0 })
      mockEmailNotification.sendConfirmationEmail.mockResolvedValue(true)

      // データベース応答改善
      mockBookingApi.getServices.mockResolvedValue([createMockService()])
      mockBookingApi.getStylists.mockResolvedValue([createMockStylist()])

      // システム再チェック
      await healthCheckButton.trigger('click')
      await adminWrapper.vm.$nextTick()

      // 完全回復確認
      const fullRecovery = adminWrapper.find('[data-testid="full-recovery-notice"]')
      expect(fullRecovery.exists()).toBe(true)
      expectElementToHaveText(fullRecovery.element, 'すべての機能が正常に復旧しました')
    })
  })

  // ヘルパーメソッド
  async function executeBookingFlow(wrapper: VueWrapper<any>, bookingInfo: any) {
    // サービス選択
    const serviceCheckbox = wrapper.find(`input[value="${bookingInfo.service}"]`)
    await serviceCheckbox.setValue(true)
    let nextButton = wrapper.find('[data-testid="next-button"]')
    await nextButton.trigger('click')

    // スタイリスト選択
    const stylistRadio = wrapper.find(`input[value="${bookingInfo.stylist}"]`)
    await stylistRadio.setValue(true)
    nextButton = wrapper.find('[data-testid="next-button"]')
    await nextButton.trigger('click')

    // 日時選択
    const dateButton = wrapper.find(`[data-date="${bookingInfo.date}"]`)
    await dateButton.trigger('click')
    const timeSlot = wrapper.find(`[data-time="${bookingInfo.time}"]`)
    await timeSlot.trigger('click')
    nextButton = wrapper.find('[data-testid="next-button"]')
    await nextButton.trigger('click')

    // 顧客情報入力
    await fillFormField(wrapper, '#customer-name', bookingInfo.customer.name)
    await fillFormField(wrapper, '#customer-email', bookingInfo.customer.email)
    await fillFormField(wrapper, '#customer-phone', bookingInfo.customer.phone)

    // 予約確定
    const submitButton = wrapper.find('[data-testid="submit-button"]')
    await submitButton.trigger('click')
    await wrapper.vm.$nextTick()
  }
})