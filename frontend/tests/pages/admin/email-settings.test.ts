// email-settings ページコンポーネントのテスト

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import EmailSettingsPage from '~/pages/admin/email-settings.vue'
import {
  createMountOptions,
  expectElementToHaveText,
  expectElementToHaveClass,
  queryByTestId,
  fillFormField,
  submitForm,
  expectErrorMessage,
  expectSuccessMessage
} from '../../utils/test-helpers'

// メール通知設定モック
const mockUseEmailNotification = {
  settings: ref({
    enabled: true,
    confirmationEnabled: true,
    reminderEnabled: true,
    reminderHours: 24,
    template: 'default',
    customTemplate: ''
  }),
  notifications: ref([]),
  notificationStats: ref({
    total: 10,
    sent: 8,
    failed: 1,
    pending: 1,
    successRate: 80
  }),
  saveSettings: vi.fn(),
  getNotificationHistory: vi.fn()
}

// $fetch モック
const mockFetch = vi.fn()

vi.mock('~/composables/useEmailNotification', () => ({
  useEmailNotification: () => mockUseEmailNotification
}))

// NuxtのuseHead モック
vi.mock('#app', () => ({
  useHead: vi.fn()
}))

// definePageMeta モック
vi.mock('#imports', () => ({
  definePageMeta: vi.fn()
}))

describe('EmailSettingsPage', () => {
  let wrapper: VueWrapper<any>

  const createWrapper = (props = {}) => {
    return mount(EmailSettingsPage, {
      props,
      ...createMountOptions({
        global: {
          ...createMountOptions().global,
          mocks: {
            ...createMountOptions().global.mocks,
            $fetch: mockFetch
          }
        }
      })
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // デフォルト設定にリセット
    mockUseEmailNotification.settings.value = {
      enabled: true,
      confirmationEnabled: true,
      reminderEnabled: true,
      reminderHours: 24,
      template: 'default',
      customTemplate: ''
    }
    mockUseEmailNotification.notifications.value = []
    mockUseEmailNotification.getNotificationHistory.mockResolvedValue([])
    mockUseEmailNotification.saveSettings.mockResolvedValue(true)
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('初期表示', () => {
    it('ページが正常にマウントされる', () => {
      wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
      
      const pageElement = wrapper.find('.email-settings-page')
      expect(pageElement.exists()).toBe(true)
    })

    it('ページヘッダーが表示される', () => {
      wrapper = createWrapper()
      
      const header = wrapper.find('.page-header h1')
      expectElementToHaveText(header.element, 'メール通知設定')
      
      const description = wrapper.find('.page-header p')
      expectElementToHaveText(description.element, '予約確認やリマインダーメールの設定を管理します')
    })

    it('通知統計が表示される', () => {
      wrapper = createWrapper()
      
      const statsCards = wrapper.findAll('.card .card-title')
      expect(statsCards.length).toBeGreaterThanOrEqual(4)
      
      // 統計値の確認
      expectElementToHaveText(statsCards[0].element, '8') // 送信成功
      expectElementToHaveText(statsCards[1].element, '1') // 送信失敗  
      expectElementToHaveText(statsCards[2].element, '1') // 送信待機
      expectElementToHaveText(statsCards[3].element, '80%') // 成功率
    })

    it('基本設定フォームが表示される', () => {
      wrapper = createWrapper()
      
      const enabledSwitch = wrapper.find('#email-enabled')
      expect(enabledSwitch.exists()).toBe(true)
      expect((enabledSwitch.element as HTMLInputElement).checked).toBe(true)
      
      const confirmationSwitch = wrapper.find('#confirmation-enabled')
      expect(confirmationSwitch.exists()).toBe(true)
      expect((confirmationSwitch.element as HTMLInputElement).checked).toBe(true)
      
      const reminderSwitch = wrapper.find('#reminder-enabled')
      expect(reminderSwitch.exists()).toBe(true)
      expect((reminderSwitch.element as HTMLInputElement).checked).toBe(true)
    })
  })

  describe('基本設定', () => {
    it('メール通知無効化時に他の設定が無効になる', async () => {
      wrapper = createWrapper()
      
      const enabledSwitch = wrapper.find('#email-enabled')
      await enabledSwitch.setValue(false)
      
      const confirmationSwitch = wrapper.find('#confirmation-enabled') as any
      const reminderSwitch = wrapper.find('#reminder-enabled') as any
      
      expect(confirmationSwitch.element.disabled).toBe(true)
      expect(reminderSwitch.element.disabled).toBe(true)
    })

    it('リマインダー無効化時にリマインダー時間設定が非表示になる', async () => {
      wrapper = createWrapper()
      
      // 初期状態でリマインダー時間設定が表示されていることを確認
      let reminderHoursSelect = wrapper.find('select[v-model="localSettings.reminderHours"]')
      expect(reminderHoursSelect.exists()).toBe(true)
      
      // リマインダーを無効化
      const reminderSwitch = wrapper.find('#reminder-enabled')
      await reminderSwitch.setValue(false)
      
      // リマインダー時間設定が非表示になることを確認
      reminderHoursSelect = wrapper.find('select[v-model="localSettings.reminderHours"]')
      expect(reminderHoursSelect.exists()).toBe(false)
    })

    it('設定変更時にhasChangesがtrueになる', async () => {
      wrapper = createWrapper()
      
      // 初期状態では変更なし
      const saveButton = wrapper.find('.btn-primary') as any
      expect(saveButton.element.disabled).toBe(true)
      
      // 設定を変更
      const enabledSwitch = wrapper.find('#email-enabled')
      await enabledSwitch.setValue(false)
      
      // 保存ボタンが有効になる
      expect(saveButton.element.disabled).toBe(false)
    })
  })

  describe('テンプレート設定', () => {
    it('標準テンプレート選択時はカスタムテンプレート入力が非表示', () => {
      wrapper = createWrapper()
      
      const templateSelect = wrapper.find('select[v-model="localSettings.template"]')
      expect((templateSelect.element as HTMLSelectElement).value).toBe('default')
      
      const customTextarea = wrapper.find('.custom-template textarea')
      expect(customTextarea.exists()).toBe(false)
    })

    it('カスタムテンプレート選択時はテキストエリアが表示される', async () => {
      wrapper = createWrapper()
      
      const templateSelect = wrapper.find('select[v-model="localSettings.template"]')
      await templateSelect.setValue('custom')
      
      const customTextarea = wrapper.find('.custom-template textarea')
      expect(customTextarea.exists()).toBe(true)
      
      const helpText = wrapper.find('.form-text')
      expectElementToHaveText(helpText.element, '使用可能な変数: {customerName}, {date}, {time}, {services}, {salon}')
    })

    it('プレビューボタンクリックでプレビューが表示される', async () => {
      wrapper = createWrapper()
      
      const previewButton = wrapper.find('.btn-outline-secondary')
      await previewButton.trigger('click')
      
      const previewArea = wrapper.find('.preview-area')
      expect(previewArea.exists()).toBe(true)
      
      const previewContent = wrapper.find('.preview-content')
      expect(previewContent.exists()).toBe(true)
      expectElementToHaveText(previewContent.element, '山田太郎')
      expectElementToHaveText(previewContent.element, '2024年1月15日')
    })
  })

  describe('テスト送信', () => {
    it('テスト送信フォームが表示される', () => {
      wrapper = createWrapper()
      
      const testEmailInput = wrapper.find('input[v-model="testEmail"]')
      expect(testEmailInput.exists()).toBe(true)
      
      const testTypeSelect = wrapper.find('select[v-model="testEmailType"]')
      expect(testTypeSelect.exists()).toBe(true)
      
      const testSendButton = wrapper.find('.btn-outline-primary')
      expect(testSendButton.exists()).toBe(true)
      expectElementToHaveText(testSendButton.element, 'テスト送信')
    })

    it('メールアドレス未入力時はテスト送信ボタンが無効', () => {
      wrapper = createWrapper()
      
      const testSendButton = wrapper.find('.btn-outline-primary') as any
      expect(testSendButton.element.disabled).toBe(true)
    })

    it('メールアドレス入力時はテスト送信ボタンが有効', async () => {
      wrapper = createWrapper()
      
      const testEmailInput = wrapper.find('input[v-model="testEmail"]')
      await testEmailInput.setValue('test@example.com')
      
      const testSendButton = wrapper.find('.btn-outline-primary') as any
      expect(testSendButton.element.disabled).toBe(false)
    })

    it('テスト送信成功時に成功メッセージが表示される', async () => {
      mockFetch.mockResolvedValue({ success: true })
      wrapper = createWrapper()
      
      const testEmailInput = wrapper.find('input[v-model="testEmail"]')
      await testEmailInput.setValue('test@example.com')
      
      const testSendButton = wrapper.find('.btn-outline-primary')
      await testSendButton.trigger('click')
      
      // 非同期処理の完了を待機
      await new Promise(resolve => setTimeout(resolve, 0))
      
      const successAlert = wrapper.find('.alert-success')
      expect(successAlert.exists()).toBe(true)
      expectElementToHaveText(successAlert.element, 'テストメールを送信しました')
    })

    it('テスト送信失敗時にエラーメッセージが表示される', async () => {
      mockFetch.mockRejectedValue(new Error('APIエラー'))
      wrapper = createWrapper()
      
      const testEmailInput = wrapper.find('input[v-model="testEmail"]')
      await testEmailInput.setValue('test@example.com')
      
      const testSendButton = wrapper.find('.btn-outline-primary')
      await testSendButton.trigger('click')
      
      // 非同期処理の完了を待機
      await new Promise(resolve => setTimeout(resolve, 0))
      
      const errorAlert = wrapper.find('.alert-danger')
      expect(errorAlert.exists()).toBe(true)
      expectElementToHaveText(errorAlert.element, 'APIエラー')
    })

    it('テスト送信中はボタンが無効化される', async () => {
      // 長時間かかるAPIをモック
      let resolvePromise: Function
      const longRunningPromise = new Promise(resolve => {
        resolvePromise = resolve
      })
      mockFetch.mockReturnValue(longRunningPromise)
      
      wrapper = createWrapper()
      
      const testEmailInput = wrapper.find('input[v-model="testEmail"]')
      await testEmailInput.setValue('test@example.com')
      
      const testSendButton = wrapper.find('.btn-outline-primary')
      await testSendButton.trigger('click')
      
      // 送信中はボタンが無効化される
      expect((testSendButton.element as HTMLButtonElement).disabled).toBe(true)
      expectElementToHaveText(testSendButton.element, '送信中...')
      
      // プロミスを解決
      resolvePromise!({ success: true })
      await new Promise(resolve => setTimeout(resolve, 0))
      
      // 送信完了後はボタンが有効化される
      expect((testSendButton.element as HTMLButtonElement).disabled).toBe(false)
      expectElementToHaveText(testSendButton.element, 'テスト送信')
    })
  })

  describe('設定保存', () => {
    it('保存ボタンクリックで設定が保存される', async () => {
      wrapper = createWrapper()
      
      // 設定を変更
      const enabledSwitch = wrapper.find('#email-enabled')
      await enabledSwitch.setValue(false)
      
      // 保存実行
      const saveButton = wrapper.find('.btn-primary')
      await saveButton.trigger('click')
      
      expect(mockUseEmailNotification.saveSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false
        })
      )
    })

    it('保存成功時にhasChangesがfalseになる', async () => {
      mockUseEmailNotification.saveSettings.mockResolvedValue(true)
      wrapper = createWrapper()
      
      // 設定を変更
      const enabledSwitch = wrapper.find('#email-enabled')
      await enabledSwitch.setValue(false)
      
      // 保存実行
      const saveButton = wrapper.find('.btn-primary')
      await saveButton.trigger('click')
      
      // 非同期処理の完了を待機
      await new Promise(resolve => setTimeout(resolve, 0))
      
      // 保存ボタンが再び無効化される
      expect((saveButton.element as HTMLButtonElement).disabled).toBe(true)
    })

    it('保存中はボタンが無効化される', async () => {
      let resolvePromise: Function
      const longRunningPromise = new Promise(resolve => {
        resolvePromise = resolve
      })
      mockUseEmailNotification.saveSettings.mockReturnValue(longRunningPromise)
      
      wrapper = createWrapper()
      
      // 設定を変更
      const enabledSwitch = wrapper.find('#email-enabled')
      await enabledSwitch.setValue(false)
      
      // 保存実行
      const saveButton = wrapper.find('.btn-primary')
      await saveButton.trigger('click')
      
      // 保存中はボタンが無効化される
      expect((saveButton.element as HTMLButtonElement).disabled).toBe(true)
      
      // プロミスを解決
      resolvePromise!(true)
      await new Promise(resolve => setTimeout(resolve, 0))
    })
  })

  describe('通知履歴', () => {
    it('通知履歴がない場合のメッセージが表示される', () => {
      mockUseEmailNotification.getNotificationHistory.mockResolvedValue([])
      wrapper = createWrapper()
      
      const noHistoryMessage = wrapper.find('.text-muted.text-center')
      expectElementToHaveText(noHistoryMessage.element, '通知履歴がありません')
    })

    it('通知履歴がある場合はリストが表示される', async () => {
      const mockHistory = [
        {
          id: 'test-1',
          type: 'confirmation',
          status: 'sent',
          recipientEmail: 'test@example.com',
          sentAt: '2024-01-15T10:30:00.000Z'
        },
        {
          id: 'test-2',
          type: 'reminder',
          status: 'failed',
          recipientEmail: 'test2@example.com',
          sentAt: '2024-01-15T09:00:00.000Z'
        }
      ]
      
      mockUseEmailNotification.getNotificationHistory.mockResolvedValue(mockHistory)
      wrapper = createWrapper()
      
      // 非同期でマウント処理が完了するのを待機
      await new Promise(resolve => setTimeout(resolve, 0))
      
      const historyItems = wrapper.findAll('.notification-item')
      expect(historyItems.length).toBe(2)
      
      expectElementToHaveText(historyItems[0].element, '予約確認')
      expectElementToHaveText(historyItems[0].element, 'test@example.com')
      
      expectElementToHaveText(historyItems[1].element, 'リマインダー')
      expectElementToHaveText(historyItems[1].element, 'test2@example.com')
    })

    it('全履歴リンクが表示される', () => {
      wrapper = createWrapper()
      
      const allHistoryLink = wrapper.find('a[href="/admin/notifications"]')
      expect(allHistoryLink.exists()).toBe(true)
      expectElementToHaveText(allHistoryLink.element, '全履歴を見る')
    })
  })

  describe('アクセシビリティ', () => {
    it('フォーム要素に適切なラベルが設定されている', () => {
      wrapper = createWrapper()
      
      const enabledSwitch = wrapper.find('#email-enabled')
      const enabledLabel = wrapper.find('label[for="email-enabled"]')
      
      expect(enabledSwitch.exists()).toBe(true)
      expect(enabledLabel.exists()).toBe(true)
      expectElementToHaveText(enabledLabel.element, 'メール通知機能を有効にする')
    })

    it('ヘルプテキストが適切に設定されている', () => {
      wrapper = createWrapper()
      
      const helpTexts = wrapper.findAll('.form-text')
      expect(helpTexts.length).toBeGreaterThan(0)
      
      expectElementToHaveText(helpTexts[0].element, 'この設定を無効にすると、全てのメール通知が停止します')
    })

    it('アラートに適切なARIA属性が設定されている', async () => {
      mockFetch.mockResolvedValue({ success: true })
      wrapper = createWrapper()
      
      const testEmailInput = wrapper.find('input[v-model="testEmail"]')
      await testEmailInput.setValue('test@example.com')
      
      const testSendButton = wrapper.find('.btn-outline-primary')
      await testSendButton.trigger('click')
      
      await new Promise(resolve => setTimeout(resolve, 0))
      
      const successAlert = wrapper.find('.alert-success')
      expect(successAlert.attributes('role')).toBe('alert')
    })
  })

  describe('レスポンシブ対応', () => {
    it('モバイル表示でも適切にレンダリングされる', () => {
      wrapper = createWrapper()
      
      // グリッドレイアウトの確認
      const rows = wrapper.findAll('.row')
      expect(rows.length).toBeGreaterThan(0)
      
      // カラムの確認
      const columns = wrapper.findAll('[class*="col-"]')
      expect(columns.length).toBeGreaterThan(0)
    })
  })

  describe('エラーハンドリング', () => {
    it('API呼び出しエラー時の処理', async () => {
      mockUseEmailNotification.saveSettings.mockRejectedValue(new Error('API呼び出しエラー'))
      wrapper = createWrapper()
      
      // 設定を変更
      const enabledSwitch = wrapper.find('#email-enabled')
      await enabledSwitch.setValue(false)
      
      // 保存実行
      const saveButton = wrapper.find('.btn-primary')
      await saveButton.trigger('click')
      
      // エラー処理の確認（コンソールエラーログなど）
      expect(mockUseEmailNotification.saveSettings).toHaveBeenCalled()
    })

    it('無効な入力値の処理', async () => {
      wrapper = createWrapper()
      
      const testEmailInput = wrapper.find('input[v-model="testEmail"]')
      await testEmailInput.setValue('invalid-email')
      
      // HTML5バリデーションが働くことを期待
      const testSendButton = wrapper.find('.btn-outline-primary')
      expect(testSendButton.exists()).toBe(true)
    })
  })
})