/**
 * Analytics Monitor - Firebase Analytics 監視ツール
 */

import { getAnalytics, isSupported, logEvent } from 'firebase/analytics'
import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { collection, getFirestore, onSnapshot } from 'firebase/firestore'

// Firebase設定（開発環境）
const firebaseConfig = {
  apiKey: 'AIzaSyBTvdrOvdcdhNrONF_b9uXeInoqvVmKYfY',
  authDomain: 'haircut-reservation-dev.firebaseapp.com',
  projectId: 'haircut-reservation-dev',
  storageBucket: 'haircut-reservation-dev.firebasestorage.app',
  messagingSenderId: '509197594275',
  appId: '1:509197594275:web:c2aab827763cddcf441916',
  measurementId: 'G-XXXXXXXXXX' // Analytics測定ID（Firebase Consoleから取得）
}

class AnalyticsMonitor {
  constructor() {
    this.app = null
    this.analytics = null
    this.auth = null
    this.firestore = null
    this.metrics = {
      pageViews: 0,
      userSessions: 0,
      errors: [],
      performance: [],
      reservations: 0
    }
  }

  async initialize() {
    try {
      console.log('🔍 Analytics Monitor 初期化中...')

      // Firebase初期化
      this.app = initializeApp(firebaseConfig)
      this.auth = getAuth(this.app)
      this.firestore = getFirestore(this.app)

      // Analytics初期化
      const analyticsSupported = await isSupported()
      if (analyticsSupported) {
        this.analytics = getAnalytics(this.app)
        console.log('✅ Firebase Analytics 初期化完了')

        // 初期イベント送信
        this.logCustomEvent('monitor_initialized', {
          timestamp: new Date().toISOString()
        })
      } else {
        console.warn('⚠️ Analytics はこの環境でサポートされていません')
      }

      // 認証状態監視
      this.setupAuthMonitoring()

      // Firestore監視
      this.setupFirestoreMonitoring()

      // パフォーマンス監視
      this.setupPerformanceMonitoring()

      // エラー監視
      this.setupErrorMonitoring()

      return true
    } catch (error) {
      console.error('❌ Analytics Monitor 初期化エラー:', error)
      return false
    }
  }

  // カスタムイベントログ
  logCustomEvent(eventName, parameters = {}) {
    if (this.analytics) {
      logEvent(this.analytics, eventName, parameters)
      console.log(`📊 イベント送信: ${eventName}`, parameters)
    }
  }

  // 認証状態監視
  setupAuthMonitoring() {
    onAuthStateChanged(this.auth, user => {
      if (user) {
        this.metrics.userSessions++
        this.logCustomEvent('user_login', {
          userId: user.uid,
          email: user.email,
          timestamp: new Date().toISOString()
        })
        console.log('👤 ユーザーログイン検出:', user.email)
      } else {
        this.logCustomEvent('user_logout', {
          timestamp: new Date().toISOString()
        })
        console.log('👤 ユーザーログアウト検出')
      }
    })
  }

  // Firestore監視
  setupFirestoreMonitoring() {
    // 予約コレクション監視
    const reservationsRef = collection(this.firestore, 'reservations')
    onSnapshot(
      reservationsRef,
      snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            this.metrics.reservations++
            this.logCustomEvent('reservation_created', {
              reservationId: change.doc.id,
              data: change.doc.data(),
              timestamp: new Date().toISOString()
            })
            console.log('📅 新規予約検出:', change.doc.id)
          }
        })
      },
      error => {
        console.error('❌ Firestore監視エラー:', error)
        this.metrics.errors.push({
          type: 'firestore_error',
          message: error.message,
          timestamp: new Date().toISOString()
        })
      }
    )
  }

  // パフォーマンス監視
  setupPerformanceMonitoring() {
    if (typeof window !== 'undefined' && window.performance) {
      // ページロード時間
      window.addEventListener('load', () => {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart
        this.metrics.performance.push({
          type: 'page_load',
          duration: loadTime,
          timestamp: new Date().toISOString()
        })
        this.logCustomEvent('page_performance', {
          loadTime,
          url: window.location.href
        })
        console.log(`⚡ ページロード時間: ${loadTime}ms`)
      })

      // リソース監視
      const observer = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          if (entry.entryType === 'resource') {
            this.metrics.performance.push({
              type: 'resource_load',
              name: entry.name,
              duration: entry.duration,
              timestamp: new Date().toISOString()
            })
          }
        })
      })
      observer.observe({ entryTypes: ['resource', 'navigation'] })
    }
  }

  // エラー監視
  setupErrorMonitoring() {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', event => {
        const errorInfo = {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          timestamp: new Date().toISOString()
        }
        this.metrics.errors.push(errorInfo)
        this.logCustomEvent('javascript_error', errorInfo)
        console.error('🚨 JavaScriptエラー検出:', errorInfo)
      })

      window.addEventListener('unhandledrejection', event => {
        const errorInfo = {
          reason: event.reason,
          timestamp: new Date().toISOString()
        }
        this.metrics.errors.push(errorInfo)
        this.logCustomEvent('promise_rejection', errorInfo)
        console.error('🚨 Promise拒否検出:', errorInfo)
      })
    }
  }

  // メトリクス取得
  getMetrics() {
    return {
      ...this.metrics,
      summary: {
        totalPageViews: this.metrics.pageViews,
        totalSessions: this.metrics.userSessions,
        totalReservations: this.metrics.reservations,
        totalErrors: this.metrics.errors.length,
        averageLoadTime: this.calculateAverageLoadTime()
      }
    }
  }

  // 平均ロード時間計算
  calculateAverageLoadTime() {
    const loadTimes = this.metrics.performance
      .filter(p => p.type === 'page_load')
      .map(p => p.duration)

    if (loadTimes.length === 0) return 0
    return loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length
  }

  // レポート生成
  generateReport() {
    const metrics = this.getMetrics()
    const report = {
      timestamp: new Date().toISOString(),
      duration: '過去24時間',
      metrics: metrics,
      recommendations: this.generateRecommendations(metrics)
    }

    console.log('📊 Analytics レポート:')
    console.log('========================')
    console.log(`ユーザーセッション: ${metrics.summary.totalSessions}`)
    console.log(`予約数: ${metrics.summary.totalReservations}`)
    console.log(`エラー数: ${metrics.summary.totalErrors}`)
    console.log(`平均ロード時間: ${metrics.summary.averageLoadTime.toFixed(2)}ms`)
    console.log('========================')

    return report
  }

  // 推奨事項生成
  generateRecommendations(metrics) {
    const recommendations = []

    if (metrics.summary.averageLoadTime > 3000) {
      recommendations.push(
        'ページロード時間が3秒を超えています。パフォーマンス最適化を検討してください。'
      )
    }

    if (metrics.summary.totalErrors > 10) {
      recommendations.push('エラー数が多いです。エラーログを確認して修正してください。')
    }

    if (metrics.summary.totalSessions === 0) {
      recommendations.push(
        'ユーザーセッションが検出されていません。認証システムを確認してください。'
      )
    }

    return recommendations
  }
}

// エクスポート
export default AnalyticsMonitor

// 自動実行（ブラウザ環境のみ）
if (typeof window !== 'undefined') {
  const monitor = new AnalyticsMonitor()
  monitor.initialize().then(() => {
    console.log('✅ Analytics Monitor 起動完了')

    // 定期レポート（5分ごと）
    setInterval(() => {
      monitor.generateReport()
    }, 5 * 60 * 1000)

    // グローバル公開（デバッグ用）
    window.analyticsMonitor = monitor
  })
}
