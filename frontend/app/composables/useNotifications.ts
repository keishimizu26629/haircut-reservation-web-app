import { ref, computed, readonly } from 'vue'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: string
  actionUrl?: string
}

export const useNotifications = () => {
  const notifications = ref<Notification[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 未読通知数
  const unreadCount = computed(() =>
    notifications.value.filter(n => !n.read).length
  )

  // 未読通知のみ
  const unreadNotifications = computed(() =>
    notifications.value.filter(n => !n.read)
  )

  // 最新の通知（5件）
  const recentNotifications = computed(() =>
    notifications.value
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  )

  // 通知一覧を取得
  const fetchNotifications = async () => {
    loading.value = true
    error.value = null

    try {
      // TODO: 実際のAPI呼び出しに置き換える
      // const response = await $fetch('/api/notifications')

      // モックデータ
      notifications.value = [
        {
          id: '1',
          title: '新規予約',
          message: '田中太郎様から新しい予約が入りました',
          type: 'info',
          read: false,
          createdAt: new Date().toISOString(),
          actionUrl: '/admin/reservations/1'
        },
        {
          id: '2',
          title: '予約キャンセル',
          message: '佐藤花子様の予約がキャンセルされました',
          type: 'warning',
          read: false,
          createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1時間前
        },
        {
          id: '3',
          title: '売上目標達成',
          message: '今月の売上目標を達成しました！',
          type: 'success',
          read: true,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1日前
        }
      ]
    } catch (err: any) {
      error.value = err.message || '通知の取得に失敗しました'
    } finally {
      loading.value = false
    }
  }

  // 通知を既読にする
  const markAsRead = async (notificationId: string) => {
    try {
      // TODO: 実際のAPI呼び出しに置き換える
      // await $fetch(`/api/notifications/${notificationId}/read`, {
      //   method: 'PUT'
      // })

      const notification = notifications.value.find(n => n.id === notificationId)
      if (notification) {
        notification.read = true
      }
    } catch (err: any) {
      error.value = err.message || '通知の更新に失敗しました'
    }
  }

  // 全ての通知を既読にする
  const markAllAsRead = async () => {
    loading.value = true
    error.value = null

    try {
      // TODO: 実際のAPI呼び出しに置き換える
      // await $fetch('/api/notifications/read-all', {
      //   method: 'PUT'
      // })

      notifications.value.forEach(notification => {
        notification.read = true
      })
    } catch (err: any) {
      error.value = err.message || '通知の一括更新に失敗しました'
    } finally {
      loading.value = false
    }
  }

  // 通知を削除
  const deleteNotification = async (notificationId: string) => {
    try {
      // TODO: 実際のAPI呼び出しに置き換える
      // await $fetch(`/api/notifications/${notificationId}`, {
      //   method: 'DELETE'
      // })

      const index = notifications.value.findIndex(n => n.id === notificationId)
      if (index > -1) {
        notifications.value.splice(index, 1)
      }
    } catch (err: any) {
      error.value = err.message || '通知の削除に失敗しました'
    }
  }

  // 新しい通知を作成（システム内部用）
  const createNotification = (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }

    notifications.value.unshift(newNotification)
  }

  // プッシュ通知の設定
  const enablePushNotifications = async () => {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission()
        return permission === 'granted'
      }
      return false
    } catch (err: any) {
      error.value = err.message || 'プッシュ通知の設定に失敗しました'
      return false
    }
  }

  // プッシュ通知を送信
  const sendPushNotification = (title: string, options?: NotificationOptions) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, options)
    }
  }

  return {
    // State
    notifications: readonly(notifications),
    loading: readonly(loading),
    error: readonly(error),

    // Computed
    unreadCount,
    unreadNotifications,
    recentNotifications,

    // Actions
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    enablePushNotifications,
    sendPushNotification
  }
}
