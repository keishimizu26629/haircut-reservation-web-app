import { cert, getApps, initializeApp } from 'firebase-admin/app'

// Firebase Admin SDK 安全初期化プラグイン
export default defineNitroPlugin(async () => {
  try {
    // 既に初期化されている場合はスキップ
    const apps = getApps()
    if (apps && apps.length > 0) {
      console.log('ℹ️  Firebase Admin SDK already initialized')
      return
    }

    // 環境検出
    const isDevelopment = process.env.NODE_ENV === 'development'
    const isEmulatorMode =
      process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST
    const projectId =
      process.env.FIREBASE_PROJECT_ID || (isDevelopment ? 'demo-project' : 'demo-project')

    console.log(
      `🔧 Firebase Admin SDK - Environment: ${isDevelopment ? 'development' : 'production'}`
    )
    console.log(`🔧 Firebase Admin SDK - Project ID: ${projectId}`)
    console.log(`🔧 Firebase Admin SDK - Emulator Mode: ${!!isEmulatorMode}`)

    // Emulatorモードでの初期化
    if (isDevelopment || isEmulatorMode) {
      // Emulator環境用の環境変数設定
      if (!process.env.FIRESTORE_EMULATOR_HOST) {
        process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'
      }
      if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
        process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099'
      }

      // シンプルな初期化（Emulator対応）
      initializeApp({
        projectId: projectId
      })

      console.log('✅ Firebase Admin SDK initialized for Development/Emulator')
      console.log(`   - Firestore Emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`)
      console.log(`   - Auth Emulator: ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`)
    } else {
      // 本番環境での初期化
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT

      if (serviceAccount) {
        try {
          const serviceAccountKey = JSON.parse(serviceAccount)
          initializeApp({
            credential: cert(serviceAccountKey),
            projectId: projectId
          })
          console.log('✅ Firebase Admin SDK initialized for Production with Service Account')
        } catch (error) {
          console.error('❌ Service Account parsing failed:', error)
          throw error
        }
      } else {
        // Application Default Credentials を使用
        initializeApp({
          projectId: projectId
        })
        console.log('✅ Firebase Admin SDK initialized with Application Default Credentials')
      }
    }

    // 初期化後の基本テスト
    const initializedApps = getApps()
    if (initializedApps && initializedApps.length > 0) {
      const app = initializedApps[0]
      console.log(`✅ Firebase Admin App initialized: ${app?.name} (${app?.options?.projectId})`)
    }
  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization failed:', error)

    // Critical error - do not continue with broken initialization
    throw new Error(
      `Firebase Admin SDK initialization failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
})
