#!/usr/bin/env node

/**
 * Firebase設定ファイル生成スクリプト
 * ビルド時に環境変数からFirebase設定を生成
 */

const fs = require('fs')
const path = require('path')

// 環境変数から設定を取得
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || '',
  apiKey: process.env.FIREBASE_API_KEY || '',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.FIREBASE_APP_ID || ''
}

const environment = process.env.FIREBASE_ENV || 'local'
const nodeEnv = process.env.NODE_ENV || 'development'

console.log('🔧 Generating Firebase config...')
console.log('Environment:', environment)
console.log('Node Environment:', nodeEnv)
console.log('Project ID:', firebaseConfig.projectId || 'NOT SET')
console.log('Auth Domain:', firebaseConfig.authDomain || 'NOT SET')
console.log('Has API Key:', !!firebaseConfig.apiKey)

// 設定ファイルの内容を生成
const configContent = `// Auto-generated Firebase configuration
// Generated at: ${new Date().toISOString()}
// Environment: ${environment}
// Node Environment: ${nodeEnv}

export const FIREBASE_CONFIG = ${JSON.stringify(firebaseConfig, null, 2)};

export const ENVIRONMENT = '${environment}';
export const NODE_ENV = '${nodeEnv}';
export const IS_PRODUCTION = ${environment === 'production'};

// フォールバック設定
export const FALLBACK_CONFIG = {
  development: {
    projectId: 'haircut-reservation-dev',
    authDomain: 'haircut-reservation-dev.firebaseapp.com',
    apiKey: 'AIzaSyBTvdrOvdcdhNrONF_b9uXeInoqvVmKYfY',
    storageBucket: 'haircut-reservation-dev.firebasestorage.app',
    messagingSenderId: '509197594275',
    appId: '1:509197594275:web:c2aab827763cddcf441916'
  },
  production: {
    projectId: 'haircut-reservation-prod',
    authDomain: 'haircut-reservation-prod.firebaseapp.com',
    // 本番用のAPIキーなどは環境変数から設定される
  }
};
`

// 設定ファイルを書き込み
const configPath = path.join(__dirname, 'app', 'config', 'firebase-generated.ts')
const configDir = path.dirname(configPath)

// ディレクトリが存在しない場合は作成
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true })
}

fs.writeFileSync(configPath, configContent)
console.log('✅ Firebase config generated:', configPath)

// 設定の検証
const hasRequiredFields =
  firebaseConfig.projectId && firebaseConfig.apiKey && firebaseConfig.authDomain
if (!hasRequiredFields && environment === 'production') {
  console.error('❌ Missing required Firebase configuration for production!')
  process.exit(1)
}

console.log('✅ Firebase configuration validation passed')
