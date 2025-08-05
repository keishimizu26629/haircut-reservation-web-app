/**
 * Firebase Client Plugin - Manual initialization for emulator support
 */
import { initializeApp, getApps } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

export default defineNuxtPlugin(async () => {
  if (process.client) {
    console.log('🔥 Firebase Client Plugin: Initializing Firebase...')
    
    try {
      // Firebase設定
      const firebaseConfig = {
        projectId: 'demo-project',
        apiKey: 'demo-api-key',
        authDomain: 'demo-project.firebaseapp.com',
        storageBucket: 'demo-project.appspot.com',
        messagingSenderId: '123456789',
        appId: 'demo-app-id'
      }

      // Firebase App初期化（重複チェック）
      let app
      if (getApps().length === 0) {
        app = initializeApp(firebaseConfig)
        console.log('🔥 Firebase App initialized')
      } else {
        app = getApps()[0]
        console.log('🔥 Firebase App already exists')
      }

      // Auth & Firestore取得
      const auth = getAuth(app)
      const firestore = getFirestore(app)

      // 開発環境でEmulator接続
      if (process.dev) {
        // Auth Emulator
        if (!(auth as any).config?.emulator) {
          connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
          console.log('🔥 Auth Emulator connected')
        }

        // Firestore Emulator
        const settings = (firestore as any)._settings
        if (!settings?.host?.includes('localhost')) {
          connectFirestoreEmulator(firestore, 'localhost', 8080)
          console.log('🔥 Firestore Emulator connected')
        }
      }

      console.log('🔥 Firebase initialization complete')
      
    } catch (error) {
      console.error('🔥 Firebase initialization failed:', error)
    }
  }
  
  return {
    provide: {
      firebaseIntegration: 'manual-initialized'
    }
  }
})