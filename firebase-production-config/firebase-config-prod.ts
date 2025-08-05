/**
 * Firebase本番環境設定
 * Production Environment Configuration
 */

// Firebase Web SDK設定（本番環境）
export const firebaseConfigProduction = {
  // 本番環境のFirebase設定値（実際の値は環境変数から取得）
  apiKey: process.env.FIREBASE_PROD_API_KEY || "AIzaSy**************-production-key",
  authDomain: process.env.FIREBASE_PROD_AUTH_DOMAIN || "haircut-reservation-prod.firebaseapp.com",
  projectId: process.env.FIREBASE_PROD_PROJECT_ID || "haircut-reservation-prod",
  storageBucket: process.env.FIREBASE_PROD_STORAGE_BUCKET || "haircut-reservation-prod.appspot.com",
  messagingSenderId: process.env.FIREBASE_PROD_MESSAGING_SENDER_ID || "123456789012",
  appId: process.env.FIREBASE_PROD_APP_ID || "1:123456789012:web:abcdef1234567890",
  measurementId: process.env.FIREBASE_PROD_MEASUREMENT_ID || "G-ABCDEFGHIJ"
}

// Firebase Admin SDK設定（本番環境）
export const firebaseAdminConfigProduction = {
  projectId: firebaseConfigProduction.projectId,
  // サービスアカウントキーは環境変数から取得
  serviceAccountKey: process.env.FIREBASE_PROD_SERVICE_ACCOUNT ? 
    JSON.parse(process.env.FIREBASE_PROD_SERVICE_ACCOUNT) : undefined,
  // データベースURL（Realtime Database使用時）
  databaseURL: process.env.FIREBASE_PROD_DATABASE_URL || 
    `https://${firebaseConfigProduction.projectId}-default-rtdb.asia-southeast1.firebasedatabase.app`,
  // Storage バケット
  storageBucket: firebaseConfigProduction.storageBucket
}

// 本番環境用のFirebase初期化設定
export const productionFirebaseSettings = {
  // Firestore設定
  firestore: {
    host: 'firestore.googleapis.com',
    ssl: true,
    cacheSizeBytes: 40000000, // 40MB キャッシュ
    experimentalForceLongPolling: false,
    ignoreUndefinedProperties: false
  },
  
  // Authentication設定
  auth: {
    persistence: 'local', // ローカルストレージに認証状態を保存
    popupRedirectResolver: undefined,
    tenantId: undefined // マルチテナント設定（必要に応じて）
  },
  
  // Storage設定
  storage: {
    maxOperationRetryTime: 120000, // 2分
    maxUploadRetryTime: 600000,    // 10分
    bucket: firebaseConfigProduction.storageBucket
  },
  
  // Functions設定
  functions: {
    region: 'asia-northeast1',
    customDomain: undefined
  },
  
  // Analytics設定
  analytics: {
    config: {
      send_page_view: true,
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    }
  }
}

// 本番環境用のセキュリティ設定
export const productionSecuritySettings = {
  // CSP (Content Security Policy) 設定
  contentSecurityPolicy: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Firebase requires inline scripts
      "https://www.gstatic.com",
      "https://www.googleapis.com",
      "https://securetoken.googleapis.com"
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com"
    ],
    'font-src': [
      "'self'",
      "https://fonts.gstatic.com"
    ],
    'img-src': [
      "'self'",
      "data:",
      "https://firebasestorage.googleapis.com",
      `https://${firebaseConfigProduction.storageBucket}`
    ],
    'connect-src': [
      "'self'",
      "https://*.googleapis.com",
      "https://*.firebaseio.com",
      "https://firestore.googleapis.com",
      `https://${firebaseConfigProduction.projectId}.firebaseapp.com`
    ],
    'frame-src': [
      "https://*.firebaseapp.com"
    ]
  },
  
  // セキュリティヘッダー
  securityHeaders: {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  }
}

// 本番環境用のモニタリング設定
export const productionMonitoringSettings = {
  // パフォーマンス監視
  performance: {
    enabled: true,
    dataCollectionEnabled: true,
    instrumentationEnabled: true
  },
  
  // エラー追跡
  errorTracking: {
    enabled: true,
    sampleRate: 1.0, // 全エラーを追跡
    ignoreErrors: [
      'Non-Error promise rejection captured',
      'ResizeObserver loop limit exceeded'
    ]
  },
  
  // アナリティクス
  analytics: {
    enabled: true,
    anonymizeIp: true,
    cookieExpires: 63072000, // 2年
    sampleRate: 100 // 全ユーザーを追跡
  },
  
  // ログ設定
  logging: {
    level: 'warn', // 本番環境では警告以上のみ
    enableConsole: false,
    enableRemote: true,
    maxEntries: 1000
  }
}

// 本番環境用の料金・使用量制限
export const productionUsageLimits = {
  // Firestore使用量制限
  firestore: {
    maxReadsPerSecond: 10000,
    maxWritesPerSecond: 1000,
    maxDocumentSize: 1048576, // 1MB
    maxCollectionGroupQueries: 100
  },
  
  // Storage使用量制限
  storage: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxTotalStorage: 5 * 1024 * 1024 * 1024, // 5GB
    allowedMimeTypes: [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf', 'text/plain', 'application/json'
    ]
  },
  
  // Functions使用量制限
  functions: {
    maxExecutionTime: 540000, // 9分
    maxMemory: 512, // 512MB
    maxConcurrentExecutions: 1000
  },
  
  // Authentication制限
  auth: {
    maxSignInAttempts: 5,
    lockoutDuration: 600000, // 10分
    maxUsersPerTenant: 10000
  }
}

// 環境検証関数
export const validateProductionEnvironment = () => {
  const requiredEnvVars = [
    'FIREBASE_PROD_API_KEY',
    'FIREBASE_PROD_AUTH_DOMAIN',
    'FIREBASE_PROD_PROJECT_ID',
    'FIREBASE_PROD_STORAGE_BUCKET',
    'FIREBASE_PROD_MESSAGING_SENDER_ID',
    'FIREBASE_PROD_APP_ID'
  ]
  
  const missingVars = requiredEnvVars.filter(
    varName => !process.env[varName]
  )
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables for production: ${missingVars.join(', ')}`
    )
  }
  
  return true
}

// 本番環境用の初期化関数
export const initializeProductionFirebase = () => {
  // 環境変数の検証
  validateProductionEnvironment()
  
  // Firebase設定の検証
  if (!firebaseConfigProduction.projectId.includes('prod')) {
    console.warn('Warning: Project ID does not contain "prod" - verify this is the production environment')
  }
  
  return {
    config: firebaseConfigProduction,
    adminConfig: firebaseAdminConfigProduction,
    settings: productionFirebaseSettings,
    security: productionSecuritySettings,
    monitoring: productionMonitoringSettings,
    limits: productionUsageLimits
  }
}

export default {
  config: firebaseConfigProduction,
  adminConfig: firebaseAdminConfigProduction,
  settings: productionFirebaseSettings,
  security: productionSecuritySettings,
  monitoring: productionMonitoringSettings,
  limits: productionUsageLimits,
  initialize: initializeProductionFirebase,
  validate: validateProductionEnvironment
}