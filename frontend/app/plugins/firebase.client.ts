/**
 * Firebase Client Plugin - 手動初期化
 */
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    const isProduction = import.meta.env.MODE === 'production' || import.meta.env.PROD

    console.log('🔥 Firebase Client Plugin: Manual initialization')
    console.log('🔥 Plugin timestamp:', new Date().toISOString())
    console.log('🔥 Client environment:', import.meta.env.MODE || 'unknown')
    console.log('🔥 Is Production:', isProduction)

    // Firebase設定をnuxt.config.tsから取得（環境変数優先、フォールバックあり）
    const config = useRuntimeConfig()

    // 環境変数から設定を取得、なければ開発用のデフォルト値を使用
    const firebaseConfig = {
      apiKey: config.public.firebase.apiKey || 'AIzaSyBTvdrOvdcdhNrONF_b9uXeInoqvVmKYfY',
      authDomain: config.public.firebase.authDomain || 'haircut-reservation-dev.firebaseapp.com',
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

      console.log('✅ Firebase initialized successfully')
      console.log('✅ Auth instance:', !!auth)
      console.log('✅ Firestore instance:', !!firestore)
      console.log('✅ App instance:', !!app)

      return {
        provide: {
          firebaseApp: app,
          firebaseAuth: auth,
          firebaseFirestore: firestore
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
