/**
 * 環境管理 Composable
 * 環境切り替えと設定管理を提供
 */

export const useEnvironment = () => {
  const config = useRuntimeConfig()

  // 環境情報
  const environment = computed(() => ({
    node: config.public.nodeEnv,
    nuxt: config.public.nuxtEnv,
    firebase: config.public.firebaseEnv,
    isLocal: config.public.firebaseEnv === 'local',
    isDevelopment: config.public.firebaseEnv === 'development',
    isProduction: config.public.firebaseEnv === 'production'
  }))

  // Firebase設定
  const firebaseConfig = computed(() => config.public.firebaseConfig)
  
  // Emulator設定
  const emulatorConfig = computed(() => config.public.firebaseEmulators)
  
  // 機能フラグ
  const features = computed(() => config.public.features)
  
  // セキュリティ設定
  const security = computed(() => config.public.security)
  
  // マルチテナント設定
  const multiTenant = computed(() => config.public.multiTenant)

  // エミュレーター接続状態チェック
  const isEmulatorConnected = computed(() => {
    if (process.client) {
      return window.__FIREBASE_EMULATOR_CONNECTED__ || false
    }
    return false
  })

  // 環境切り替え機能
  const switchEnvironment = (targetEnv: 'local' | 'development' | 'production') => {
    if (process.client) {
      // 環境切り替えの確認
      const confirmSwitch = confirm(
        `環境を「${targetEnv}」に切り替えますか？\n` +
        'この操作により、ページがリロードされます。'
      )
      
      if (confirmSwitch) {
        // セッションストレージに環境設定を保存
        sessionStorage.setItem('preferredEnvironment', targetEnv)
        
        // ページリロード
        window.location.reload()
      }
    }
  }

  // テナント切り替え機能
  const switchTenant = (tenantId: string) => {
    if (process.client && multiTenant.value.enabled) {
      sessionStorage.setItem('tenantId', tenantId)
      
      // テナント変更イベントを発行
      window.dispatchEvent(new CustomEvent('tenant-changed', {
        detail: { tenantId }
      }))
      
      console.log('🏢 Tenant switched to:', tenantId)
    }
  }

  // 現在のテナントID取得
  const getCurrentTenant = () => {
    if (process.client && multiTenant.value.enabled) {
      return sessionStorage.getItem('tenantId') || multiTenant.value.defaultTenantId
    }
    return multiTenant.value.defaultTenantId
  }

  // エミュレーター自動判定と接続
  const autoConnectEmulators = () => {
    if (environment.value.isLocal && process.client) {
      // エミュレーターの生存確認
      const checkEmulatorHealth = async () => {
        try {
          const emulators = emulatorConfig.value
          const healthChecks = []

          // Auth Emulator
          if (emulators.authHost) {
            healthChecks.push(
              fetch(`http://${emulators.authHost}/emulator/v1/projects/demo-project/config`)
                .then(() => ({ service: 'auth', status: 'healthy' }))
                .catch(() => ({ service: 'auth', status: 'unhealthy' }))
            )
          }

          // Firestore Emulator（HTTP APIチェック）
          if (emulators.firestoreHost) {
            healthChecks.push(
              fetch(`http://${emulators.firestoreHost}/v1/projects/demo-project/databases`)
                .then(() => ({ service: 'firestore', status: 'healthy' }))
                .catch(() => ({ service: 'firestore', status: 'unhealthy' }))
            )
          }

          const results = await Promise.all(healthChecks)
          console.log('🔍 Emulator Health Check:', results)
          
          return results.every(result => result.status === 'healthy')
        } catch (error) {
          console.warn('⚠️ Emulator health check failed:', error)
          return false
        }
      }

      return checkEmulatorHealth()
    }
    
    return Promise.resolve(true)
  }

  // 開発者体験最適化
  const getDeveloperInfo = () => ({
    environment: environment.value,
    firebase: firebaseConfig.value,
    emulators: emulatorConfig.value,
    features: features.value,
    currentTenant: getCurrentTenant(),
    emulatorConnected: isEmulatorConnected.value
  })

  // デバッグ情報出力
  const logEnvironmentInfo = () => {
    if (features.value.debugMode) {
      console.table(getDeveloperInfo())
    }
  }

  // Emulator UI リンク生成
  const getEmulatorUIUrl = () => {
    if (environment.value.isLocal) {
      return 'http://localhost:4000'
    }
    return null
  }

  return {
    // 環境情報
    environment: readonly(environment),
    firebaseConfig: readonly(firebaseConfig),
    emulatorConfig: readonly(emulatorConfig),
    features: readonly(features),
    security: readonly(security),
    multiTenant: readonly(multiTenant),
    
    // 状態
    isEmulatorConnected: readonly(isEmulatorConnected),
    
    // 機能
    switchEnvironment,
    switchTenant,
    getCurrentTenant,
    autoConnectEmulators,
    getDeveloperInfo,
    logEnvironmentInfo,
    getEmulatorUIUrl
  }
}