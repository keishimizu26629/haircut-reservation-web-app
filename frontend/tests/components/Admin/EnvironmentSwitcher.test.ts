// EnvironmentSwitcher コンポーネントのテスト

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import EnvironmentSwitcher from '~/components/Admin/EnvironmentSwitcher.vue'
import {
  createMountOptions,
  expectElementToHaveText,
  expectElementToHaveClass,
  queryByTestId,
  waitForElement,
  fillFormField
} from '../../utils/test-helpers'

// Firebase設定モック
const mockUseFirebaseConfig = {
  currentEnvironment: ref('development'),
  useEmulator: ref(true),
  connectionStatus: ref('connected'),
  lastError: ref(null),
  checkFirebaseConnection: vi.fn(),
  toggleEmulatorUsage: vi.fn(),
  switchEnvironment: vi.fn(),
  getEmulatorInfo: vi.fn(),
  measureConnectionLatency: vi.fn(),
  performHealthCheck: vi.fn(),
  persistEnvironmentSettings: vi.fn()
}

vi.mock('~/composables/useFirebaseConfig', () => ({
  useFirebaseConfig: () => mockUseFirebaseConfig
}))

describe('EnvironmentSwitcher', () => {
  let wrapper: VueWrapper<any>

  const createWrapper = (props = {}) => {
    return mount(EnvironmentSwitcher, {
      props,
      ...createMountOptions()
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // デフォルト状態にリセット
    mockUseFirebaseConfig.currentEnvironment.value = 'development'
    mockUseFirebaseConfig.useEmulator.value = true
    mockUseFirebaseConfig.connectionStatus.value = 'connected'
    mockUseFirebaseConfig.lastError.value = null
    mockUseFirebaseConfig.getEmulatorInfo.mockReturnValue({
      auth: 'http://localhost:9099',
      firestore: 'localhost:8080',
      storage: 'localhost:9199',
      functions: 'localhost:5001'
    })
    mockUseFirebaseConfig.measureConnectionLatency.mockResolvedValue(50)
    mockUseFirebaseConfig.performHealthCheck.mockResolvedValue({
      errors: [],
      warnings: [],
      environment: 'development',
      latency: 50,
      useEmulator: true
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('初期表示', () => {
    it('コンポーネントが正常にマウントされる', () => {
      wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
      
      const switcherElement = wrapper.find('.environment-switcher')
      expect(switcherElement.exists()).toBe(true)
    })

    it('開発環境バッジが表示される', () => {
      wrapper = createWrapper()
      
      const environmentBadge = wrapper.find('.badge.bg-success')
      expect(environmentBadge.exists()).toBe(true)
      expectElementToHaveText(environmentBadge.element, 'DEVELOPMENT')
    })

    it('接続状態バッジが表示される', () => {
      wrapper = createWrapper()
      
      const connectionBadge = wrapper.find('.badge.bg-success')
      expect(connectionBadge.exists()).toBe(true)
      
      const connectionIcon = wrapper.find('.bi-check-circle-fill')
      expect(connectionIcon.exists()).toBe(true)
    })

    it('環境選択ラジオボタンが正しく設定される', () => {
      wrapper = createWrapper()
      
      const devRadio = wrapper.find('#env-dev') as any
      const prodRadio = wrapper.find('#env-prod') as any
      
      expect(devRadio.element.checked).toBe(true)
      expect(prodRadio.element.checked).toBe(false)
    })

    it('エミュレータースイッチが有効になっている', () => {
      wrapper = createWrapper()
      
      const emulatorSwitch = wrapper.find('#emulator-switch') as any
      expect(emulatorSwitch.element.checked).toBe(true)
      expect(emulatorSwitch.element.disabled).toBe(false)
    })
  })

  describe('環境切り替え', () => {
    it('staging環境に切り替えができる', async () => {
      mockUseFirebaseConfig.currentEnvironment.value = 'staging'
      wrapper = createWrapper()
      
      const environmentBadge = wrapper.find('[data-testid="environment-badge"]')
      expect(environmentBadge.text()).toContain('STAGING')
      expect(environmentBadge.classes()).toContain('bg-warning')
    })

    it('3つの環境（dev/staging/prod）が選択可能', () => {
      wrapper = createWrapper()
      
      const devRadio = wrapper.find('#env-dev')
      const stagingRadio = wrapper.find('#env-staging')
      const prodRadio = wrapper.find('#env-prod')
      
      expect(devRadio.exists()).toBe(true)
      expect(stagingRadio.exists()).toBe(true)
      expect(prodRadio.exists()).toBe(true)
    })

    it('本番環境に切り替えるとエミュレータースイッチが無効化される', async () => {
      wrapper = createWrapper()
      
      const prodRadio = wrapper.find('#env-prod')
      await prodRadio.setValue(true)
      
      const emulatorSwitch = wrapper.find('#emulator-switch') as any
      expect(emulatorSwitch.element.disabled).toBe(true)
    })

    it('環境変更時に未保存変更警告が表示される', async () => {
      wrapper = createWrapper()
      
      const prodRadio = wrapper.find('#env-prod')
      await prodRadio.setValue(true)
      
      const warningAlert = wrapper.find('.alert-warning')
      expect(warningAlert.exists()).toBe(true)
      expectElementToHaveText(warningAlert.element, '設定を変更するにはページをリロードする必要があります')
    })

    it('リロードボタンクリックでページリロードが実行される', async () => {
      // window.location.reload をモック
      const mockReload = vi.fn()
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true
      })

      wrapper = createWrapper()
      
      // 環境変更して警告を表示
      const prodRadio = wrapper.find('#env-prod')
      await prodRadio.setValue(true)
      
      const reloadButton = wrapper.find('.btn-warning')
      await reloadButton.trigger('click')
      
      expect(mockReload).toHaveBeenCalled()
    })
  })

  describe('エミュレーター設定', () => {
    it('エミュレーター情報が正しく表示される', () => {
      wrapper = createWrapper()
      
      const emulatorInfo = wrapper.find('.emulator-info')
      expect(emulatorInfo.exists()).toBe(true)
      
      expectElementToHaveText(emulatorInfo.element, 'Auth: http://localhost:9099')
      expectElementToHaveText(emulatorInfo.element, 'Firestore: localhost:8080')
      expectElementToHaveText(emulatorInfo.element, 'Storage: localhost:9199')
      expectElementToHaveText(emulatorInfo.element, 'Functions: localhost:5001')
    })

    it('エミュレーター無効時は情報が表示されない', async () => {
      mockUseFirebaseConfig.useEmulator.value = false
      mockUseFirebaseConfig.getEmulatorInfo.mockReturnValue(null)
      
      wrapper = createWrapper()
      
      const emulatorInfo = wrapper.find('.emulator-info')
      expect(emulatorInfo.exists()).toBe(false)
    })

    it('エミュレータートグル時にhandleEmulatorToggleが実行される', async () => {
      wrapper = createWrapper()
      
      const emulatorSwitch = wrapper.find('#emulator-switch')
      await emulatorSwitch.setValue(false)
      
      // 未保存変更警告が表示されることを確認
      const warningAlert = wrapper.find('.alert-warning')
      expect(warningAlert.exists()).toBe(true)
    })
  })

  describe('接続状態表示', () => {
    it('接続中状態が正しく表示される', () => {
      mockUseFirebaseConfig.connectionStatus.value = 'connecting'
      wrapper = createWrapper()
      
      const connectionBadge = wrapper.find('.badge.bg-warning')
      expect(connectionBadge.exists()).toBe(true)
      
      const spinIcon = wrapper.find('.bi-arrow-clockwise.fa-spin')
      expect(spinIcon.exists()).toBe(true)
      
      expectElementToHaveText(connectionBadge.element, '接続確認中')
    })

    it('接続エラー状態が正しく表示される', () => {
      mockUseFirebaseConfig.connectionStatus.value = 'error'
      mockUseFirebaseConfig.lastError.value = 'Firebase接続エラーが発生しました'
      wrapper = createWrapper()
      
      const connectionBadge = wrapper.find('.badge.bg-danger')
      expect(connectionBadge.exists()).toBe(true)
      
      const errorAlert = wrapper.find('.alert-danger')
      expect(errorAlert.exists()).toBe(true)
      expectElementToHaveText(errorAlert.element, 'Firebase接続エラーが発生しました')
    })

    it('リフレッシュボタンクリックで接続確認が実行される', async () => {
      wrapper = createWrapper()
      
      const refreshButton = wrapper.find('.btn-outline-secondary')
      await refreshButton.trigger('click')
      
      expect(mockUseFirebaseConfig.checkFirebaseConnection).toHaveBeenCalled()
    })

    it('接続中はリフレッシュボタンが無効化される', () => {
      mockUseFirebaseConfig.connectionStatus.value = 'connecting'
      wrapper = createWrapper()
      
      const refreshButton = wrapper.find('.btn-outline-secondary') as any
      expect(refreshButton.element.disabled).toBe(true)
    })
  })

  describe('接続テスト', () => {
    it('接続テストボタンクリックでテストが実行される', async () => {
      mockUseFirebaseConfig.checkFirebaseConnection.mockResolvedValue(true)
      wrapper = createWrapper()
      
      const testButton = wrapper.find('.btn-outline-info')
      await testButton.trigger('click')
      
      expect(mockUseFirebaseConfig.checkFirebaseConnection).toHaveBeenCalled()
    })

    it('接続中は接続テストボタンが無効化される', () => {
      mockUseFirebaseConfig.connectionStatus.value = 'connecting'
      wrapper = createWrapper()
      
      const testButton = wrapper.find('.btn-outline-info') as any
      expect(testButton.element.disabled).toBe(true)
    })

    it('接続テスト成功時にコンソールログが出力される', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      mockUseFirebaseConfig.checkFirebaseConnection.mockResolvedValue(true)
      
      wrapper = createWrapper()
      
      const testButton = wrapper.find('.btn-outline-info')
      await testButton.trigger('click')
      
      // 非同期処理の完了を待機
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(consoleSpy).toHaveBeenCalledWith('✅ Firebase接続テスト成功')
      
      consoleSpy.mockRestore()
    })

    it('接続テスト失敗時にエラーログが出力される', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockUseFirebaseConfig.checkFirebaseConnection.mockResolvedValue(false)
      
      wrapper = createWrapper()
      
      const testButton = wrapper.find('.btn-outline-info')
      await testButton.trigger('click')
      
      // 非同期処理の完了を待機
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Firebase接続テスト失敗')
      
      consoleErrorSpy.mockRestore()
    })
  })

  describe('レスポンシブ対応', () => {
    it('モバイル表示でも適切にレンダリングされる', () => {
      wrapper = createWrapper()
      
      // 基本構造の確認
      const environmentSwitcher = wrapper.find('.environment-switcher')
      expect(environmentSwitcher.exists()).toBe(true)
      
      const environmentStatus = wrapper.find('.environment-status')
      expect(environmentStatus.exists()).toBe(true)
      
      const environmentControls = wrapper.find('.environment-controls')
      expect(environmentControls.exists()).toBe(true)
    })

    it('ボタングループが適切に表示される', () => {
      wrapper = createWrapper()
      
      const btnGroup = wrapper.find('.btn-group')
      expect(btnGroup.exists()).toBe(true)
      
      const devLabel = wrapper.find('label[for="env-dev"]')
      const prodLabel = wrapper.find('label[for="env-prod"]')
      
      expect(devLabel.exists()).toBe(true)
      expect(prodLabel.exists()).toBe(true)
    })
  })

  describe('アクセシビリティ', () => {
    it('ラジオボタンに適切なラベルが設定されている', () => {
      wrapper = createWrapper()
      
      const devRadio = wrapper.find('#env-dev')
      const devLabel = wrapper.find('label[for="env-dev"]')
      
      expect(devRadio.exists()).toBe(true)
      expect(devLabel.exists()).toBe(true)
      expectElementToHaveText(devLabel.element, 'Development')
      
      const prodRadio = wrapper.find('#env-prod')
      const prodLabel = wrapper.find('label[for="env-prod"]')
      
      expect(prodRadio.exists()).toBe(true)
      expect(prodLabel.exists()).toBe(true)
      expectElementToHaveText(prodLabel.element, 'Production')
    })

    it('エミュレータースイッチに適切なラベルが設定されている', () => {
      wrapper = createWrapper()
      
      const emulatorSwitch = wrapper.find('#emulator-switch')
      const emulatorLabel = wrapper.find('label[for="emulator-switch"]')
      
      expect(emulatorSwitch.exists()).toBe(true)
      expect(emulatorLabel.exists()).toBe(true)
      expectElementToHaveText(emulatorLabel.element, 'Firebase エミュレーター使用')
    })

    it('ボタンに適切なARIA属性が設定されている', () => {
      wrapper = createWrapper()
      
      const refreshButton = wrapper.find('.btn-outline-secondary')
      expect(refreshButton.attributes('aria-label')).toBeDefined()
    })
  })

  describe('エラーハンドリング', () => {
    it('getEmulatorInfoがnullを返す場合の処理', () => {
      mockUseFirebaseConfig.getEmulatorInfo.mockReturnValue(null)
      wrapper = createWrapper()
      
      const emulatorInfo = wrapper.find('.emulator-info')
      expect(emulatorInfo.exists()).toBe(false)
    })

    it('Firebase接続エラー時の表示', () => {
      mockUseFirebaseConfig.connectionStatus.value = 'error'
      mockUseFirebaseConfig.lastError.value = 'ネットワークエラー'
      
      wrapper = createWrapper()
      
      const errorAlert = wrapper.find('.alert-danger')
      expect(errorAlert.exists()).toBe(true)
      expectElementToHaveText(errorAlert.element, 'ネットワークエラー')
    })
  })

  describe('パフォーマンス', () => {
    it('不要な再レンダリングが発生しない', async () => {
      wrapper = createWrapper()
      
      const renderSpy = vi.spyOn(wrapper.vm, '$forceUpdate')
      
      // 同じ値に設定しても再レンダリングが発生しないことを確認
      mockUseFirebaseConfig.currentEnvironment.value = 'development'
      await wrapper.vm.$nextTick()
      
      expect(renderSpy).not.toHaveBeenCalled()
      
      renderSpy.mockRestore()
    })
  })

  describe('健全性チェック機能', () => {
    it('健全性チェックボタンが存在する', () => {
      wrapper = createWrapper()
      
      const healthCheckButton = wrapper.find('[data-testid="health-check-button"]')
      expect(healthCheckButton.exists()).toBe(true)
      expect(healthCheckButton.text()).toContain('健全性チェック')
    })

    it('健全性チェック実行で結果が表示される', async () => {
      const healthResult = {
        errors: [],
        warnings: ['エミュレーター環境での実行中'],
        environment: 'development',
        latency: 75,
        useEmulator: true
      }
      mockUseFirebaseConfig.performHealthCheck.mockResolvedValue(healthResult)
      
      wrapper = createWrapper()
      
      const healthCheckButton = wrapper.find('[data-testid="health-check-button"]')
      await healthCheckButton.trigger('click')
      
      expect(mockUseFirebaseConfig.performHealthCheck).toHaveBeenCalled()
      
      // 結果表示を待機
      await wrapper.vm.$nextTick()
      
      const healthCheckResult = wrapper.find('[data-testid="health-check-result"]')
      expect(healthCheckResult.exists()).toBe(true)
    })

    it('エラーがある場合は危険バッジが表示される', async () => {
      const healthResult = {
        errors: ['Firebase接続エラー', 'Firestore接続失敗'],
        warnings: [],
        environment: 'development',
        latency: 1000,
        useEmulator: true
      }
      mockUseFirebaseConfig.performHealthCheck.mockResolvedValue(healthResult)
      
      wrapper = createWrapper()
      
      const healthCheckButton = wrapper.find('[data-testid="health-check-button"]')
      await healthCheckButton.trigger('click')
      
      await wrapper.vm.$nextTick()
      
      const healthCheckResult = wrapper.find('[data-testid="health-check-result"]')
      const errorBadge = healthCheckResult.find('.badge.bg-danger')
      expect(errorBadge.exists()).toBe(true)
      expect(errorBadge.text()).toContain('エラーあり')
    })

    it('正常な場合は成功バッジが表示される', async () => {
      const healthResult = {
        errors: [],
        warnings: [],
        environment: 'development',
        latency: 50,
        useEmulator: true
      }
      mockUseFirebaseConfig.performHealthCheck.mockResolvedValue(healthResult)
      
      wrapper = createWrapper()
      
      const healthCheckButton = wrapper.find('[data-testid="health-check-button"]')
      await healthCheckButton.trigger('click')
      
      await wrapper.vm.$nextTick()
      
      const healthCheckResult = wrapper.find('[data-testid="health-check-result"]')
      const successBadge = healthCheckResult.find('.badge.bg-success')
      expect(successBadge.exists()).toBe(true)
      expect(successBadge.text()).toContain('正常')
    })
  })

  describe('レイテンシー測定', () => {
    it('接続テスト時にレイテンシーが測定される', async () => {
      mockUseFirebaseConfig.measureConnectionLatency.mockResolvedValue(120)
      mockUseFirebaseConfig.connectionStatus.value = 'connected'
      
      wrapper = createWrapper()
      
      const testButton = wrapper.find('[data-testid="test-connection-button"]')
      await testButton.trigger('click')
      
      expect(mockUseFirebaseConfig.measureConnectionLatency).toHaveBeenCalled()
      await wrapper.vm.$nextTick()
      
      const connectionSuccess = wrapper.find('[data-testid="connection-success"]')
      expect(connectionSuccess.text()).toContain('レイテンシー: 120ms')
    })
  })

  describe('統合テスト', () => {
    it('staging環境での完全フロー', async () => {
      wrapper = createWrapper()
      
      // 1. staging環境に切り替え
      const stagingRadio = wrapper.find('#env-staging')
      await stagingRadio.setValue(true)
      
      // 2. 警告表示確認
      const warningAlert = wrapper.find('[data-testid="change-warning"]')
      expect(warningAlert.exists()).toBe(true)
      
      // 3. 健全性チェック実行
      const healthCheckButton = wrapper.find('[data-testid="health-check-button"]')
      await healthCheckButton.trigger('click')
      
      expect(mockUseFirebaseConfig.performHealthCheck).toHaveBeenCalled()
    })

    it('一連の操作フローが正常に動作する', async () => {
      wrapper = createWrapper()
      
      // 1. 初期状態確認
      const devRadio = wrapper.find('#env-dev') as any
      expect(devRadio.element.checked).toBe(true)
      
      // 2. 本番環境に切り替え
      const prodRadio = wrapper.find('#env-prod')
      await prodRadio.setValue(true)
      
      // 3. 警告表示確認
      const warningAlert = wrapper.find('[data-testid="change-warning"]')
      expect(warningAlert.exists()).toBe(true)
      
      // 4. エミュレータースイッチが無効化されることを確認
      const emulatorSwitch = wrapper.find('#emulator-switch') as any
      expect(emulatorSwitch.element.disabled).toBe(true)
      
      // 5. 接続テスト実行
      const testButton = wrapper.find('[data-testid="test-connection-button"]')
      await testButton.trigger('click')
      
      expect(mockUseFirebaseConfig.checkFirebaseConnection).toHaveBeenCalled()
      expect(mockUseFirebaseConfig.measureConnectionLatency).toHaveBeenCalled()
    })

    it('エラー状態からの復旧フロー', async () => {
      // 最初はエラー状態
      mockUseFirebaseConfig.connectionStatus.value = 'error'
      mockUseFirebaseConfig.lastError.value = 'Connection timeout'
      
      wrapper = createWrapper()
      
      // エラー表示確認
      const errorDetails = wrapper.find('[data-testid="error-details"]')
      expect(errorDetails.exists()).toBe(true)
      
      // 再試行ボタン確認
      const retryButton = wrapper.find('[data-testid="retry-connection-button"]')
      expect(retryButton.exists()).toBe(true)
      
      // 再試行実行（成功に変更）
      mockUseFirebaseConfig.connectionStatus.value = 'connected'
      mockUseFirebaseConfig.lastError.value = null
      await retryButton.trigger('click')
      
      expect(mockUseFirebaseConfig.checkFirebaseConnection).toHaveBeenCalled()
      
      await wrapper.vm.$nextTick()
      
      // 成功状態に変更されることを確認
      const connectionSuccess = wrapper.find('[data-testid="connection-success"]')
      expect(connectionSuccess.exists()).toBe(true)
    })
  })
})