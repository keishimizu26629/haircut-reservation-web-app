/**
 * Firebase Client Plugin - 手動初期化
 */
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { loadGeneratedFirebaseConfig } from '~/app/utils/firebase-config-loader'

export default defineNuxtPlugin(async () => {
  if (process.client) {
    //  const isProduction = process.env.NODE_ENV === 'production'
    const isTest = process.env.NODE_ENV === 'test'
    const useEmulator = process.env.FIREBASE_USE_EMULATOR === 'true' || isTest

    console.log('🔥 Firebase initializing...')

    // Firebase設定の優先順位: 1.生成された設定 > 2.ランタイム設定 > 3.フォールバック
    const config = useRuntimeConfig()

    // 生成された設定ファイルを安全に読み込み
    const generatedConfig = await loadGeneratedFirebaseConfig()
    
    // 生成された設定があれば優先使用
    let firebaseConfig: any
    let isProduction: boolean
    
    if (generatedConfig?.FIREBASE_CONFIG?.projectId) {
      console.log('🔥 Using generated Firebase config')
      firebaseConfig = generatedConfig.FIREBASE_CONFIG
      isProduction = generatedConfig.IS_PRODUCTION || false
    } else {
      console.log('🔥 Using runtime Firebase config')
      // 環境に応じたフォールバック設定を決定
      isProduction = config.public.firebaseEnv === 'production'

      // テスト環境では demo-test プロジェクトを使用
      firebaseConfig = useEmulator
        ? {
            apiKey: 'demo-api-key',
            authDomain: 'demo-test.firebaseapp.com',
            projectId: 'demo-test',
            storageBucket: 'demo-test.appspot.com',
            messagingSenderId: '123456789',
            appId: '1:123456789:web:demo123'
          }
        : {
            // 環境変数が設定されていない場合のフォールバック設定を環境に応じて切り替え
            apiKey:
              config.public.firebase.apiKey ||
              (isProduction
                ? 'AIzaSyA_PROD_API_KEY_PLACEHOLDER' // 本番用プレースホルダー
                : 'AIzaSyBTvdrOvdcdhNrONF_b9uXeInoqvVmKYfY'),
            authDomain:
              config.public.firebase.authDomain ||
              (isProduction
                ? 'haircut-reservation-prod.firebaseapp.com'
                : 'haircut-reservation-dev.firebaseapp.com'),
            projectId:
              config.public.firebase.projectId ||
              (isProduction ? 'haircut-reservation-prod' : 'haircut-reservation-dev'),
            storageBucket:
              config.public.firebase.storageBucket ||
              (isProduction
                ? 'haircut-reservation-prod.firebasestorage.app'
                : 'haircut-reservation-dev.firebasestorage.app'),
            messagingSenderId:
              config.public.firebase.messagingSenderId ||
              (isProduction
                ? 'PROD_SENDER_ID_PLACEHOLDER' // 本番用プレースホルダー
                : '509197594275'),
            appId:
              config.public.firebase.appId ||
              (isProduction
                ? '1:PROD_SENDER_ID:web:PROD_APP_ID_PLACEHOLDER' // 本番用プレースホルダー
                : '1:509197594275:web:c2aab827763cddcf441916')
          }
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

    // 本番環境で環境変数が設定されていない場合はエラー
    if (isProduction && !config.public.firebase.apiKey) {
      console.error('❌ 本番環境でFirebase環境変数が設定されていません！')
      throw new Error('Firebase configuration missing in production environment')
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
