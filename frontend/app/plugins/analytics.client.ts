import { logEvent, setUserId, setUserProperties } from 'firebase/analytics'

export default defineNuxtPlugin((nuxtApp) => {
  const { $analytics } = nuxtApp

  // Only run in production and if analytics is available
  if (process.env.NODE_ENV !== 'production' || !$analytics) {
    return
  }

  // Page view tracking
  const router = useRouter()
  router.afterEach((to) => {
    logEvent($analytics, 'page_view', {
      page_title: to.meta.title || to.name,
      page_location: to.fullPath,
      page_path: to.path
    })
  })

  // User authentication tracking
  const user = useCurrentUser()
  watch(user, (newUser) => {
    if (newUser) {
      setUserId($analytics, newUser.uid)
      setUserProperties($analytics, {
        user_type: newUser.customClaims?.admin ? 'admin' :
                  newUser.customClaims?.staff ? 'staff' : 'customer'
      })

      logEvent($analytics, 'login', {
        method: newUser.providerData[0]?.providerId || 'unknown'
      })
    } else {
      setUserId($analytics, null)
      logEvent($analytics, 'logout')
    }
  })

  // Custom event tracking helpers
  const trackReservation = (eventName: string, reservationData: any) => {
    logEvent($analytics, eventName, {
      reservation_id: reservationData.id,
      service_type: reservationData.serviceType,
      staff_id: reservationData.staffId,
      value: reservationData.price
    })
  }

  // トラッキング関数を追加
  const trackError = (error: any, context: string) => {
    console.error(`[Analytics Error] ${context}:`, error)
    // TODO: 実際の分析サービスに送信する実装を追加
    // 例: Google Analytics, Sentry, etc.
  }

  const trackPageView = (pageName: string) => {
    console.log(`[Analytics] Page view: ${pageName}`)
    // TODO: 実際の分析サービスに送信する実装を追加
  }

  const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
    console.log(`[Analytics] Event: ${eventName}`, parameters)
    // TODO: 実際の分析サービスに送信する実装を追加
  }

  const trackPerformance = (metricName: string, value: number) => {
    logEvent($analytics, 'timing_complete', {
      name: metricName,
      value: Math.round(value)
    })
  }

  // Provide tracking functions globally
  return {
    provide: {
      trackReservation,
      trackError,
      trackPageView,
      trackEvent,
      trackPerformance
    }
  }
})
