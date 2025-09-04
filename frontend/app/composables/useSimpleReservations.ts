// Vue 3 composables are auto-imported
import { getAuth } from 'firebase/auth'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore'

interface Reservation {
  id?: string
  customerName: string // 顧客名
  notes?: string // 備考（オプション）
  date: string // "2025-08-06"形式
  startTime: string // "10:30"形式
  duration: number // 所要時間（分）
  // endTime は計算値のみ（Firestoreには保存しない）
  category: 'cut' | 'color' | 'perm' | 'straight' | 'mesh' | 'other' // 色分け用カテゴリ
  status: 'active' | 'completed' | 'cancelled' // ステータス
  createdAt?: unknown
  updatedAt?: unknown
  createdBy?: string // スタッフID
  userId: string // ユーザーID（必須）
}

// カテゴリ別デフォルト所要時間（分）
const DEFAULT_DURATIONS = {
  cut: 60, // カット：60分
  color: 90, // カラー：90分
  perm: 120, // パーマ：120分
  straight: 180, // 縮毛矯正：180分
  mesh: 90, // メッシュ：90分
  other: 60 // その他：60分
} as const

// 時間計算ユーティリティ関数
const calculateEndTime = (startTime: string, duration: number): string => {
  const [hours = 0, minutes = 0] = startTime.split(':').map(Number)
  const startMinutes = hours * 60 + minutes
  const endMinutes = startMinutes + duration
  const endHours = Math.floor(endMinutes / 60)
  const endMins = endMinutes % 60
  return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
}

export const useReservations = () => {
  const reservations = ref<Reservation[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  let unsubscribe: (() => void) | null = null

  const startRealtimeListener = () => {
    try {
      const auth = getAuth()
      const currentUser = auth.currentUser

      if (!currentUser) {
        console.error('❌ No authenticated user found')
        error.value = '認証が必要です'
        return
      }

      const firestore = getFirestore()
      const reservationsRef = collection(firestore, 'reservations')
      // ユーザーごとの予約を取得するクエリ
      const q = query(
        reservationsRef,
        where('userId', '==', currentUser.uid),
        orderBy('date', 'asc'),
        orderBy('startTime', 'asc')
      )

      unsubscribe = onSnapshot(
        q,
        snapshot => {
          reservations.value = snapshot.docs.map(doc => {
            const data = doc.data()
            // 既存データの互換性対応：timeSlotがある場合はstartTimeに変換
            if (data.timeSlot && !data.startTime) {
              data.startTime = data.timeSlot
              data.duration =
                data.duration ||
                DEFAULT_DURATIONS[data.category as keyof typeof DEFAULT_DURATIONS] ||
                60
            }
            // endTimeは動的計算のみ（保存しない）
            return {
              id: doc.id,
              ...data
            }
          }) as Reservation[]
        },
        err => {
          console.error('❌ Firestore listener error:', err)
          const errorMessage = err instanceof Error ? err.message : 'Unknown error'
          console.error('❌ Listener error details:', {
            name: err instanceof Error ? err.name : 'UnknownError',
            message: errorMessage,
            code: (err as { code?: string })?.code || 'unknown'
          })
          error.value = `データの取得に失敗しました: ${errorMessage}`
        }
      )
    } catch (err) {
      console.error('❌ Failed to start realtime listener:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      error.value = `リアルタイム同期の開始に失敗しました: ${errorMessage}`
    }
  }

  // 予約追加
  const addReservation = async (
    reservation: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
  ) => {
    loading.value = true
    error.value = null

    try {
      const auth = getAuth()
      const currentUser = auth.currentUser

      if (!currentUser) {
        throw new Error('認証が必要です')
      }

      const firestore = getFirestore()
      const reservationsRef = collection(firestore, 'reservations')

      const docData = {
        ...reservation,
        userId: currentUser.uid, // ユーザーIDを追加
        // endTimeは保存しない（動的計算のみ）
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      const docRef = await addDoc(reservationsRef, docData)

      return docRef.id
    } catch (err) {
      console.error('❌ Failed to add reservation:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      error.value = `予約の追加に失敗しました: ${errorMessage}`
      throw err
    } finally {
      loading.value = false
    }
  }

  // 予約更新
  const updateReservation = async (id: string, updates: Partial<Reservation>) => {
    loading.value = true
    error.value = null

    try {
      const firestore = getFirestore()
      const docRef = doc(firestore, 'reservations', id)

      // endTimeは保存しない（動的計算のみ）
      const updateData = { ...updates }

      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      })
    } catch (err) {
      console.error('Failed to update reservation:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      error.value = `予約の更新に失敗しました: ${errorMessage}`
      throw err
    } finally {
      loading.value = false
    }
  }

  // 予約削除
  const deleteReservation = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      const firestore = getFirestore()
      const docRef = doc(firestore, 'reservations', id)
      await deleteDoc(docRef)

      console.log('✅ Reservation deleted:', id)
    } catch (err) {
      console.error('Failed to delete reservation:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      error.value = `予約の削除に失敗しました: ${errorMessage}`
      throw err
    } finally {
      loading.value = false
    }
  }

  // 初期化
  onMounted(async () => {
    // 認証状態を確認
    try {
      const auth = getAuth()
      const currentUser = auth.currentUser

      if (currentUser) {
        startRealtimeListener()
      } else {
        error.value = '認証が必要です'
      }
    } catch (err) {
      console.error('❌ Failed to check authentication:', err)
      // 認証チェックに失敗してもリスナーを開始（フォールバック）
      startRealtimeListener()
    }
  })

  // クリーンアップ
  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe()
    }
  })

  return {
    reservations,
    loading,
    error,
    addReservation,
    updateReservation,
    deleteReservation,
    // ユーティリティ関数もエクスポート
    calculateEndTime,
    DEFAULT_DURATIONS
  }
}

// 後方互換性のため、旧名前でもエクスポート
export const useSimpleReservations = useReservations
