// Firebase環境設定 - dev2との連携用
// 環境変数による動的設定管理

export interface FirebaseEnvironmentConfig {
  name: 'development' | 'staging' | 'production'
  displayName: string
  description: string
  config: {
    projectId: string
    apiKey: string
    authDomain: string
    storageBucket: string
    messagingSenderId: string
    appId: string
  }
  endpoints?: {
    firestore?: string
    auth?: string
    storage?: string
    functions?: string
  }
  emulator?: {
    enabled: boolean
    ports: {
      auth: number
      firestore: number
      storage: number
      functions: number
    }
  }
  features: {
    allowEmulator: boolean
    enableHealthCheck: boolean
    connectionMonitoring: boolean
    persistSettings: boolean
  }
}

// 環境設定定義
export const FIREBASE_ENVIRONMENTS: Record<string, FirebaseEnvironmentConfig> = {
  development: {
    name: 'development',
    displayName: '開発環境',
    description: 'ローカル開発・テスト用環境',
    config: {
      projectId: process.env.FIREBASE_DEV_PROJECT_ID || 'haircut-reservation-dev',
      apiKey: process.env.FIREBASE_DEV_API_KEY || 'dev-api-key',
      authDomain: process.env.FIREBASE_DEV_AUTH_DOMAIN || 'haircut-reservation-dev.firebaseapp.com',
      storageBucket: process.env.FIREBASE_DEV_STORAGE_BUCKET || 'haircut-reservation-dev.appspot.com',
      messagingSenderId: process.env.FIREBASE_DEV_MESSAGING_SENDER_ID || '123456789',
      appId: process.env.FIREBASE_DEV_APP_ID || '1:123456789:web:dev123'
    },
    emulator: {
      enabled: true,
      ports: {
        auth: 9099,
        firestore: 8080,
        storage: 9199,
        functions: 5001
      }
    },
    features: {
      allowEmulator: true,
      enableHealthCheck: true,
      connectionMonitoring: true,
      persistSettings: true
    }
  },

  staging: {
    name: 'staging',
    displayName: 'ステージング環境',
    description: '本番前テスト・品質確認用環境',
    config: {
      projectId: process.env.FIREBASE_STAGING_PROJECT_ID || 'haircut-reservation-staging',
      apiKey: process.env.FIREBASE_STAGING_API_KEY || 'staging-api-key',
      authDomain: process.env.FIREBASE_STAGING_AUTH_DOMAIN || 'haircut-reservation-staging.firebaseapp.com',
      storageBucket: process.env.FIREBASE_STAGING_STORAGE_BUCKET || 'haircut-reservation-staging.appspot.com',
      messagingSenderId: process.env.FIREBASE_STAGING_MESSAGING_SENDER_ID || '987654321',
      appId: process.env.FIREBASE_STAGING_APP_ID || '1:987654321:web:staging123'
    },
    endpoints: {
      firestore: process.env.FIREBASE_STAGING_FIRESTORE_ENDPOINT,
      auth: process.env.FIREBASE_STAGING_AUTH_ENDPOINT,
      storage: process.env.FIREBASE_STAGING_STORAGE_ENDPOINT,
      functions: process.env.FIREBASE_STAGING_FUNCTIONS_ENDPOINT
    },
    features: {
      allowEmulator: false,
      enableHealthCheck: true,
      connectionMonitoring: true,
      persistSettings: true
    }
  },

  production: {
    name: 'production',
    displayName: '本番環境',
    description: '実運用環境（注意して操作）',
    config: {
      projectId: process.env.FIREBASE_PROD_PROJECT_ID || 'haircut-reservation-prod',
      apiKey: process.env.FIREBASE_PROD_API_KEY || 'prod-api-key',
      authDomain: process.env.FIREBASE_PROD_AUTH_DOMAIN || 'haircut-reservation-prod.firebaseapp.com',
      storageBucket: process.env.FIREBASE_PROD_STORAGE_BUCKET || 'haircut-reservation-prod.appspot.com',
      messagingSenderId: process.env.FIREBASE_PROD_MESSAGING_SENDER_ID || '555666777',
      appId: process.env.FIREBASE_PROD_APP_ID || '1:555666777:web:prod123'
    },
    features: {
      allowEmulator: false,
      enableHealthCheck: true,
      connectionMonitoring: false, // 本番では軽量化
      persistSettings: false // セキュリティ重視
    }
  }
}

// 環境検出ロジック
export const detectFirebaseEnvironment = (): keyof typeof FIREBASE_ENVIRONMENTS => {
  // 環境変数による明示的指定を最優先
  const explicitEnv = process.env.FIREBASE_ENV || process.env.NUXT_FIREBASE_ENV
  if (explicitEnv && explicitEnv in FIREBASE_ENVIRONMENTS) {
    return explicitEnv as keyof typeof FIREBASE_ENVIRONMENTS
  }

  // NODE_ENVベースの判定
  const nodeEnv = process.env.NODE_ENV
  if (nodeEnv === 'production') return 'production'
  if (nodeEnv === 'staging') return 'staging'
  
  // プロジェクトIDベースの判定
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NUXT_FIREBASE_PROJECT_ID
  if (projectId) {
    if (projectId.includes('prod')) return 'production'
    if (projectId.includes('staging') || projectId.includes('stg')) return 'staging'
    if (projectId.includes('dev') || projectId.includes('demo')) return 'development'
  }

  // URLベースの判定（クライアントサイド）
  if (process.client) {
    const hostname = window.location.hostname
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) return 'development'
    if (hostname.includes('staging')) return 'staging'
    if (hostname.includes('prod')) return 'production'
  }

  // デフォルトは開発環境
  return 'development'
}

// 環境設定取得
export const getFirebaseEnvironmentConfig = (
  environment?: keyof typeof FIREBASE_ENVIRONMENTS
): FirebaseEnvironmentConfig => {
  const env = environment || detectFirebaseEnvironment()
  const config = FIREBASE_ENVIRONMENTS[env]
  
  if (!config) {
    console.warn(`Unknown Firebase environment: ${env}. Falling back to development.`)
    return FIREBASE_ENVIRONMENTS.development
  }
  
  return config
}

// 環境設定検証
export const validateEnvironmentConfig = (config: FirebaseEnvironmentConfig): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} => {
  const errors: string[] = []
  const warnings: string[] = []

  // 必須設定の確認
  if (!config.config.projectId) errors.push('プロジェクトIDが設定されていません')
  if (!config.config.apiKey) errors.push('APIキーが設定されていません')
  if (!config.config.authDomain) errors.push('認証ドメインが設定されていません')

  // 環境固有の検証
  if (config.name === 'production') {
    if (config.features.allowEmulator) {
      errors.push('本番環境でエミュレーターが許可されています')
    }
    if (config.config.projectId.includes('dev') || config.config.projectId.includes('test')) {
      warnings.push('本番環境で開発用プロジェクトIDが使用されています')
    }
  }

  if (config.name === 'development') {
    if (!config.features.allowEmulator) {
      warnings.push('開発環境でエミュレーターが無効になっています')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// 環境切り替えログ
export const logEnvironmentSwitch = (
  fromEnv: string,
  toEnv: string,
  config: FirebaseEnvironmentConfig
) => {
  const timestamp = new Date().toISOString()
  const logData = {
    timestamp,
    action: 'environment_switch',
    from: fromEnv,
    to: toEnv,
    projectId: config.config.projectId,
    emulatorEnabled: config.emulator?.enabled || false,
    features: config.features
  }

  console.log(`🔄 Firebase環境切り替え: ${fromEnv} → ${toEnv}`, logData)
  
  // dev2との連携用：環境切り替えイベントをpostMessage
  if (process.client && window.parent !== window) {
    window.parent.postMessage({
      type: 'FIREBASE_ENV_CHANGED',
      data: logData
    }, '*')
  }
  
  return logData
}

// 環境設定リセット
export const resetEnvironmentSettings = () => {
  if (process.client) {
    localStorage.removeItem('firebaseSettings')
    sessionStorage.removeItem('firebaseEnvironment')
    console.log('🔄 Firebase環境設定をリセットしました')
  }
}

// dev2連携用：環境変数テストヘルパー
export const testEnvironmentVariables = () => {
  const envVars = {
    FIREBASE_ENV: process.env.FIREBASE_ENV,
    NODE_ENV: process.env.NODE_ENV,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    // 開発環境用
    FIREBASE_DEV_PROJECT_ID: process.env.FIREBASE_DEV_PROJECT_ID,
    FIREBASE_DEV_API_KEY: process.env.FIREBASE_DEV_API_KEY,
    // ステージング環境用
    FIREBASE_STAGING_PROJECT_ID: process.env.FIREBASE_STAGING_PROJECT_ID,
    FIREBASE_STAGING_API_KEY: process.env.FIREBASE_STAGING_API_KEY,
    // 本番環境用（セキュリティ上、実際の値は表示しない）
    FIREBASE_PROD_PROJECT_ID: process.env.FIREBASE_PROD_PROJECT_ID ? '[SET]' : '[NOT SET]',
    FIREBASE_PROD_API_KEY: process.env.FIREBASE_PROD_API_KEY ? '[SET]' : '[NOT SET]'
  }

  console.table(envVars)
  return envVars
}

// エラーハンドリング用定数
export const FIREBASE_ERROR_CODES = {
  NETWORK_ERROR: 'firebase/network-error',
  AUTH_ERROR: 'firebase/auth-error',
  FIRESTORE_ERROR: 'firebase/firestore-error',
  CONFIG_ERROR: 'firebase/config-error',
  EMULATOR_ERROR: 'firebase/emulator-error'
} as const

export type FirebaseErrorCode = typeof FIREBASE_ERROR_CODES[keyof typeof FIREBASE_ERROR_CODES]