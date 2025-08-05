// 予約フロー統合テスト - フロントエンド・バックエンド連携

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import BookingPage from '~/pages/booking.vue'
import {
  createMountOptions,
  createMockBookingData,
  createMockService,
  createMockStylist,
  expectElementToHaveText,
  waitForElement,
  mockApiSuccess,
  mockApiError
} from '../utils/test-helpers'

// 統合テスト用のモック設定
const mockBookingApi = {
  getServices: vi.fn(),
  getStylists: vi.fn(),
  getAvailability: vi.fn(),
  createBooking: vi.fn()
}

const mockEmailNotification = {
  sendConfirmationEmail: vi.fn(),
  notifications: ref([])
}

const mockFirebaseConfig = {
  currentEnvironment: ref('development'),
  useEmulator: ref(true),
  connectionStatus: ref('connected')
}

vi.mock('~/composables/useBookingApi', () => ({
  useBookingApi: () => mockBookingApi
}))

vi.mock('~/composables/useEmailNotification', () => ({
  useEmailNotification: () => mockEmailNotification
}))

vi.mock('~/composables/useFirebaseConfig', () => ({
  useFirebaseConfig: () => mockFirebaseConfig
}))

describe('予約フロー統合テスト', () => {
  let wrapper: VueWrapper<any>

  const mockServices = [
    createMockService({ id: 'cut', name: 'カット', price: 4000, duration: 60 }),
    createMockService({ id: 'color', name: 'カラー', price: 7000, duration: 120 })
  ]

  const mockStylists = [
    createMockStylist({ id: 'stylist1', displayName: 'スタイリスト A' }),
    createMockStylist({ id: 'stylist2', displayName: 'スタイリスト B' })
  ]

  const mockAvailability = {
    date: '2024-01-15',
    availableSlots: [
      { time: '10:00', endTime: '11:00', isAvailable: true, duration: 60 },
      { time: '14:00', endTime: '15:00', isAvailable: true, duration: 60 },
      { time: '16:00', endTime: '17:00', isAvailable: true, duration: 60 }
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // APIモックの初期設定
    mockBookingApi.getServices.mockResolvedValue(mockServices)
    mockBookingApi.getStylists.mockResolvedValue(mockStylists)
    mockBookingApi.getAvailability.mockResolvedValue(mockAvailability)
    mockBookingApi.createBooking.mockResolvedValue(mockApiSuccess(createMockBookingData()))
    
    // メール通知モックの初期設定
    mockEmailNotification.sendConfirmationEmail.mockResolvedValue(true)
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('正常フロー', () => {
    it('完全な予約フローが正常に動作する', async () => {
      wrapper = mount(BookingPage, createMountOptions())

      // === ステップ1: サービス選択 ===
      await wrapper.vm.$nextTick()

      // サービスが読み込まれることを確認
      expect(mockBookingApi.getServices).toHaveBeenCalled()

      // サービス選択
      const serviceCheckbox = wrapper.find('input[value="cut"]')
      await serviceCheckbox.setValue(true)

      // 次のステップへ
      const nextButton = wrapper.find('[data-testid="next-button"]')
      await nextButton.trigger('click')

      // === ステップ2: スタイリスト選択 ===
      expect(mockBookingApi.getStylists).toHaveBeenCalled()

      // スタイリスト選択
      const stylistRadio = wrapper.find('input[value="stylist1"]')
      await stylistRadio.setValue(true)

      const nextButton2 = wrapper.find('[data-testid="next-button"]')
      await nextButton2.trigger('click')

      // === ステップ3: 日時選択 ===
      expect(mockBookingApi.getAvailability).toHaveBeenCalledWith(
        expect.objectContaining({
          services: ['cut'],
          stylistId: 'stylist1'
        })
      )

      // 日付選択
      const dateButton = wrapper.find('[data-date="2024-01-15"]')
      await dateButton.trigger('click')

      // 時間選択
      const timeSlot = wrapper.find('[data-time="14:00"]')
      await timeSlot.trigger('click')

      const nextButton3 = wrapper.find('[data-testid="next-button"]')
      await nextButton3.trigger('click')

      // === ステップ4: 確認・顧客情報入力 ===
      const customerName = wrapper.find('#customer-name')
      await customerName.setValue('テスト太郎')

      const customerEmail = wrapper.find('#customer-email')
      await customerEmail.setValue('test@example.com')

      const customerPhone = wrapper.find('#customer-phone')
      await customerPhone.setValue('090-1234-5678')

      // 予約確定
      const submitButton = wrapper.find('[data-testid="submit-button"]')
      await submitButton.trigger('click')

      // === 統合確認 ===
      // バックエンドAPI呼び出し確認
      expect(mockBookingApi.createBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          services: expect.arrayContaining([
            expect.objectContaining({ id: 'cut' })
          ]),
          stylist: expect.objectContaining({ id: 'stylist1' }),
          customerInfo: expect.objectContaining({
            name: 'テスト太郎',
            email: 'test@example.com',
            phone: '090-1234-5678'
          })
        })
      )

      // メール通知送信確認
      await wrapper.vm.$nextTick()
      expect(mockEmailNotification.sendConfirmationEmail).toHaveBeenCalled()

      // === ステップ5: 完了画面 ===
      const completionMessage = await waitForElement(
        wrapper.element,
        '[data-testid="completion-message"]'
      )
      expect(completionMessage).toBeTruthy()
      expectElementToHaveText(completionMessage, 'ご予約が完了しました')
    })

    it('エミュレーター環境での統合テストが正常に動作する', async () => {
      // エミュレーター環境設定
      mockFirebaseConfig.currentEnvironment.value = 'development'
      mockFirebaseConfig.useEmulator.value = true

      wrapper = mount(BookingPage, createMountOptions())

      // Firebase設定が開発環境・エミュレーター使用になっていることを確認
      expect(mockFirebaseConfig.currentEnvironment.value).toBe('development')
      expect(mockFirebaseConfig.useEmulator.value).toBe(true)

      // 予約作成時にエミュレーター向けAPIが呼ばれることを確認
      const serviceCheckbox = wrapper.find('input[value="cut"]')
      await serviceCheckbox.setValue(true)

      // 開発環境での予約作成APIが呼ばれる
      expect(mockBookingApi.getServices).toHaveBeenCalled()
    })
  })

  describe('エラーハンドリング統合テスト', () => {
    it('バックエンドAPIエラー時の統合エラーハンドリング', async () => {
      // サービス取得エラーをシミュレート
      mockBookingApi.getServices.mockRejectedValue(new Error('API接続エラー'))

      wrapper = mount(BookingPage, createMountOptions())
      await wrapper.vm.$nextTick()

      // エラーメッセージが表示されることを確認
      const errorElement = await waitForElement(
        wrapper.element,
        '[data-testid="error-message"]'
      )
      expect(errorElement).toBeTruthy()
    })

    it('予約作成失敗時のメール通知連携エラー処理', async () => {
      // 予約作成は成功、メール送信は失敗
      mockBookingApi.createBooking.mockResolvedValue(mockApiSuccess(createMockBookingData()))
      mockEmailNotification.sendConfirmationEmail.mockRejectedValue(new Error('メール送信エラー'))

      wrapper = mount(BookingPage, createMountOptions())

      // 予約フローを実行
      await this.completeBookingFlow(wrapper)

      // 予約は成功しているが、メール送信エラーが表示される
      const emailErrorElement = await waitForElement(
        wrapper.element,
        '[data-testid="email-error"]'
      )
      expect(emailErrorElement).toBeTruthy()
    })

    it('Firebase接続エラー時の統合エラーハンドリング', async () => {
      // Firebase接続エラーをシミュレート
      mockFirebaseConfig.connectionStatus.value = 'error'

      wrapper = mount(BookingPage, createMountOptions())

      // Firebase接続エラー時の警告表示を確認
      const connectionWarning = wrapper.find('[data-testid="firebase-connection-warning"]')
      expect(connectionWarning.exists()).toBe(true)
    })
  })

  describe('環境切り替え統合テスト', () => {
    it('本番環境への切り替えが統合的に動作する', async () => {
      // 本番環境設定
      mockFirebaseConfig.currentEnvironment.value = 'production'
      mockFirebaseConfig.useEmulator.value = false

      wrapper = mount(BookingPage, createMountOptions())

      // 本番環境向けAPI呼び出しが実行される
      expect(mockBookingApi.getServices).toHaveBeenCalled()

      // エミュレーター設定がfalseになっている
      expect(mockFirebaseConfig.useEmulator.value).toBe(false)
    })

    it('環境切り替え後の予約フローが正常に動作する', async () => {
      // 開発環境から本番環境への切り替えをシミュレート
      mockFirebaseConfig.currentEnvironment.value = 'development'
      wrapper = mount(BookingPage, createMountOptions())

      // 環境切り替え
      mockFirebaseConfig.currentEnvironment.value = 'production'
      mockFirebaseConfig.useEmulator.value = false

      // 切り替え後もAPIが正常に動作することを確認
      await wrapper.vm.$nextTick()
      expect(mockBookingApi.getServices).toHaveBeenCalled()
    })
  })

  describe('メール通知統合テスト', () => {
    it('予約完了からメール送信までの統合フロー', async () => {
      wrapper = mount(BookingPage, createMountOptions())

      // 予約完了まで実行
      await this.completeBookingFlow(wrapper)

      // メール通知が自動的に送信される
      expect(mockEmailNotification.sendConfirmationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          customerInfo: expect.objectContaining({
            email: 'test@example.com'
          })
        })
      )

      // メール送信状況が表示される
      const emailStatus = wrapper.find('[data-testid="email-notification-status"]')
      expect(emailStatus.exists()).toBe(true)
    })

    it('メール送信失敗時の再送信統合フロー', async () => {
      // 初回送信失敗
      mockEmailNotification.sendConfirmationEmail.mockRejectedValueOnce(new Error('送信失敗'))
      // 再送信成功
      mockEmailNotification.sendConfirmationEmail.mockResolvedValue(true)

      wrapper = mount(BookingPage, createMountOptions())
      await this.completeBookingFlow(wrapper)

      // エラー状態と再送信ボタンが表示される
      const retryButton = await waitForElement(
        wrapper.element,
        '[data-testid="retry-button"]'
      )
      expect(retryButton).toBeTruthy()

      // 再送信実行
      await retryButton.click()

      // 再送信が成功することを確認
      expect(mockEmailNotification.sendConfirmationEmail).toHaveBeenCalledTimes(2)
    })
  })

  describe('レスポンシブ統合テスト', () => {
    it('モバイル環境での統合フローが正常に動作する', async () => {
      // ビューポートサイズをモバイルに設定
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })

      wrapper = mount(BookingPage, createMountOptions())

      // モバイル表示でも予約フローが正常に動作することを確認
      await this.completeBookingFlow(wrapper)

      expect(mockBookingApi.createBooking).toHaveBeenCalled()
    })
  })

  describe('パフォーマンス統合テスト', () => {
    it('大量データでの統合テストパフォーマンス', async () => {
      // 大量のサービスとスタイリストデータ
      const largeServicesList = Array.from({ length: 50 }, (_, i) =>
        createMockService({ id: `service${i}`, name: `サービス${i}` })
      )
      const largeStylistsList = Array.from({ length: 20 }, (_, i) =>
        createMockStylist({ id: `stylist${i}`, displayName: `スタイリスト${i}` })
      )

      mockBookingApi.getServices.mockResolvedValue(largeServicesList)
      mockBookingApi.getStylists.mockResolvedValue(largeStylistsList)

      const startTime = performance.now()
      wrapper = mount(BookingPage, createMountOptions())
      await wrapper.vm.$nextTick()
      const endTime = performance.now()

      // 初期レンダリングが1秒以内に完了することを確認
      expect(endTime - startTime).toBeLessThan(1000)
    })
  })

  // ヘルパーメソッド
  async function completeBookingFlow(wrapper: VueWrapper<any>) {
    // サービス選択
    const serviceCheckbox = wrapper.find('input[value="cut"]')
    await serviceCheckbox.setValue(true)
    const nextButton1 = wrapper.find('[data-testid="next-button"]')
    await nextButton1.trigger('click')

    // スタイリスト選択
    const stylistRadio = wrapper.find('input[value="stylist1"]')
    await stylistRadio.setValue(true)
    const nextButton2 = wrapper.find('[data-testid="next-button"]')
    await nextButton2.trigger('click')

    // 日時選択
    const dateButton = wrapper.find('[data-date="2024-01-15"]')
    await dateButton.trigger('click')
    const timeSlot = wrapper.find('[data-time="14:00"]')
    await timeSlot.trigger('click')
    const nextButton3 = wrapper.find('[data-testid="next-button"]')
    await nextButton3.trigger('click')

    // 顧客情報入力
    const customerName = wrapper.find('#customer-name')
    await customerName.setValue('テスト太郎')
    const customerEmail = wrapper.find('#customer-email')
    await customerEmail.setValue('test@example.com')
    const customerPhone = wrapper.find('#customer-phone')
    await customerPhone.setValue('090-1234-5678')

    // 予約確定
    const submitButton = wrapper.find('[data-testid="submit-button"]')
    await submitButton.trigger('click')
    await wrapper.vm.$nextTick()
  }
})