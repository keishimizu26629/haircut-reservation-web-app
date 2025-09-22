/**
 * Firebase設定ローダー
 * 生成された設定ファイルを安全に読み込む
 */

export interface FirebaseConfigData {
  FIREBASE_CONFIG: {
    projectId: string
    apiKey: string
    authDomain: string
    storageBucket: string
    messagingSenderId: string
    appId: string
  }
  ENVIRONMENT: string
  NODE_ENV: string
  IS_PRODUCTION: boolean
  FALLBACK_CONFIG: any
}

/**
 * 生成されたFirebase設定を安全に読み込む
 */
export async function loadGeneratedFirebaseConfig(): Promise<FirebaseConfigData | null> {
  // クライアントサイドでのみ実行
  if (process.server) {
    return null
  }

  try {
    // 動的インポートで設定ファイルを読み込み（存在しない場合はnullを返す）
    const configModule = await import('~/app/config/firebase-generated').catch(() => {
      console.warn('⚠️ Generated Firebase config file not found, using fallback')
      return null
    })
    
    if (!configModule) {
      return null
    }
    
    if (configModule?.FIREBASE_CONFIG?.projectId) {
      console.log('✅ Generated Firebase config loaded successfully')
      return configModule as FirebaseConfigData
    } else {
      console.warn('⚠️ Generated Firebase config is incomplete')
      return null
    }
  } catch (error) {
    console.warn('⚠️ Error loading generated Firebase config:', error)
    return null
  }
}
