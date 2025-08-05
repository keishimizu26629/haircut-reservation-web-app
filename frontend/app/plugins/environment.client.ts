/**
 * 環境設定プラグイン
 * クライアント側で動作し、環境に応じた設定を適用
 */

import { connectAuthEmulator, type Auth } from 'firebase/auth'
import { connectFirestoreEmulator, type Firestore } from 'firebase/firestore'
import { connectStorageEmulator, type FirebaseStorage } from 'firebase/storage'
import { connectFunctionsEmulator, type Functions } from 'firebase/functions'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const { $auth, $firestore, $storage, $functions } = useNuxtApp()

  // 安全にfeaturesオブジェクトにアクセス
  const features = config.public?.features || {}
  const firebaseEmulators = config.public?.firebaseEmulators || {}

  // 環境情報をログ出力（デバッグモードの場合のみ）
  if (features.debugMode) {
    console.log('🌍 Environment Configuration:', {
      nodeEnv: config.public?.nodeEnv,
      nuxtEnv: config.public?.nuxtEnv,
      firebaseEnv: config.public?.firebaseEnv,
      features: features
    })
  }

  // ローカル開発環境でのEmulator接続設定
  if (config.public?.firebaseEnv === 'local') {
    // Firebase Emulatorに接続（一度だけ実行）
    if (process.client && !window.__FIREBASE_EMULATOR_CONNECTED__) {
      try {
        // Auth Emulator
        if (firebaseEmulators.authHost && $auth) {
          const [host, port] = firebaseEmulators.authHost.split(':')
          connectAuthEmulator($auth as Auth, `http://${host}:${port}`, {
            disableWarnings: true
          })
          console.log('🔐 Connected to Auth Emulator:', firebaseEmulators.authHost)
        }

        // Firestore Emulator
        if (firebaseEmulators.firestoreHost && $firestore) {
          const [host, port] = firebaseEmulators.firestoreHost.split(':')
          connectFirestoreEmulator($firestore as Firestore, host, parseInt(port))
          console.log('📄 Connected to Firestore Emulator:', firebaseEmulators.firestoreHost)
        }

        // Storage Emulator
        if (firebaseEmulators.storageHost && $storage) {
          const [host, port] = firebaseEmulators.storageHost.split(':')
          connectStorageEmulator($storage as FirebaseStorage, host, parseInt(port))
          console.log('📁 Connected to Storage Emulator:', firebaseEmulators.storageHost)
        }

        // Functions Emulator
        if (firebaseEmulators.functionsHost && $functions) {
          const [host, port] = firebaseEmulators.functionsHost.split(':')
          connectFunctionsEmulator($functions as Functions, host, parseInt(port))
          console.log('⚡ Connected to Functions Emulator:', firebaseEmulators.functionsHost)
        }

        // 接続完了フラグを設定
        window.__FIREBASE_EMULATOR_CONNECTED__ = true
        console.log('✅ Firebase Emulators connected successfully')

      } catch (error) {
        console.warn('⚠️ Failed to connect to Firebase Emulators:', error)
      }
    }
  }

  // 本番環境でのAnalytics設定
  if (config.public?.firebaseEnv === 'production' && features.analytics) {
    // Google Analytics設定
    console.log('📊 Analytics enabled for production environment')
  }

  // マルチテナント設定の初期化
  const multiTenant = config.public?.multiTenant || {}
  if (multiTenant.enabled) {
    // テナントIDをセッションストレージに保存
    const defaultTenantId = multiTenant.defaultTenantId
    if (process.client && !sessionStorage.getItem('tenantId')) {
      sessionStorage.setItem('tenantId', defaultTenantId)
      console.log('🏢 Default tenant set:', defaultTenantId)
    }
  }

  // グローバル環境変数として提供
  return {
    provide: {
      environment: {
        isLocal: config.public?.firebaseEnv === 'local',
        isDevelopment: config.public?.firebaseEnv === 'development',
        isProduction: config.public?.firebaseEnv === 'production',
        features: features,
        multiTenant: multiTenant
      }
    }
  }
})

// TypeScript型定義
declare global {
  interface Window {
    __FIREBASE_EMULATOR_CONNECTED__?: boolean
  }
}
