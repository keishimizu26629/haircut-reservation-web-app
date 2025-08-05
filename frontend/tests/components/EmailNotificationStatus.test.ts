// EmailNotificationStatus コンポーネントのテスト

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import EmailNotificationStatus from '~/components/EmailNotificationStatus.vue'
import {
  createMountOptions,
  createMockBookingData,
  expectElementToHaveText,
  expectElementToHaveClass,
  queryByTestId
} from '../utils/test-helpers'

// モック
const mockUseEmailNotification = {
  notifications: ref([]),
  loading: ref(false),
  error: ref(null),
  sendConfirmationEmail: vi.fn(),
  retryEmail: vi.fn(),
  removeNotification: vi.fn()
}

vi.mock('~/composables/useEmailNotification', () => ({
  useEmailNotification: () => mockUseEmailNotification
}))

describe('EmailNotificationStatus', () => {
  let wrapper: VueWrapper<any>
  const mockBookingData = createMockBookingData()

  const createWrapper = (props = {}) => {
    return mount(EmailNotificationStatus, {
      props: {
        bookingData: mockBookingData,
        showControls: true,
        autoSend: false,
        ...props
      },
      ...createMountOptions()
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseEmailNotification.notifications.value = []
    mockUseEmailNotification.loading.value = false
    mockUseEmailNotification.error.value = null
  })

  describe('初期状態', () => {
    it('コンポーネントが正常にマウントされる', () => {
      wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
      
      const statusElement = queryByTestId(wrapper.element, 'email-notification-status')
      expect(statusElement).toBeTruthy()
    })

    it('booking-dataがnullの場合は何も表示されない', () => {
      wrapper = createWrapper({ bookingData: null })
      
      const mainElement = queryByTestId(wrapper.element, 'notification-main')
      expect(mainElement?.children.length).toBe(0)
    })
  })

  describe('送信中状態', () => {
    beforeEach(() => {
      mockUseEmailNotification.notifications.value = [{
        id: 'test-1',
        type: 'confirmation',
        status: 'sending',
        recipientEmail: mockBookingData.customerInfo.email,
        retryCount: 0,
        maxRetries: 3
      }]
    })

    it('送信中インジケーターが表示される', () => {
      wrapper = createWrapper()
      
      const sendingStatus = queryByTestId(wrapper.element, 'sending-status')
      expect(sendingStatus).toBeTruthy()
      
      const loadingIndicator = queryByTestId(wrapper.element, 'loading')
      expect(loadingIndicator).toBeTruthy()
      
      expectElementToHaveText(sendingStatus, '予約確認メールを送信中')
      expectElementToHaveText(sendingStatus, mockBookingData.customerInfo.email)
    })

    it('送信中はローディングスピナーが表示される', () => {
      wrapper = createWrapper()
      
      const spinner = queryByTestId(wrapper.element, 'loading')
      expect(spinner).toBeTruthy()
      expectElementToHaveClass(spinner, 'spinner-border')
    })
  })

  describe('送信完了状態', () => {
    beforeEach(() => {
      mockUseEmailNotification.notifications.value = [{
        id: 'test-1',
        type: 'confirmation',
        status: 'sent',
        recipientEmail: mockBookingData.customerInfo.email,
        sentAt: '2024-01-15T10:30:00.000Z',
        retryCount: 0,
        maxRetries: 3
      }]
    })

    it('送信完了メッセージが表示される', () => {
      wrapper = createWrapper()
      
      const successStatus = queryByTestId(wrapper.element, 'success-status')
      expect(successStatus).toBeTruthy()
      
      const successIcon = queryByTestId(wrapper.element, 'success')
      expect(successIcon).toBeTruthy()
      
      expectElementToHaveText(successStatus, '予約確認メールを送信しました')
      expectElementToHaveText(successStatus, mockBookingData.customerInfo.email)
    })

    it('送信時刻が表示される', () => {
      wrapper = createWrapper()
      
      const sentTime = queryByTestId(wrapper.element, 'sent-time')
      expect(sentTime).toBeTruthy()
      expectElementToHaveText(sentTime, '送信完了')
    })
  })

  describe('送信失敗状態', () => {
    beforeEach(() => {
      mockUseEmailNotification.notifications.value = [{
        id: 'test-1',
        type: 'confirmation',
        status: 'failed',
        recipientEmail: mockBookingData.customerInfo.email,
        error: 'ネットワークエラーが発生しました',
        retryCount: 1,
        maxRetries: 3
      }]
    })

    it('エラーメッセージが表示される', () => {
      wrapper = createWrapper()
      
      const errorStatus = queryByTestId(wrapper.element, 'error-status')
      expect(errorStatus).toBeTruthy()
      
      const errorIcon = queryByTestId(wrapper.element, 'error')
      expect(errorIcon).toBeTruthy()
      
      expectElementToHaveText(errorStatus, 'メール送信に失敗しました')
      
      const errorMessage = queryByTestId(wrapper.element, 'error-message')
      expectElementToHaveText(errorMessage, 'ネットワークエラーが発生しました')
    })

    it('再送信ボタンが表示される', () => {
      wrapper = createWrapper()
      
      const retryButton = queryByTestId(wrapper.element, 'retry-button')
      expect(retryButton).toBeTruthy()
      expectElementToHaveText(retryButton, '再送信')
      expect(retryButton.disabled).toBeFalsy()
    })

    it('再送信ボタンをクリックすると再送信処理が実行される', async () => {
      mockUseEmailNotification.retryEmail.mockResolvedValue(true)
      wrapper = createWrapper()
      
      const retryButton = queryByTestId(wrapper.element, 'retry-button') as HTMLButtonElement
      expect(retryButton).toBeTruthy()
      
      await retryButton.click()
      
      expect(mockUseEmailNotification.retryEmail).toHaveBeenCalledWith('test-1')
    })

    it('最大再送信回数に達した場合は再送信ボタンが無効化される', () => {
      mockUseEmailNotification.notifications.value[0].retryCount = 3
      wrapper = createWrapper()
      
      const retryButton = queryByTestId(wrapper.element, 'retry-button') as HTMLButtonElement
      expect(retryButton.disabled).toBeTruthy()
      expectElementToHaveText(retryButton, '(上限達成)')
    })
  })

  describe('イベント', () => {
    it('メール送信成功時にemailSentイベントが発火される', async () => {
      mockUseEmailNotification.sendConfirmationEmail.mockResolvedValue(true)
      wrapper = createWrapper({ autoSend: true })
      
      // autoSendがtrueの場合、自動的にメール送信が実行される
      await wrapper.vm.$nextTick()
      
      expect(wrapper.emitted('emailSent')).toBeTruthy()
      expect(wrapper.emitted('emailSent')[0]).toEqual([true])
    })

    it('メール送信失敗時にemailFailedイベントが発火される', async () => {
      const errorMessage = 'APIエラーが発生しました'
      mockUseEmailNotification.sendConfirmationEmail.mockRejectedValue(new Error(errorMessage))
      wrapper = createWrapper({ autoSend: true })
      
      await wrapper.vm.$nextTick()
      
      expect(wrapper.emitted('emailFailed')).toBeTruthy()
      expect(wrapper.emitted('emailFailed')[0]).toEqual([errorMessage])
    })

    it('再送信実行時にretryAttemptイベントが発火される', async () => {
      mockUseEmailNotification.notifications.value = [{
        id: 'test-1',
        type: 'confirmation',
        status: 'failed',
        recipientEmail: mockBookingData.customerInfo.email,
        retryCount: 1,
        maxRetries: 3
      }]
      
      mockUseEmailNotification.retryEmail.mockResolvedValue(true)
      wrapper = createWrapper()
      
      const retryButton = queryByTestId(wrapper.element, 'retry-button') as HTMLButtonElement
      await retryButton.click()
      
      expect(wrapper.emitted('retryAttempt')).toBeTruthy()
      expect(wrapper.emitted('retryAttempt')[0]).toEqual([2]) // retryCount + 1
    })
  })

  describe('Props', () => {
    it('showControlsがfalseの場合は詳細コントロールが表示されない', () => {
      mockUseEmailNotification.notifications.value = [{
        id: 'test-1',
        type: 'confirmation',
        status: 'sent',
        recipientEmail: mockBookingData.customerInfo.email,
        sentAt: '2024-01-15T10:30:00.000Z',
        retryCount: 0,
        maxRetries: 3
      }]
      
      wrapper = createWrapper({ showControls: false })
      
      // 詳細ボタンが表示されない
      const detailButton = wrapper.element.querySelector('[aria-expanded]')
      expect(detailButton).toBeFalsy()
    })

    it('autoSendがfalseの場合は自動送信されない', () => {
      wrapper = createWrapper({ autoSend: false })
      
      expect(mockUseEmailNotification.sendConfirmationEmail).not.toHaveBeenCalled()
    })
  })

  describe('レスポンシブ対応', () => {
    it('モバイル表示でも適切にレンダリングされる', () => {
      // CSSメディアクエリのテストは実際のブラウザ環境でのE2Eテストで確認
      wrapper = createWrapper()
      
      const statusElement = queryByTestId(wrapper.element, 'email-notification-status')
      expect(statusElement).toBeTruthy()
      
      // 基本的な構造が保持されていることを確認
      const mainElement = queryByTestId(wrapper.element, 'notification-main')
      expect(mainElement).toBeTruthy()
    })
  })

  describe('Firebase環境統合テスト', () => {
    it('Firebase環境エラー時にメール送信が失敗する', async () => {
      // Firebase環境エラーをシミュレート
      mockUseEmailNotification.sendConfirmationEmail.mockRejectedValue(new Error('Firebase connection failed'))
      
      wrapper = createWrapper({ autoSend: true })
      await wrapper.vm.$nextTick()
      
      expect(wrapper.emitted('emailFailed')).toBeTruthy()
      expect(wrapper.emitted('emailFailed')[0]).toEqual(['Firebase connection failed'])
    })

    it('異なるFirebase環境での接続状態を反映する', async () => {
      // Development環境での通知設定
      mockUseEmailNotification.notifications.value = [{
        id: 'test-1',
        type: 'confirmation',
        status: 'sent',
        recipientEmail: mockBookingData.customerInfo.email,
        sentAt: '2024-01-15T10:30:00.000Z',
        retryCount: 0,
        maxRetries: 3,
        environment: 'development'
      }]

      wrapper = createWrapper()
      
      const successStatus = queryByTestId(wrapper.element, 'success-status')
      expect(successStatus).toBeTruthy()
      expectElementToHaveText(successStatus, '予約確認メールを送信しました')
    })

    it('エミュレーター使用時のメール送信をシミュレート', async () => {
      // エミュレーター環境での送信
      mockUseEmailNotification.sendConfirmationEmail.mockImplementation(async (bookingData) => {
        // エミュレーター特有の処理をシミュレート
        console.log('Emulator: Sending email to', bookingData.customerInfo.email)
        return true
      })

      wrapper = createWrapper({ autoSend: true })
      await wrapper.vm.$nextTick()

      expect(mockUseEmailNotification.sendConfirmationEmail).toHaveBeenCalledWith(mockBookingData)
    })
  })

  describe('ネットワーク状況対応', () => {
    it('ネットワークエラー時の再送信処理', async () => {
      mockUseEmailNotification.notifications.value = [{
        id: 'test-1',
        type: 'confirmation',
        status: 'failed',
        recipientEmail: mockBookingData.customerInfo.email,
        error: 'Network timeout',
        retryCount: 1,
        maxRetries: 3
      }]

      // 最初はネットワークエラー、再送信で成功
      mockUseEmailNotification.retryEmail
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce(true)

      wrapper = createWrapper()
      
      const retryButton = queryByTestId(wrapper.element, 'retry-button') as HTMLButtonElement
      await retryButton.click()

      expect(mockUseEmailNotification.retryEmail).toHaveBeenCalledWith('test-1')
    })

    it('複数回のネットワークエラー後の成功', async () => {
      mockUseEmailNotification.notifications.value = [{
        id: 'test-1',
        type: 'confirmation',
        status: 'failed',
        recipientEmail: mockBookingData.customerInfo.email,
        error: 'Connection refused',
        retryCount: 2,
        maxRetries: 3
      }]

      // 最後の試行で成功
      mockUseEmailNotification.retryEmail.mockResolvedValue(true)

      wrapper = createWrapper()
      
      const retryButton = queryByTestId(wrapper.element, 'retry-button') as HTMLButtonElement
      expect(retryButton.disabled).toBeFalsy()
      
      await retryButton.click()
      
      expect(wrapper.emitted('retryAttempt')).toBeTruthy()
      expect(wrapper.emitted('retryAttempt')[0]).toEqual([3])
    })
  })

  describe('パフォーマンステスト', () => {
    it('大量通知データでもパフォーマンスが劣化しない', () => {
      // 100件の通知データを生成
      const manyNotifications = Array.from({ length: 100 }, (_, i) => ({
        id: `notification-${i}`,
        type: 'confirmation' as const,
        status: i % 3 === 0 ? 'sent' as const : i % 3 === 1 ? 'failed' as const : 'sending' as const,
        recipientEmail: `test${i}@example.com`,
        sentAt: i % 3 === 0 ? '2024-01-15T10:30:00.000Z' : undefined,
        error: i % 3 === 1 ? 'Error message' : undefined,
        retryCount: 0,
        maxRetries: 3
      }))

      mockUseEmailNotification.notifications.value = manyNotifications

      const startTime = performance.now()
      wrapper = createWrapper({ showControls: true })
      const endTime = performance.now()

      // レンダリング時間が100ms以下であることを確認
      expect(endTime - startTime).toBeLessThan(100)
      
      // 基本的な要素が存在することを確認
      const statusContainer = queryByTestId(wrapper.element, 'email-notification-status')
      expect(statusContainer).toBeTruthy()
    })
  })

  describe('アクセシビリティ', () => {
    it('適切なARIA属性が設定されている', () => {
      mockUseEmailNotification.notifications.value = [{
        id: 'test-1',
        type: 'confirmation',
        status: 'sending',
        recipientEmail: mockBookingData.customerInfo.email,
        retryCount: 0,
        maxRetries: 3
      }]
      
      wrapper = createWrapper()
      
      const loadingIndicator = queryByTestId(wrapper.element, 'loading')
      expect(loadingIndicator?.getAttribute('role')).toBe('status')
      
      const hiddenText = loadingIndicator?.querySelector('.visually-hidden')
      expect(hiddenText?.textContent).toBe('送信中...')
    })

    it('エラー状態で適切なARIA属性が設定されている', () => {
      mockUseEmailNotification.notifications.value = [{
        id: 'test-1',
        type: 'confirmation',
        status: 'failed',
        recipientEmail: mockBookingData.customerInfo.email,
        error: 'エラーメッセージ',
        retryCount: 0,
        maxRetries: 3
      }]
      
      wrapper = createWrapper()
      
      const errorStatus = queryByTestId(wrapper.element, 'error-status')
      expect(errorStatus?.getAttribute('role')).toBe('alert')
    })

    it('キーボードナビゲーションに対応している', async () => {
      mockUseEmailNotification.notifications.value = [{
        id: 'test-1',
        type: 'confirmation',
        status: 'failed',
        recipientEmail: mockBookingData.customerInfo.email,
        error: 'エラーメッセージ',
        retryCount: 1,
        maxRetries: 3
      }]
      
      wrapper = createWrapper()
      
      const retryButton = queryByTestId(wrapper.element, 'retry-button') as HTMLButtonElement
      
      // フォーカス設定
      retryButton.focus()
      expect(document.activeElement).toBe(retryButton)
      
      // Enterキーでボタンをクリック
      await retryButton.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
      
      // 正常にfocusableであることを確認
      expect(retryButton.tabIndex).toBeGreaterThanOrEqual(0)
    })
  })
})