/**
 * 軽量版予約処理Composable
 * パフォーマンス最適化のため、最小限のFirebase操作のみ実装
 */
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

export const useBookingLite = () => {
  const { $firestore } = useNuxtApp()
  
  // 予約データの型定義
  interface BookingData {
    service: string
    stylist: string
    date: string
    time: string
    name: string
    phone: string
    notes: string
  }
  
  // 軽量な予約作成処理
  const createReservation = async (bookingData: BookingData, userId: string) => {
    try {
      // 最小限の予約データ構造
      const reservationData = {
        userId,
        tenantId: 'default-salon', // 固定値でパフォーマンス最適化
        serviceType: bookingData.service,
        stylistId: bookingData.stylist || null,
        scheduledDate: bookingData.date,
        scheduledTime: bookingData.time,
        customerName: bookingData.name,
        customerPhone: bookingData.phone,
        notes: bookingData.notes || '',
        status: 'confirmed',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
      
      // 単一のFirestore書き込み操作
      const docRef = await addDoc(collection($firestore, 'reservations'), reservationData)
      
      console.log('✅ 予約作成完了:', docRef.id)
      return docRef.id
      
    } catch (error) {
      console.error('❌ 予約作成エラー:', error)
      throw new Error('予約の作成に失敗しました。もう一度お試しください。')
    }
  }
  
  return {
    createReservation
  }
}