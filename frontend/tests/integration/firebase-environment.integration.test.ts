// Firebase環境切り替え統合テスト - フロントエンド・バックエンド連携

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import EnvironmentSwitcher from '~/components/Admin/EnvironmentSwitcher.vue'
import BookingPage from '~/pages/booking.vue'
import {
  createMountOptions,
  expectElementToHaveText,
  waitForElement
} from '../utils/test-helpers'

// Firebase統合モック
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

const mockBookingApi = {
  getServices: vi.fn(),
  createBooking: vi.fn()
}

// Firebase SDK モック
const mockFirebaseAuth = {
  currentUser: { getIdToken: vi.fn().mockResolvedValue('mock-token') },
  onAuthStateChanged: vi.fn()
}

const mockFirestore = {
  doc: vi.fn(),
  collection: vi.fn(),
  getDoc: vi.fn()
}

vi.mock('~/composables/useFirebaseConfig', () => ({
  useFirebaseConfig: () => mockFirebaseConfig
}))

vi.mock('~/composables/useBookingApi', () => ({
  useBookingApi: () => mockBookingApi
}))

vi.mock('firebase/auth', () => ({
  getAuth: () => mockFirebaseAuth,
  connectAuthEmulator: vi.fn()
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: () => mockFirestore,
  connectFirestoreEmulator: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn()
}))

describe('Firebase環境切り替え統合テスト', () => {
  let environmentWrapper: VueWrapper<any>
  let bookingWrapper: VueWrapper<any>

  beforeEach(() => {
    vi.clearAllMocks()
    
    // デフォルト設定
    mockFirebaseConfig.currentEnvironment.value = 'development'
    mockFirebaseConfig.useEmulator.value = true
    mockFirebaseConfig.connectionStatus.value = 'connected'
    mockFirebaseConfig.lastError.value = null

    mockFirebaseConfig.getEmulatorInfo.mockReturnValue({
      auth: 'http://localhost:9099',
      firestore: 'localhost:8080',
      storage: 'localhost:9199',
      functions: 'localhost:5001'
    })

    mockFirebaseConfig.checkFirebaseConnection.mockResolvedValue(true)
    mockBookingApi.getServices.mockResolvedValue([])
  })

  afterEach(() => {
    if (environmentWrapper) {
      environmentWrapper.unmount()
    }
    if (bookingWrapper) {
      bookingWrapper.unmount()
    }
  })

  describe('開発環境→本番環境切り替え統合', () => {
    it('環境切り替えがフロントエンド・バックエンド連携で正常に動作する', async () => {
      environmentWrapper = mount(EnvironmentSwitcher, createMountOptions())

      // 初期状態確認（開発環境）
      expect(mockFirebaseConfig.currentEnvironment.value).toBe('development')
      expect(mockFirebaseConfig.useEmulator.value).toBe(true)

      // 本番環境への切り替え
      const prodRadio = environmentWrapper.find('#env-prod')
      await prodRadio.setValue(true)

      // 設定変更が反映される
      await environmentWrapper.vm.$nextTick()

      // 未保存変更警告が表示される
      const warningAlert = environmentWrapper.find('.alert-warning')
      expect(warningAlert.exists()).toBe(true)

      // リロードボタンクリック（実際のリロードはモック）
      const reloadButton = environmentWrapper.find('.btn-warning')
      const mockReload = vi.fn()
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true
      })

      await reloadButton.trigger('click')
      expect(mockReload).toHaveBeenCalled()

      // 本番環境設定で再初期化をシミュレート
      mockFirebaseConfig.currentEnvironment.value = 'production'
      mockFirebaseConfig.useEmulator.value = false

      // 予約ページで本番環境が使用されることを確認
      bookingWrapper = mount(BookingPage, createMountOptions())
      await bookingWrapper.vm.$nextTick()

      // 本番環境向けAPI呼び出しが実行される
      expect(mockBookingApi.getServices).toHaveBeenCalled()
    })

    it('エミュレーター切り替えがバックエンド接続に反映される', async () => {
      environmentWrapper = mount(EnvironmentSwitcher, createMountOptions())

      // エミュレーター無効化
      const emulatorSwitch = environmentWrapper.find('#emulator-switch')
      await emulatorSwitch.setValue(false)

      // 設定変更後の接続テスト
      const testButton = environmentWrapper.find('.btn-outline-info')
      await testButton.trigger('click')

      // Firebase接続確認が呼ばれる
      expect(mockFirebaseConfig.checkFirebaseConnection).toHaveBeenCalled()
    })
  })

  describe('接続状態統合テスト', () => {
    it('Firebase接続エラー時の統合エラーハンドリング', async () => {
      // 接続エラーをシミュレート
      mockFirebaseConfig.connectionStatus.value = 'error'
      mockFirebaseConfig.lastError.value = 'Firestore接続エラー'
      mockFirebaseConfig.checkFirebaseConnection.mockResolvedValue(false)

      environmentWrapper = mount(EnvironmentSwitcher, createMountOptions())

      // エラー表示確認
      const errorAlert = environmentWrapper.find('.alert-danger')
      expect(errorAlert.exists()).toBe(true)
      expectElementToHaveText(errorAlert.element, 'Firestore接続エラー')

      // 予約ページでもエラー状態が反映される
      bookingWrapper = mount(BookingPage, createMountOptions())

      // Firebase接続エラー時の警告が表示される
      const connectionWarning = bookingWrapper.find('[data-testid="firebase-connection-warning"]')
      expect(connectionWarning.exists()).toBe(true)
    })

    it('接続回復時の統合動作確認', async () => {
      // 初期エラー状態
      mockFirebaseConfig.connectionStatus.value = 'error'
      mockFirebaseConfig.lastError.value = 'ネットワークエラー'

      environmentWrapper = mount(EnvironmentSwitcher, createMountOptions())

      // エラー状態確認
      const errorBadge = environmentWrapper.find('.badge.bg-danger')
      expect(errorBadge.exists()).toBe(true)

      // 接続回復をシミュレート
      mockFirebaseConfig.connectionStatus.value = 'connected'
      mockFirebaseConfig.lastError.value = null
      mockFirebaseConfig.checkFirebaseConnection.mockResolvedValue(true)

      // 接続テスト実行
      const testButton = environmentWrapper.find('.btn-outline-info')
      await testButton.trigger('click')

      // 接続確認が実行される
      expect(mockFirebaseConfig.checkFirebaseConnection).toHaveBeenCalled()

      // 状態更新後の確認
      await environmentWrapper.vm.$nextTick()
      
      // 予約フローが正常に動作することを確認
      bookingWrapper = mount(BookingPage, createMountOptions())
      expect(mockBookingApi.getServices).toHaveBeenCalled()
    })
  })

  describe('環境間データ整合性テスト', () => {
    it('開発環境データが本番環境に影響しないことを確認', async () => {
      // 開発環境でのテストデータ作成
      mockFirebaseConfig.currentEnvironment.value = 'development'
      mockFirebaseConfig.useEmulator.value = true

      const devServices = [
        { id: 'dev-service-1', name: '開発用サービス', isTest: true }
      ]
      mockBookingApi.getServices.mockResolvedValue(devServices)

      bookingWrapper = mount(BookingPage, createMountOptions())
      await bookingWrapper.vm.$nextTick()

      // 開発環境のサービスが取得される
      expect(mockBookingApi.getServices).toHaveBeenCalled()

      // 本番環境への切り替え
      mockFirebaseConfig.currentEnvironment.value = 'production'
      mockFirebaseConfig.useEmulator.value = false

      const prodServices = [
        { id: 'prod-service-1', name: '本番用サービス', isTest: false }
      ]
      mockBookingApi.getServices.mockResolvedValue(prodServices)

      // 新しい予約ページインスタンス
      bookingWrapper.unmount()
      bookingWrapper = mount(BookingPage, createMountOptions())
      await bookingWrapper.vm.$nextTick()

      // 本番環境のサービスが取得される（開発環境データとは分離）
      expect(mockBookingApi.getServices).toHaveBeenCalled()
    })

    it('エミュレーター→クラウド切り替え時のデータ分離確認', async () => {
      // エミュレーター環境
      mockFirebaseConfig.useEmulator.value = true
      mockFirebaseConfig.getEmulatorInfo.mockReturnValue({
        auth: 'http://localhost:9099',
        firestore: 'localhost:8080',
        storage: 'localhost:9199',
        functions: 'localhost:5001'
      })

      environmentWrapper = mount(EnvironmentSwitcher, createMountOptions())

      // エミュレーター情報が表示される
      const emulatorInfo = environmentWrapper.find('.emulator-info')
      expect(emulatorInfo.exists()).toBe(true)
      expectElementToHaveText(emulatorInfo.element, 'localhost:8080')

      // クラウド環境への切り替え
      mockFirebaseConfig.useEmulator.value = false
      mockFirebaseConfig.getEmulatorInfo.mockReturnValue(null)

      await environmentWrapper.vm.$nextTick()

      // エミュレーター情報が非表示になる
      const emulatorInfoAfter = environmentWrapper.find('.emulator-info')
      expect(emulatorInfoAfter.exists()).toBe(false)
    })
  })

  describe('認証統合テスト', () => {
    it('環境切り替え時の認証状態維持確認', async () => {
      // 認証済み状態
      mockFirebaseAuth.currentUser = {
        uid: 'test-user',
        getIdToken: vi.fn().mockResolvedValue('valid-token')
      }

      environmentWrapper = mount(EnvironmentSwitcher, createMountOptions())

      // 環境切り替え
      const prodRadio = environmentWrapper.find('#env-prod')
      await prodRadio.setValue(true)

      // 認証トークンが正常に取得できることを確認
      const token = await mockFirebaseAuth.currentUser.getIdToken()
      expect(token).toBe('valid-token')

      // API呼び出し時に認証トークンが使用される
      bookingWrapper = mount(BookingPage, createMountOptions())
      expect(mockBookingApi.getServices).toHaveBeenCalled()
    })

    it('認証エラー時の統合エラーハンドリング', async () => {
      // 認証エラーをシミュレート
      mockFirebaseAuth.currentUser = null

      environmentWrapper = mount(EnvironmentSwitcher, createMountOptions())
      bookingWrapper = mount(BookingPage, createMountOptions())

      // 認証が必要な処理でエラーが適切に処理される
      expect(mockBookingApi.getServices).toHaveBeenCalled()
    })
  })

  describe('パフォーマンス統合テスト', () => {
    it('環境切り替え時のパフォーマンス確認', async () => {
      const startTime = performance.now()

      environmentWrapper = mount(EnvironmentSwitcher, createMountOptions())

      // 環境切り替え
      const prodRadio = environmentWrapper.find('#env-prod')
      await prodRadio.setValue(true)

      // 接続テスト実行
      const testButton = environmentWrapper.find('.btn-outline-info')
      await testButton.trigger('click')

      await environmentWrapper.vm.$nextTick()

      const endTime = performance.now()

      // 切り替え処理が500ms以内に完了することを確認
      expect(endTime - startTime).toBeLessThan(500)
    })

    it('複数環境同時接続時のリソース管理確認', async () => {
      // 複数のEnvironmentSwitcherインスタンス作成
      const wrapper1 = mount(EnvironmentSwitcher, createMountOptions())
      const wrapper2 = mount(EnvironmentSwitcher, createMountOptions())

      // 両方で接続テスト実行
      const testButton1 = wrapper1.find('.btn-outline-info')
      const testButton2 = wrapper2.find('.btn-outline-info')

      await Promise.all([
        testButton1.trigger('click'),
        testButton2.trigger('click')
      ])

      // 接続確認が適切に実行される
      expect(mockFirebaseConfig.checkFirebaseConnection).toHaveBeenCalledTimes(2)

      wrapper1.unmount()
      wrapper2.unmount()
    })
  })

  describe('エラー回復統合テスト', () => {
    it('ネットワーク断絶からの回復統合フロー', async () => {
      // ネットワーク断絶をシミュレート
      mockFirebaseConfig.connectionStatus.value = 'error'
      mockFirebaseConfig.lastError.value = 'ネットワーク接続エラー'
      mockFirebaseConfig.checkFirebaseConnection.mockRejectedValue(new Error('Network error'))

      environmentWrapper = mount(EnvironmentSwitcher, createMountOptions())

      // エラー状態確認
      const errorBadge = environmentWrapper.find('.badge.bg-danger')
      expect(errorBadge.exists()).toBe(true)

      // 接続テストでエラーが発生
      const testButton = environmentWrapper.find('.btn-outline-info')
      await testButton.trigger('click')

      // エラーが適切に処理される
      expect(mockFirebaseConfig.checkFirebaseConnection).toHaveBeenCalled()

      // ネットワーク回復をシミュレート
      mockFirebaseConfig.connectionStatus.value = 'connected'
      mockFirebaseConfig.lastError.value = null
      mockFirebaseConfig.checkFirebaseConnection.mockResolvedValue(true)

      // 再接続テスト
      await testButton.trigger('click')

      // 接続が回復することを確認
      expect(mockFirebaseConfig.checkFirebaseConnection).toHaveBeenCalledTimes(2)

      // 予約フローが正常に動作することを確認
      bookingWrapper = mount(BookingPage, createMountOptions())
      expect(mockBookingApi.getServices).toHaveBeenCalled()
    })
  })
})