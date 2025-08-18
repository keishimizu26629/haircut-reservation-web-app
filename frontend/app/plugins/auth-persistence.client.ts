/**
 * Firebase Auth永続化プラグイン - Docker環境対応
 * セッション情報の確実な永続化と復元を行う
 */
import { getAuth, onAuthStateChanged } from 'firebase/auth'

export default defineNuxtPlugin(async () => {
  if (import.meta.client) {
    console.log('🔐 Auth Persistence Plugin: Starting...')

    try {
      // 少し待機してFirebaseが初期化されるのを待つ
      await new Promise(resolve => setTimeout(resolve, 100))

      const auth = getAuth()

      // 認証状態の変更を監視して永続化を確実にする
      onAuthStateChanged(auth, user => {
        if (user) {
          console.log('🔐 Auth Persistence: User authenticated, updating session')
          // セッション活動記録を更新
          localStorage.setItem('lastActivity', Date.now().toString())
          localStorage.setItem(
            'firebase-auth-user',
            JSON.stringify({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              timestamp: Date.now()
            })
          )
        } else {
          console.log('🔐 Auth Persistence: User signed out, clearing session')
          localStorage.removeItem('lastActivity')
          localStorage.removeItem('firebase-auth-user')
        }
      })

      console.log('🔐 Auth Persistence Plugin: Initialized successfully')
    } catch (error) {
      console.warn('🔐 Auth Persistence Plugin: Initialization warning:', error)
    }
  }
})
