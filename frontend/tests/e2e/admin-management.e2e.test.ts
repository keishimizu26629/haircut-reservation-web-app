// エンドツーエンドテスト - 管理者業務フロー
// 管理者による予約管理、設定変更、システム監視の完全テスト

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import AdminDashboard from '~/pages/admin/index.vue'
import AdminBookings from '~/pages/admin/bookings.vue'
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
  queryByTestId
} from '../utils/test-helpers'

// 管理者E2Eテスト用モック
const mockBookingApi = {
  getBookings: vi.fn(),
  updateBooking: vi.fn(),
  cancelBooking: vi.fn(),
  getServices: vi.fn(),
  getStylists: vi.fn(),
  getBookingStats: vi.fn(),
  exportBookings: vi.fn()
}

const mockEmailNotification = {
  notifications: ref([]),
  notificationStats: ref({
    total: 150,
    sent: 142,
    failed: 5,
    pending: 3,
    successRate: 94.7
  }),
  settings: ref({
    enabled: true,
    confirmationEnabled: true,
    reminderEnabled: true,
    reminderHours: 24,
    template: 'default',
    customTemplate: ''
  }),
  sendConfirmationEmail: vi.fn(),
  sendReminderEmail: vi.fn(),
  retryEmail: vi.fn(),
  saveSettings: vi.fn(),
  getNotificationHistory: vi.fn(),
  sendTestEmail: vi.fn()
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
    uid: 'admin-123',
    email: 'admin@salon.com',
    displayName: '管理者ユーザー',
    roles: ['admin', 'manager']
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
  checkPermissions: vi.fn()
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

describe('管理者業務フロー E2Eテスト', () => {
  let dashboardWrapper: VueWrapper<any>
  let bookingsWrapper: VueWrapper<any>
  let emailSettingsWrapper: VueWrapper<any>
  let environmentWrapper: VueWrapper<any>

  const mockBookings = [
    createMockBookingData({
      id: 'booking1',
      customerInfo: { name: '田中太郎', email: 'tanaka@example.com', phone: '090-1111-1111' },
      appointmentDate: new Date('2024-01-20T10:00:00'),
      status: 'confirmed'
    }),
    createMockBookingData({
      id: 'booking2',
      customerInfo: { name: '佐藤花子', email: 'sato@example.com', phone: '090-2222-2222' },
      appointmentDate: new Date('2024-01-20T14:00:00'),
      status: 'pending'
    }),
    createMockBookingData({
      id: 'booking3',
      customerInfo: { name: '鈴木一郎', email: 'suzuki@example.com', phone: '090-3333-3333' },
      appointmentDate: new Date('2024-01-21T11:00:00'),
      status: 'cancelled'
    })
  ]

  const mockBookingStats = {
    totalBookings: 245,
    todayBookings: 12,
    thisWeekBookings: 68,
    thisMonthBookings: 245,
    cancelledBookings: 15,
    revenue: {
      today: 48000,
      week: 272000,
      month: 980000
    },
    popularServices: [
      { name: 'カット', count: 89 },
      { name: 'カラー', count: 67 },
      { name: 'パーマ', count: 34 }
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // API モック設定
    mockBookingApi.getBookings.mockResolvedValue(mockBookings)
    mockBookingApi.updateBooking.mockResolvedValue(mockApiSuccess({}))
    mockBookingApi.cancelBooking.mockResolvedValue(mockApiSuccess({}))
    mockBookingApi.getBookingStats.mockResolvedValue(mockBookingStats)
    mockBookingApi.exportBookings.mockResolvedValue({ downloadUrl: 'http://example.com/export.csv' })
    
    // メール通知モック設定
    mockEmailNotification.getNotificationHistory.mockResolvedValue([
      {
        id: 'notif1',
        type: 'confirmation',
        status: 'sent',
        recipientEmail: 'tanaka@example.com',
        sentAt: '2024-01-15T10:30:00.000Z',
        bookingId: 'booking1'
      },
      {
        id: 'notif2',
        type: 'reminder',
        status: 'failed',
        recipientEmail: 'sato@example.com',
        sentAt: '2024-01-15T09:00:00.000Z',
        bookingId: 'booking2',
        errorMessage: 'メールアドレスが無効です'
      }
    ])
    mockEmailNotification.saveSettings.mockResolvedValue(true)
    mockEmailNotification.sendTestEmail.mockResolvedValue(true)
    mockEmailNotification.retryEmail.mockResolvedValue(true)
    
    // Firebase設定モック
    mockFirebaseConfig.checkFirebaseConnection.mockResolvedValue(true)
    mockFirebaseConfig.getEmulatorInfo.mockReturnValue({
      auth: 'http://localhost:9099',
      firestore: 'localhost:8080',
      storage: 'localhost:9199',
      functions: 'localhost:5001'
    })
    
    // 認証モック
    mockAuth.checkPermissions.mockResolvedValue(true)
  })

  afterEach(() => {
    if (dashboardWrapper) dashboardWrapper.unmount()
    if (bookingsWrapper) bookingsWrapper.unmount()
    if (emailSettingsWrapper) emailSettingsWrapper.unmount()
    if (environmentWrapper) environmentWrapper.unmount()
  })

  describe('ダッシュボード管理フロー', () => {
    it('管理者ログインから統計確認までの完全フロー', async () => {
      // === 1. ダッシュボード初期化 ===
      dashboardWrapper = mount(AdminDashboard, createMountOptions())
      await dashboardWrapper.vm.$nextTick()

      // 権限確認
      expect(mockAuth.checkPermissions).toHaveBeenCalledWith(['admin', 'manager'])

      // === 2. 統計データ表示確認 ===
      expect(mockBookingApi.getBookingStats).toHaveBeenCalled()

      // 本日の予約数
      const todayBookings = dashboardWrapper.find('[data-testid="today-bookings"]')
      expectElementToHaveText(todayBookings.element, '12件')

      // 今週の予約数
      const weekBookings = dashboardWrapper.find('[data-testid="week-bookings"]')
      expectElementToHaveText(weekBookings.element, '68件')

      // 今月の売上
      const monthRevenue = dashboardWrapper.find('[data-testid="month-revenue"]')
      expectElementToHaveText(monthRevenue.element, '980,000円')

      // === 3. 人気サービスランキング ===
      const popularServices = dashboardWrapper.findAll('[data-testid="popular-service"]')
      expect(popularServices.length).toBe(3)
      
      expectElementToHaveText(popularServices[0].element, 'カット')
      expectElementToHaveText(popularServices[0].element, '89件')
      
      expectElementToHaveText(popularServices[1].element, 'カラー')
      expectElementToHaveText(popularServices[1].element, '67件')

      // === 4. メール通知統計 ===
      const emailStats = dashboardWrapper.find('[data-testid="email-stats"]')
      expect(emailStats.exists()).toBe(true)
      
      expectElementToHaveText(emailStats.element, '142件送信成功')
      expectElementToHaveText(emailStats.element, '5件送信失敗')
      expectElementToHaveText(emailStats.element, '成功率: 94.7%')

      // === 5. 最新の予約情報 ===
      const recentBookings = dashboardWrapper.findAll('[data-testid="recent-booking"]')
      expect(recentBookings.length).toBeGreaterThan(0)
      
      expectElementToHaveText(recentBookings[0].element, '田中太郎')
      expectElementToHaveText(recentBookings[0].element, '1月20日 10:00')

      // === 6. クイックアクション ===
      const quickActions = dashboardWrapper.find('[data-testid="quick-actions"]')
      expect(quickActions.exists()).toBe(true)

      // 予約一覧へのリンク
      const bookingsLink = dashboardWrapper.find('[data-testid="bookings-link"]')
      expect(bookingsLink.exists()).toBe(true)

      // メール設定へのリンク
      const emailSettingsLink = dashboardWrapper.find('[data-testid="email-settings-link"]')
      expect(emailSettingsLink.exists()).toBe(true)
    })

    it('リアルタイム統計更新フロー', async () => {
      dashboardWrapper = mount(AdminDashboard, createMountOptions())
      await dashboardWrapper.vm.$nextTick()

      // 初期統計確認
      const initialTodayBookings = dashboardWrapper.find('[data-testid="today-bookings"]')
      expectElementToHaveText(initialTodayBookings.element, '12件')

      // === 新しい予約データをシミュレート ===
      const updatedStats = { ...mockBookingStats, todayBookings: 15 }
      mockBookingApi.getBookingStats.mockResolvedValue(updatedStats)

      // 統計更新ボタン
      const refreshButton = dashboardWrapper.find('[data-testid="refresh-stats"]')
      await refreshButton.trigger('click')

      // API再呼び出し確認
      expect(mockBookingApi.getBookingStats).toHaveBeenCalledTimes(2)

      // 更新された値の表示確認
      await dashboardWrapper.vm.$nextTick()
      const updatedTodayBookings = dashboardWrapper.find('[data-testid="today-bookings"]')
      expectElementToHaveText(updatedTodayBookings.element, '15件')
    })
  })

  describe('予約管理フロー', () => {
    it('予約一覧から編集・キャンセルまでの完全フロー', async () => {
      // === 1. 予約一覧ページ初期化 ===
      bookingsWrapper = mount(AdminBookings, createMountOptions())
      await bookingsWrapper.vm.$nextTick()

      expect(mockBookingApi.getBookings).toHaveBeenCalled()

      // === 2. 予約一覧表示確認 ===
      const bookingRows = bookingsWrapper.findAll('[data-testid="booking-row"]')
      expect(bookingRows.length).toBe(3)

      // 各予約の基本情報確認
      expectElementToHaveText(bookingRows[0].element, '田中太郎')
      expectElementToHaveText(bookingRows[0].element, 'confirmed')
      
      expectElementToHaveText(bookingRows[1].element, '佐藤花子')
      expectElementToHaveText(bookingRows[1].element, 'pending')

      // === 3. 予約ステータスフィルタリング ===
      const statusFilter = bookingsWrapper.find('[data-testid="status-filter"]')
      await statusFilter.setValue('pending')

      // pending状態の予約のみ表示
      await bookingsWrapper.vm.$nextTick()
      const filteredRows = bookingsWrapper.findAll('[data-testid="booking-row"]:not(.d-none)')
      expect(filteredRows.length).toBe(1)
      expectElementToHaveText(filteredRows[0].element, '佐藤花子')

      // フィルタリセット
      await statusFilter.setValue('all')

      // === 4. 予約詳細モーダル表示 ===
      const detailButton = bookingRows[0].find('[data-testid="detail-button"]')
      await detailButton.trigger('click')

      const detailModal = await waitForElement(
        bookingsWrapper.element,
        '[data-testid="booking-detail-modal"]'
      )
      expect(detailModal).toBeTruthy()

      // 詳細情報確認
      expectElementToHaveText(detailModal, '田中太郎')
      expectElementToHaveText(detailModal, 'tanaka@example.com')
      expectElementToHaveText(detailModal, '090-1111-1111')

      // === 5. ステータス変更 ===
      const statusSelect = bookingsWrapper.find('[data-testid="status-edit-select"]')
      await statusSelect.setValue('completed')

      const updateButton = bookingsWrapper.find('[data-testid="update-status-button"]')
      await updateButton.trigger('click')

      expect(mockBookingApi.updateBooking).toHaveBeenCalledWith('booking1', {
        status: 'completed'
      })

      expectSuccessMessage(bookingsWrapper, '予約ステータスを更新しました')

      // === 6. 予約キャンセル ===
      const cancelButton = bookingRows[1].find('[data-testid="cancel-button"]')
      await cancelButton.trigger('click')

      // 確認ダイアログ
      const confirmDialog = await waitForElement(
        bookingsWrapper.element,
        '[data-testid="cancel-confirm-dialog"]'
      )
      expect(confirmDialog).toBeTruthy()

      const confirmCancelButton = bookingsWrapper.find('[data-testid="confirm-cancel-button"]')
      await confirmCancelButton.trigger('click')

      expect(mockBookingApi.cancelBooking).toHaveBeenCalledWith('booking2')
      expectSuccessMessage(bookingsWrapper, '予約をキャンセルしました')

      // === 7. メール通知送信 ===
      const sendNotificationButton = bookingRows[0].find('[data-testid="send-notification-button"]')
      await sendNotificationButton.trigger('click')

      // 通知タイプ選択
      const notificationTypeSelect = bookingsWrapper.find('[data-testid="notification-type-select"]')
      await notificationTypeSelect.setValue('reminder')

      const sendButton = bookingsWrapper.find('[data-testid="send-notification-confirm"]')
      await sendButton.trigger('click')

      expect(mockEmailNotification.sendReminderEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'booking1'
        })
      )
    })

    it('予約データエクスポート機能フロー', async () => {
      bookingsWrapper = mount(AdminBookings, createMountOptions())
      await bookingsWrapper.vm.$nextTick()

      // === 1. エクスポート条件設定 ===
      const exportDateFrom = bookingsWrapper.find('[data-testid="export-date-from"]')
      await exportDateFrom.setValue('2024-01-01')

      const exportDateTo = bookingsWrapper.find('[data-testid="export-date-to"]')
      await exportDateTo.setValue('2024-01-31')

      const exportFormat = bookingsWrapper.find('[data-testid="export-format"]')
      await exportFormat.setValue('csv')

      // === 2. エクスポート実行 ===
      const exportButton = bookingsWrapper.find('[data-testid="export-button"]')
      await exportButton.trigger('click')

      expect(mockBookingApi.exportBookings).toHaveBeenCalledWith({
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
        format: 'csv'
      })

      // === 3. ダウンロードリンク表示 ===
      const downloadLink = await waitForElement(
        bookingsWrapper.element,
        '[data-testid="download-link"]'
      )
      expect(downloadLink).toBeTruthy()
      expect(downloadLink.getAttribute('href')).toBe('http://example.com/export.csv')
    })
  })

  describe('メール設定管理フロー', () => {
    it('メール設定変更とテスト送信の完全フロー', async () => {
      // === 1. メール設定ページ初期化 ===
      emailSettingsWrapper = mount(EmailSettingsPage, createMountOptions())
      await emailSettingsWrapper.vm.$nextTick()

      // 統計表示確認
      const emailStats = emailSettingsWrapper.find('[data-testid="email-statistics"]')
      expect(emailStats.exists()).toBe(true)
      expectElementToHaveText(emailStats.element, '142件送信成功')
      expectElementToHaveText(emailStats.element, '5件送信失敗')

      // === 2. 現在設定確認 ===
      const enabledSwitch = emailSettingsWrapper.find('#email-enabled') as any
      expect(enabledSwitch.element.checked).toBe(true)

      const confirmationSwitch = emailSettingsWrapper.find('#confirmation-enabled') as any
      expect(confirmationSwitch.element.checked).toBe(true)

      // === 3. 詳細設定変更 ===
      // リマインダー有効化
      const reminderSwitch = emailSettingsWrapper.find('#reminder-enabled')
      await reminderSwitch.setValue(true)

      // リマインダー送信時間変更
      const reminderHoursSelect = emailSettingsWrapper.find('select[v-model="localSettings.reminderHours"]')
      await reminderHoursSelect.setValue(48)

      // カスタムテンプレート使用
      const templateSelect = emailSettingsWrapper.find('select[v-model="localSettings.template"]')
      await templateSelect.setValue('custom')

      // カスタムテンプレート入力
      const customTemplate = `
        {customerName}様

        ご予約の確認です。

        予約詳細:
        • 日時: {date} {time}
        • サービス: {services}
        • 合計金額: {totalPrice}円

        ご来店をお待ちしております。

        {salon}
      `

      const customTemplateTextarea = emailSettingsWrapper.find('.custom-template textarea')
      await customTemplateTextarea.setValue(customTemplate)

      // === 4. テンプレートプレビュー ===
      const previewButton = emailSettingsWrapper.find('[data-testid="preview-button"]')
      await previewButton.trigger('click')

      const previewModal = await waitForElement(
        emailSettingsWrapper.element,
        '[data-testid="template-preview"]'
      )
      expect(previewModal).toBeTruthy()

      // プレビュー内容確認
      expectElementToHaveText(previewModal, '山田太郎様')
      expectElementToHaveText(previewModal, '2024年1月15日')

      // プレビュークローズ
      const closePreviewButton = emailSettingsWrapper.find('[data-testid="close-preview"]')
      await closePreviewButton.trigger('click')

      // === 5. テストメール送信 ===
      const testEmailInput = emailSettingsWrapper.find('[data-testid="test-email-input"]')
      await testEmailInput.setValue('test@admin.com')

      const testTypeSelect = emailSettingsWrapper.find('[data-testid="test-type-select"]')
      await testTypeSelect.setValue('confirmation')

      const sendTestButton = emailSettingsWrapper.find('[data-testid="send-test-button"]')
      await sendTestButton.trigger('click')

      expect(mockEmailNotification.sendTestEmail).toHaveBeenCalledWith(
        'test@admin.com',
        'confirmation',
        expect.objectContaining({
          template: 'custom',
          customTemplate: customTemplate
        })
      )

      expectSuccessMessage(emailSettingsWrapper, 'テストメールを送信しました')

      // === 6. 設定保存 ===
      const saveButton = emailSettingsWrapper.find('[data-testid="save-settings-button"]')
      await saveButton.trigger('click')

      expect(mockEmailNotification.saveSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          reminderEnabled: true,
          reminderHours: 48,
          template: 'custom',
          customTemplate: customTemplate
        })
      )

      expectSuccessMessage(emailSettingsWrapper, '設定を保存しました')
    })

    it('メール送信履歴管理と再送信フロー', async () => {
      emailSettingsWrapper = mount(EmailSettingsPage, createMountOptions())
      await emailSettingsWrapper.vm.$nextTick()

      // === 1. 送信履歴表示 ===
      expect(mockEmailNotification.getNotificationHistory).toHaveBeenCalled()

      const historyList = emailSettingsWrapper.find('[data-testid="notification-history"]')
      expect(historyList.exists()).toBe(true)

      const historyItems = emailSettingsWrapper.findAll('[data-testid="history-item"]')
      expect(historyItems.length).toBe(2)

      // 成功した送信の確認
      expectElementToHaveText(historyItems[0].element, '予約確認')
      expectElementToHaveText(historyItems[0].element, 'tanaka@example.com')
      expectElementToHaveText(historyItems[0].element, '送信成功')

      // 失敗した送信の確認
      expectElementToHaveText(historyItems[1].element, 'リマインダー')
      expectElementToHaveText(historyItems[1].element, 'sato@example.com')
      expectElementToHaveText(historyItems[1].element, '送信失敗')

      // === 2. 失敗メールの再送信 ===
      const retryButton = historyItems[1].find('[data-testid="retry-button"]')
      expect(retryButton.exists()).toBe(true)

      await retryButton.trigger('click')

      // 再送信確認ダイアログ
      const retryConfirm = await waitForElement(
        emailSettingsWrapper.element,
        '[data-testid="retry-confirm-dialog"]'
      )
      expect(retryConfirm).toBeTruthy()

      const confirmRetryButton = emailSettingsWrapper.find('[data-testid="confirm-retry-button"]')
      await confirmRetryButton.trigger('click')

      expect(mockEmailNotification.retryEmail).toHaveBeenCalledWith('notif2')
      expectSuccessMessage(emailSettingsWrapper, 'メールを再送信しました')

      // === 3. 履歴フィルタリング ===
      const statusFilter = emailSettingsWrapper.find('[data-testid="history-status-filter"]')
      await statusFilter.setValue('failed')

      // 失敗したメールのみ表示
      await emailSettingsWrapper.vm.$nextTick()
      const filteredItems = emailSettingsWrapper.findAll('[data-testid="history-item"]:not(.d-none)')
      expect(filteredItems.length).toBe(1)
      expectElementToHaveText(filteredItems[0].element, '送信失敗')
    })
  })

  describe('Firebase環境管理フロー', () => {
    it('環境切り替えと設定確認の完全フロー', async () => {
      // === 1. 環境スイッチャー初期化 ===
      environmentWrapper = mount(EnvironmentSwitcher, createMountOptions())
      await environmentWrapper.vm.$nextTick()

      // 初期状態確認（開発環境）
      const environmentBadge = environmentWrapper.find('[data-testid="environment-badge"]')
      expectElementToHaveText(environmentBadge.element, 'DEVELOPMENT')
      expectElementToHaveClass(environmentBadge.element, 'bg-success')

      // 接続状態確認
      const connectionBadge = environmentWrapper.find('[data-testid="connection-badge"]')
      expectElementToHaveText(connectionBadge.element, '接続済み')

      // === 2. エミュレーター情報確認 ===
      const emulatorInfo = environmentWrapper.find('[data-testid="emulator-info"]')
      expect(emulatorInfo.exists()).toBe(true)
      expectElementToHaveText(emulatorInfo.element, 'Auth: http://localhost:9099')
      expectElementToHaveText(emulatorInfo.element, 'Firestore: localhost:8080')

      // === 3. 接続テスト実行 ===
      const testConnectionButton = environmentWrapper.find('[data-testid="test-connection-button"]')
      await testConnectionButton.trigger('click')

      expect(mockFirebaseConfig.checkFirebaseConnection).toHaveBeenCalled()

      // 接続成功メッセージ
      const connectionSuccess = await waitForElement(
        environmentWrapper.element,
        '[data-testid="connection-success"]'
      )
      expect(connectionSuccess).toBeTruthy()

      // === 4. 本番環境への切り替え ===
      const prodRadio = environmentWrapper.find('#env-prod')
      await prodRadio.setValue(true)

      // 変更警告表示
      const changeWarning = environmentWrapper.find('[data-testid="change-warning"]')
      expect(changeWarning.exists()).toBe(true)
      expectElementToHaveText(changeWarning.element, '設定を変更するにはページをリロードする必要があります')

      // エミュレータースイッチ無効化確認
      const emulatorSwitch = environmentWrapper.find('#emulator-switch') as any
      expect(emulatorSwitch.element.disabled).toBe(true)

      // === 5. 設定適用（リロード） ===
      const applyButton = environmentWrapper.find('[data-testid="apply-changes-button"]')
      const mockReload = vi.fn()
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true
      })

      await applyButton.trigger('click')
      expect(mockReload).toHaveBeenCalled()

      // === 6. 本番環境での再確認（リロード後をシミュレート） ===
      mockFirebaseConfig.currentEnvironment.value = 'production'
      mockFirebaseConfig.useEmulator.value = false
      mockFirebaseConfig.getEmulatorInfo.mockReturnValue(null)

      environmentWrapper.unmount()
      environmentWrapper = mount(EnvironmentSwitcher, createMountOptions())
      await environmentWrapper.vm.$nextTick()

      // 本番環境バッジ確認
      const prodBadge = environmentWrapper.find('[data-testid="environment-badge"]')
      expectElementToHaveText(prodBadge.element, 'PRODUCTION')
      expectElementToHaveClass(prodBadge.element, 'bg-danger')

      // エミュレーター情報非表示確認
      const emulatorInfoAfter = environmentWrapper.find('[data-testid="emulator-info"]')
      expect(emulatorInfoAfter.exists()).toBe(false)
    })

    it('Firebase接続エラー処理と回復フロー', async () => {
      // === 1. 接続エラー状態での初期化 ===
      mockFirebaseConfig.connectionStatus.value = 'error'
      mockFirebaseConfig.lastError.value = 'Firestore connection timeout'
      mockFirebaseConfig.checkFirebaseConnection.mockResolvedValue(false)

      environmentWrapper = mount(EnvironmentSwitcher, createMountOptions())
      await environmentWrapper.vm.$nextTick()

      // エラー状態表示確認
      const errorBadge = environmentWrapper.find('[data-testid="connection-badge"]')
      expectElementToHaveText(errorBadge.element, 'エラー')
      expectElementToHaveClass(errorBadge.element, 'bg-danger')

      // エラー詳細表示
      const errorDetails = environmentWrapper.find('[data-testid="error-details"]')
      expect(errorDetails.exists()).toBe(true)
      expectElementToHaveText(errorDetails.element, 'Firestore connection timeout')

      // === 2. 管理者ダッシュボードでのエラー警告 ===
      dashboardWrapper = mount(AdminDashboard, createMountOptions())
      await dashboardWrapper.vm.$nextTick()

      const systemAlert = dashboardWrapper.find('[data-testid="system-alert"]')
      expect(systemAlert.exists()).toBe(true)
      expectElementToHaveClass(systemAlert.element, 'alert-danger')
      expectElementToHaveText(systemAlert.element, 'Firebase接続エラーが発生しています')

      // === 3. 手動での接続回復試行 ===
      const retryButton = environmentWrapper.find('[data-testid="retry-connection-button"]')
      await retryButton.trigger('click')

      // 接続中状態表示
      mockFirebaseConfig.connectionStatus.value = 'connecting'
      await environmentWrapper.vm.$nextTick()

      const connectingBadge = environmentWrapper.find('[data-testid="connection-badge"]')
      expectElementToHaveText(connectingBadge.element, '接続中')
      expectElementToHaveClass(connectingBadge.element, 'bg-warning')

      // === 4. 接続回復成功 ===
      mockFirebaseConfig.connectionStatus.value = 'connected'
      mockFirebaseConfig.lastError.value = null
      mockFirebaseConfig.checkFirebaseConnection.mockResolvedValue(true)

      // 状態更新をトリガー
      const refreshButton = environmentWrapper.find('[data-testid="refresh-status-button"]')
      await refreshButton.trigger('click')

      await environmentWrapper.vm.$nextTick()

      // 接続成功状態確認
      const connectedBadge = environmentWrapper.find('[data-testid="connection-badge"]')
      expectElementToHaveText(connectedBadge.element, '接続済み')
      expectElementToHaveClass(connectedBadge.element, 'bg-success')

      // エラー詳細非表示確認
      const errorDetailsAfter = environmentWrapper.find('[data-testid="error-details"]')
      expect(errorDetailsAfter.exists()).toBe(false)
    })
  })

  describe('統合管理フロー', () => {
    it('複数機能連携による完全管理フロー', async () => {
      // === 1. ダッシュボードからの一元管理開始 ===
      dashboardWrapper = mount(AdminDashboard, createMountOptions())
      await dashboardWrapper.vm.$nextTick()

      // 緊急度の高いアラート確認
      const urgentAlerts = dashboardWrapper.find('[data-testid="urgent-alerts"]')
      expect(urgentAlerts.exists()).toBe(true)

      // === 2. メール送信失敗への対応 ===
      // ダッシュボードから失敗メール確認
      const failedEmailsAlert = dashboardWrapper.find('[data-testid="failed-emails-alert"]')
      expectElementToHaveText(failedEmailsAlert.element, '5件のメール送信失敗')

      // メール設定ページに遷移
      const fixEmailsButton = dashboardWrapper.find('[data-testid="fix-emails-button"]')
      await fixEmailsButton.trigger('click')

      emailSettingsWrapper = mount(EmailSettingsPage, createMountOptions())
      await emailSettingsWrapper.vm.$nextTick()

      // 失敗メール一括再送信
      const bulkRetryButton = emailSettingsWrapper.find('[data-testid="bulk-retry-button"]')
      await bulkRetryButton.trigger('click')

      // 確認ダイアログ
      const confirmBulkRetry = await waitForElement(
        emailSettingsWrapper.element,
        '[data-testid="bulk-retry-confirm"]'
      )
      const confirmButton = emailSettingsWrapper.find('[data-testid="confirm-bulk-retry-button"]')
      await confirmButton.trigger('click')

      // 一括再送信実行確認
      expect(mockEmailNotification.retryEmail).toHaveBeenCalledTimes(5) // 失敗分全て

      expectSuccessMessage(emailSettingsWrapper, '5件のメールを再送信しました')

      // === 3. 予約管理での即時対応 ===
      bookingsWrapper = mount(AdminBookings, createMountOptions())
      await bookingsWrapper.vm.$nextTick()

      // 今日の予約で確認待ちのものを一括承認
      const pendingBookings = bookingsWrapper.findAll('[data-booking-status="pending"]')
      expect(pendingBookings.length).toBeGreaterThan(0)

      const bulkApproveButton = bookingsWrapper.find('[data-testid="bulk-approve-button"]')
      await bulkApproveButton.trigger('click')

      // 一括承認実行
      const confirmBulkApprove = bookingsWrapper.find('[data-testid="confirm-bulk-approve"]')
      await confirmBulkApprove.trigger('click')

      // 一括更新API呼び出し確認
      pendingBookings.forEach((_, index) => {
        expect(mockBookingApi.updateBooking).toHaveBeenNthCalledWith(
          index + 1,
          expect.any(String),
          { status: 'confirmed' }
        )
      })

      // === 4. システム状態最終確認 ===
      dashboardWrapper.unmount()
      dashboardWrapper = mount(AdminDashboard, createMountOptions())
      await dashboardWrapper.vm.$nextTick()

      // 改善された統計確認
      const improvedEmailStats = dashboardWrapper.find('[data-testid="email-stats"]')
      expectElementToHaveText(improvedEmailStats.element, '0件送信失敗') // 再送信で解決

      const improvedBookingStats = dashboardWrapper.find('[data-testid="booking-stats"]')
      expectElementToHaveText(improvedBookingStats.element, '0件確認待ち') // 一括承認で解決

      // システム健全性確認
      const systemHealth = dashboardWrapper.find('[data-testid="system-health"]')
      expectElementToHaveClass(systemHealth.element, 'bg-success')
      expectElementToHaveText(systemHealth.element, 'システム正常')
    })
  })
})