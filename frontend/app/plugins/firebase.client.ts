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
      // Firebase設定（環境変数から取得）
      const firebaseConfig = {
        projectId: process.env.FIREBASE_PROJECT_ID || 'demo-project',
        apiKey: process.env.FIREBASE_API_KEY || 'demo-api-key',
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '123456789',
        appId: process.env.FIREBASE_APP_ID || 'demo-app-id'
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

      // Emulator接続（FIREBASE_ENV=local の場合）
      if (process.env.FIREBASE_ENV === 'local') {
        const authEmulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099'
        const firestoreEmulatorHost = process.env.FIREBASE_FIRESTORE_EMULATOR_HOST || 'localhost:8080'

        // Auth Emulator
        if (!(auth as any).config?.emulator) {
          connectAuthEmulator(auth, `http://${authEmulatorHost}`, { disableWarnings: true })
          console.log('🔥 Auth Emulator connected:', authEmulatorHost)
        }

        // Firestore Emulator
        const settings = (firestore as any)._settings
        if (!settings?.host?.includes('localhost') && !settings?.host?.includes('firebase-emulator')) {
          const [host, port] = firestoreEmulatorHost.split(':')
          connectFirestoreEmulator(firestore, host, parseInt(port))
          console.log('🔥 Firestore Emulator connected:', firestoreEmulatorHost)
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
