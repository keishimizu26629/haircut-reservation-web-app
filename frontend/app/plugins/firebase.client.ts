/**
 * Firebase Client Plugin - 手動初期化
 */
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

export default defineNuxtPlugin(async () => {
  if (import.meta.client) {
    const isProduction = import.meta.env.MODE === 'production' || import.meta.env.PROD
    const isTest = import.meta.env.NODE_ENV === 'test' || import.meta.env.MODE === 'test'
    const useEmulator = import.meta.env.FIREBASE_USE_EMULATOR === 'true' || isTest

    console.log('🔥 Firebase Client Plugin: Manual initialization')
    console.log('🔥 Plugin timestamp:', new Date().toISOString())
    console.log('🔥 Client environment:', import.meta.env.MODE || 'unknown')
    console.log('🔥 Is Production:', isProduction)
    console.log('🔥 Is Test:', isTest)
    console.log('🔥 Use Emulator:', useEmulator)

    // Firebase設定をnuxt.config.tsから取得（環境変数優先、フォールバックあり）
    const config = useRuntimeConfig()

    // テスト環境では demo-test プロジェクトを使用
    const firebaseConfig = useEmulator
      ? {
          apiKey: 'demo-api-key',
          authDomain: 'demo-test.firebaseapp.com',
          projectId: 'demo-test',
          storageBucket: 'demo-test.appspot.com',
          messagingSenderId: '123456789',
          appId: '1:123456789:web:demo123'
        }
      : {
          apiKey: config.public.firebase.apiKey || 'AIzaSyBTvdrOvdcdhNrONF_b9uXeInoqvVmKYfY',
          authDomain:
            config.public.firebase.authDomain || 'haircut-reservation-dev.firebaseapp.com',
          projectId: config.public.firebase.projectId || 'haircut-reservation-dev',
          storageBucket:
            config.public.firebase.storageBucket || 'haircut-reservation-dev.firebasestorage.app',
          messagingSenderId: config.public.firebase.messagingSenderId || '509197594275',
          appId: config.public.firebase.appId || '1:509197594275:web:c2aab827763cddcf441916'
        }

    console.log('🔥 Firebase config source:', {
      fromEnvVars: !!config.public.firebase.apiKey,
      usingFallback: !config.public.firebase.apiKey
    })
    console.log('🔥 Firebase config:', {
      projectId: firebaseConfig.projectId,
      hasApiKey: !!firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain
    })

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
          const authHost = import.meta.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099'
          connectAuthEmulator(auth, `http://${authHost}`)
          console.log('🔥 Connected to Auth Emulator:', authHost)

          // Firestore エミュレータ接続
          const firestoreHost = import.meta.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080'
          const [host, port] = firestoreHost.split(':')
          connectFirestoreEmulator(firestore, host, parseInt(port))
          console.log('🔥 Connected to Firestore Emulator:', firestoreHost)
        } catch (emulatorError) {
          console.warn('⚠️ Emulator connection error (already connected?):', emulatorError)
        }
      }

      console.log('✅ Firebase initialized successfully')
      console.log('✅ Auth instance:', !!auth)
      console.log('✅ Firestore instance:', !!firestore)
      console.log('✅ App instance:', !!app)
      console.log('✅ Analytics instance:', !!analytics)
      console.log('✅ Using emulator:', useEmulator)

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
