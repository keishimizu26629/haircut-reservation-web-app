import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  Timestamp,
  type Unsubscribe
} from 'firebase/firestore'

// 予約データの型定義（シンプル版）
export interface SimpleReservation {
  id?: string
  date: string
  time: string
  customerName: string
  customerPhone: string
  category: 'cut' | 'color' | 'perm' | 'treatment' | 'set' | 'other'
  details: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  createdAt?: Date
  updatedAt?: Date
  createdBy?: string
}

// カレンダー表示用の予約データ型
export interface CalendarAppointment {
  id: string
  title: string
  startTime: Date
  endTime: Date
  status: string
  customerName: string
  duration: number
}

export const useSimpleReservations = () => {
  // リアクティブな状態
  const reservations = ref<SimpleReservation[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Firestoreリスナー
  let unsubscribe: Unsubscribe | null = null
  
  // カテゴリラベルのマッピング
  const categoryLabels = {
    'cut': 'カット',
    'color': 'カラー',
    'perm': 'パーマ',
    'treatment': 'トリートメント',
    'set': 'セット',
    'other': 'その他'
  }
  
  // 予約データをカレンダー用にフォーマット
  const appointments = computed((): CalendarAppointment[] => {
    return reservations.value.map(reservation => {
      const startTime = new Date(`${reservation.date}T${reservation.time}`)
      const endTime = new Date(startTime.getTime() + (90 * 60 * 1000)) // デフォルト90分
      
      return {
        id: reservation.id || '',
        title: categoryLabels[reservation.category] || reservation.category,
        startTime,
        endTime,
        status: reservation.status,
        customerName: reservation.customerName,
        duration: 90
      }
    })
  })
  
  // 統計データの計算
  const todayReservations = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return reservations.value.filter(r => r.date === today)
  })
  
  const pendingReservations = computed(() => {
    return reservations.value.filter(r => r.status === 'pending')
  })
  
  const confirmedReservations = computed(() => {
    return reservations.value.filter(r => r.status === 'confirmed')
  })
  
  const monthlyReservations = computed(() => {
    const now = new Date()
    const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0')
    return reservations.value.filter(r => r.date.startsWith(currentMonth))
  })
  
  // リアルタイムリスナーの開始（dev2のFirebase設定完了後に有効化）
  const startRealtimeListener = async () => {
    if (unsubscribe) return // 既にリスナーが存在する場合は何もしない
    
    loading.value = true
    error.value = null
    
    try {
      // Firebase/Firestoreが利用可能かチェック
      const { $firestore } = useNuxtApp()
      if (!$firestore) {
        console.log('📊 Firestore not available, using demo data')
        initializeDemoData()
        return
      }
      
      const reservationsCollection = collection($firestore, 'simple-reservations')
      const q = query(reservationsCollection, orderBy('date', 'asc'), orderBy('time', 'asc'))
      
      unsubscribe = onSnapshot(q, (snapshot) => {
        const newReservations: SimpleReservation[] = []
        
        snapshot.forEach((doc) => {
          const data = doc.data()
          newReservations.push({
            id: doc.id,
            date: data.date,
            time: data.time,
            customerName: data.customerName,
            customerPhone: data.customerPhone || '',
            category: data.category,
            details: data.details || '',
            status: data.status,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            createdBy: data.createdBy
          })
        })
        
        reservations.value = newReservations
        loading.value = false
        console.log(`✅ Loaded ${newReservations.length} reservations from Firestore`)
      }, (err) => {
        console.error('Error fetching reservations:', err)
        error.value = 'データの取得に失敗しました'
        loading.value = false
        // フォールバックとしてデモデータを使用
        initializeDemoData()
      })
    } catch (err) {
      console.error('Error setting up listener:', err)
      error.value = 'リアルタイム同期の設定に失敗しました'
      loading.value = false
      // フォールバックとしてデモデータを使用
      initializeDemoData()
    }
  }
  
  // リアルタイムリスナーの停止
  const stopRealtimeListener = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
      console.log('🔌 Firestore listener stopped')
    }
  }
  
  // 新規予約の作成
  const createReservation = async (reservationData: Omit<SimpleReservation, 'id' | 'createdAt' | 'updatedAt'>) => {
    loading.value = true
    error.value = null
    
    try {
      const { $firestore } = useNuxtApp()
      if (!$firestore) {
        // Firestoreが利用できない場合は、ローカルで追加
        const newReservation: SimpleReservation = {
          ...reservationData,
          id: Date.now().toString(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
        reservations.value.push(newReservation)
        console.log('✅ Reservation created locally (Firestore not available)')
        return newReservation.id
      }
      
      const reservationsCollection = collection($firestore, 'simple-reservations')
      
      const docData = {
        ...reservationData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }
      
      const docRef = await addDoc(reservationsCollection, docData)
      console.log('✅ Reservation created with ID:', docRef.id)
      
      return docRef.id
    } catch (err) {
      console.error('Error creating reservation:', err)
      error.value = '予約の作成に失敗しました'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // 予約の更新
  const updateReservation = async (id: string, updates: Partial<SimpleReservation>) => {
    loading.value = true
    error.value = null
    
    try {
      const { $firestore } = useNuxtApp()
      if (!$firestore) {
        // Firestoreが利用できない場合は、ローカルで更新
        const index = reservations.value.findIndex(r => r.id === id)
        if (index !== -1) {
          reservations.value[index] = {
            ...reservations.value[index],
            ...updates,
            updatedAt: new Date()
          }
          console.log('✅ Reservation updated locally (Firestore not available)')
        }
        return
      }
      
      const reservationRef = doc($firestore, 'simple-reservations', id)
      
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now()
      }
      
      await updateDoc(reservationRef, updateData)
      console.log('✅ Reservation updated:', id)
    } catch (err) {
      console.error('Error updating reservation:', err)
      error.value = '予約の更新に失敗しました'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // 予約の削除
  const deleteReservation = async (id: string) => {
    loading.value = true
    error.value = null
    
    try {
      const { $firestore } = useNuxtApp()
      if (!$firestore) {
        // Firestoreが利用できない場合は、ローカルで削除
        const index = reservations.value.findIndex(r => r.id === id)
        if (index !== -1) {
          reservations.value.splice(index, 1)
          console.log('✅ Reservation deleted locally (Firestore not available)')
        }
        return
      }
      
      const reservationRef = doc($firestore, 'simple-reservations', id)
      await deleteDoc(reservationRef)
      console.log('✅ Reservation deleted:', id)
    } catch (err) {
      console.error('Error deleting reservation:', err)
      error.value = '予約の削除に失敗しました'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // 特定日の予約を取得
  const getReservationsByDate = (date: string) => {
    return reservations.value.filter(r => r.date === date)
  }
  
  // 特定のIDの予約を取得
  const getReservationById = (id: string) => {
    return reservations.value.find(r => r.id === id)
  }
  
  // 予約の空き時間をチェック
  const getAvailableTimeSlots = (date: string, businessHours: { start: number, end: number }) => {
    const reservedTimes = getReservationsByDate(date).map(r => r.time)
    const availableSlots = []
    
    for (let hour = businessHours.start; hour < businessHours.end; hour++) {
      const timeSlot = `${hour.toString().padStart(2, '0')}:00`
      if (!reservedTimes.includes(timeSlot)) {
        availableSlots.push(timeSlot)
      }
    }
    
    return availableSlots
  }
  
  // デモデータの初期化（Firestore接続前のフォールバック）
  const initializeDemoData = () => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    reservations.value = [
      {
        id: 'demo-1',
        date: today.toISOString().split('T')[0],
        time: '10:00',
        customerName: '田中太郎',
        customerPhone: '090-1234-5678',
        category: 'cut',
        details: '前回と同じスタイルで、少し短くしたい',
        status: 'confirmed',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'demo-2',
        date: today.toISOString().split('T')[0],
        time: '14:00',
        customerName: '佐藤花子',
        customerPhone: '080-9876-5432',
        category: 'color',
        details: 'ブラウン系のカラーでお願いします',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'demo-3',
        date: tomorrow.toISOString().split('T')[0],
        time: '11:00',
        customerName: '鈴木次郎',
        customerPhone: '070-1111-2222',
        category: 'perm',
        details: 'ゆるめのパーマでお願いします',
        status: 'confirmed',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    loading.value = false
    console.log('📊 Demo data initialized (Firestore not available)')
  }
  
  // ライフサイクル管理
  onMounted(() => {
    // Firestoreリスナーの開始またはデモデータの初期化を試行
    if (process.client) {
      startRealtimeListener()
    }
  })
  
  onUnmounted(() => {
    stopRealtimeListener()
  })
  
  return {
    // データ
    reservations: readonly(reservations),
    appointments,
    loading: readonly(loading),
    error: readonly(error),
    
    // 統計
    todayReservations,
    pendingReservations,
    confirmedReservations,
    monthlyReservations,
    
    // メソッド
    createReservation,
    updateReservation,
    deleteReservation,
    getReservationsByDate,
    getReservationById,
    getAvailableTimeSlots,
    startRealtimeListener,
    stopRealtimeListener,
    
    // ユーティリティ
    categoryLabels,
    initializeDemoData
  }
}