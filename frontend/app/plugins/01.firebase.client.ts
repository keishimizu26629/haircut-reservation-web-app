/**
 * Firebase Client Plugin - 手動初期化
 */
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
// import { loadGeneratedFirebaseConfig } from '~/app/utils/firebase-config-loader'

export default defineNuxtPlugin(async () => {
  if (process.client) {
    //  const isProduction = process.env.NODE_ENV === 'production'
    const isTest = process.env.NODE_ENV === 'test'
    const useEmulator = process.env.FIREBASE_USE_EMULATOR === 'true' || isTest

    console.log('🔥 Firebase initializing...')

    // Firebase設定の優先順位: 1.生成された設定 > 2.ランタイム設定 > 3.フォールバック
    const config = useRuntimeConfig()

    // ランタイム設定を使用（firebase-generatedファイルは無効化）
    console.log('🔥 Using runtime Firebase config')

    // 環境に応じたフォールバック設定を決定
    const isProduction = config.public.firebaseEnv === 'production'

    // 環境変数からFirebase設定を取得（ベタ打ちを削除）
    const firebaseConfig = useEmulator
      ? {
          // テスト/エミュレータ環境用のダミー設定
          apiKey: 'demo-api-key',
          authDomain: 'demo-test.firebaseapp.com',
          projectId: 'demo-test',
          storageBucket: 'demo-test.appspot.com',
          messagingSenderId: '123456789',
          appId: '1:123456789:web:demo123'
        }
      : {
          // 環境変数から動的に設定を取得
          apiKey: config.public.firebase.apiKey,
          authDomain: config.public.firebase.authDomain,
          projectId: config.public.firebase.projectId,
          storageBucket: config.public.firebase.storageBucket,
          messagingSenderId: config.public.firebase.messagingSenderId,
          appId: config.public.firebase.appId
        }

    console.log('🔥 Firebase config source:', {
      fromEnvVars: !!config.public.firebase.apiKey,
      usingFallback: !config.public.firebase.apiKey,
      environment: config.public.firebaseEnv,
      isProduction: isProduction
    })
    console.log('🔥 Runtime config details:', {
      nodeEnv: config.public.nodeEnv,
      firebaseEnv: config.public.firebaseEnv,
      hasProjectId: !!config.public.firebase.projectId,
      hasApiKey: !!config.public.firebase.apiKey,
      hasAuthDomain: !!config.public.firebase.authDomain,
      projectIdValue: config.public.firebase.projectId || 'EMPTY',
      authDomainValue: config.public.firebase.authDomain || 'EMPTY'
    })
    console.log('🔥 Firebase config:', {
      projectId: firebaseConfig.projectId,
      hasApiKey: !!firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      environment: isProduction ? 'production' : 'development'
    })

    // 必須環境変数のチェック（エミュレータ環境以外）
    if (!useEmulator) {
      const requiredFields = [
        'apiKey',
        'authDomain',
        'projectId',
        'storageBucket',
        'messagingSenderId',
        'appId'
      ]
      const missingFields = requiredFields.filter(field => !config.public.firebase[field])

      if (missingFields.length > 0) {
        console.error('❌ Firebase環境変数が設定されていません:', missingFields)
        throw new Error(`Firebase configuration missing: ${missingFields.join(', ')}`)
      }
    }

    try {
      // Firebase初期化
      const app = initializeApp(firebaseConfig)
      const auth = getAuth(app)
      const firestore = getFirestore(app)

      // 認証永続化設定を明示的に設定（Docker環境対応）
      if (!useEmulator) {
        const { setPersistence, browserLocalPersistence } = await import('firebase/auth')
        try {
          await setPersistence(auth, browserLocalPersistence)
          console.log('🔥 Firebase Auth persistence set to LOCAL')
        } catch (persistenceError) {
          console.warn('⚠️ Failed to set auth persistence:', persistenceError)
        }
      }

      // Analytics の初期化（一時的に無効化）
      const analytics = null
      // Google Analytics を完全に無効化
      console.log('🚫 Firebase Analytics disabled')

      // エミュレータ接続設定（テスト環境）
      if (useEmulator) {
        const { connectAuthEmulator } = await import('firebase/auth')
        const { connectFirestoreEmulator } = await import('firebase/firestore')

        try {
          // Auth エミュレータ接続
          const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099'
          connectAuthEmulator(auth, `http://${authHost}`)
          console.log('🔥 Connected to Auth Emulator:', authHost)

          // Firestore エミュレータ接続
          const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080'
          const [host, port] = firestoreHost.split(':')
          connectFirestoreEmulator(firestore, host!, parseInt(port!))
          console.log('🔥 Connected to Firestore Emulator:', firestoreHost)
        } catch (emulatorError) {
          console.warn('⚠️ Emulator connection error (already connected?):', emulatorError)
        }
      }

      console.log('✅ Firebase initialized')

      return {
        provide: {
          firebaseApp: app,
          firebaseAuth: auth,
          firebaseFirestore: firestore,
          firebaseAnalytics: analytics
        }
      }
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error)
      throw error
    }
  }
  // サーバーサイドでは何も提供しない
  return {}
})
