// Vue 3 composables are auto-imported
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore'
import { getFirebaseInstances } from '../stores/auth'

interface SimpleReservation {
  id?: string
  customerName: string // 顧客名
  notes?: string // 備考（オプション）
  date: string
  timeSlot: string // "09:00", "09:30"形式
  category: 'cut' | 'color' | 'perm' | 'straight' | 'mesh' | 'other' // 色分け用カテゴリ
  status: 'active' | 'completed' | 'cancelled' // ステータス
  createdAt?: any
  updatedAt?: any
  createdBy?: string // スタッフID
}

export const useSimpleReservations = () => {
  const reservations = ref<SimpleReservation[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  let unsubscribe: (() => void) | null = null

  const startRealtimeListener = () => {
    try {
      console.log('🔄 Starting realtime listener...')
      const { firestore } = getFirebaseInstances()
      console.log('🔥 Firestore instance for listener:', !!firestore)

      const reservationsRef = collection(firestore, 'reservations')
      const q = query(reservationsRef, orderBy('date', 'asc'), orderBy('timeSlot', 'asc'))
      console.log('🔍 Query created for reservations')

      unsubscribe = onSnapshot(
        q,
        snapshot => {
          console.log('📡 Snapshot received:', {
            empty: snapshot.empty,
            size: snapshot.size,
            hasPendingWrites: snapshot.metadata.hasPendingWrites,
            fromCache: snapshot.metadata.fromCache
          })

          reservations.value = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as SimpleReservation[]

          console.log(`📅 Loaded ${reservations.value.length} reservations`)
          if (reservations.value.length > 0) {
            console.log('📋 Sample reservation:', reservations.value[0])
          }
        },
        err => {
          console.error('❌ Firestore listener error:', err)
          const errorMessage = err instanceof Error ? err.message : 'Unknown error'
          console.error('❌ Listener error details:', {
            name: err instanceof Error ? err.name : 'UnknownError',
            message: errorMessage,
            code: (err as any)?.code || 'unknown'
          })
          error.value = `データの取得に失敗しました: ${errorMessage}`
        }
      )
      console.log('✅ Realtime listener started')
    } catch (err) {
      console.error('❌ Failed to start realtime listener:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('❌ Listener startup error details:', {
        name: err instanceof Error ? err.name : 'UnknownError',
        message: errorMessage,
        code: (err as any)?.code || 'unknown'
      })
      error.value = `リアルタイム同期の開始に失敗しました: ${errorMessage}`
    }
  }

  // 予約追加
  const addReservation = async (
    reservation: Omit<SimpleReservation, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    loading.value = true
    error.value = null

    console.log('🔄 Adding reservation:', {
      customerName: reservation.customerName,
      notes: reservation.notes,
      date: reservation.date,
      timeSlot: reservation.timeSlot,
      category: reservation.category,
      status: reservation.status
    })

    try {
      const { firestore } = getFirebaseInstances()
      console.log('🔥 Firestore instance:', !!firestore)

      const reservationsRef = collection(firestore, 'reservations')
      console.log('📝 Collection reference created')

      const docData = {
        ...reservation,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
      console.log('📄 Document data prepared:', docData)

      const docRef = await addDoc(reservationsRef, docData)
      console.log('✅ Reservation added successfully:', docRef.id)

      return docRef.id
    } catch (err) {
      console.error('❌ Failed to add reservation:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('❌ Error details:', {
        name: err instanceof Error ? err.name : 'UnknownError',
        message: errorMessage,
        code: (err as any)?.code || 'unknown',
        stack: err instanceof Error ? err.stack : 'No stack trace'
      })
      error.value = `予約の追加に失敗しました: ${errorMessage}`
      throw err
    } finally {
      loading.value = false
    }
  }

  // 予約更新
  const updateReservation = async (id: string, updates: Partial<SimpleReservation>) => {
    loading.value = true
    error.value = null

    try {
      const { firestore } = getFirebaseInstances()
      const docRef = doc(firestore, 'reservations', id)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      })

      console.log('✅ Reservation updated:', id)
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
      const { firestore } = getFirebaseInstances()
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
    console.log('🚀 useSimpleReservations: Initializing...')

    // 認証状態を確認
    try {
      const { getCurrentUser } = await import('vuefire')
      const currentUser = await getCurrentUser()
      console.log('👤 Current user:', currentUser ? currentUser.uid : 'Not authenticated')

      if (currentUser) {
        console.log('✅ User authenticated, starting listener')
        startRealtimeListener()
      } else {
        console.warn('⚠️ User not authenticated, skipping listener')
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
    deleteReservation
  }
}
