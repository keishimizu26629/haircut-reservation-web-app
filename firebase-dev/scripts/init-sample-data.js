#!/usr/bin/env node

/**
 * Firestore初期サンプルデータ投入スクリプト
 * 美容室予約システム用
 */

const admin = require('firebase-admin')
const path = require('path')

// Firebase Admin SDK初期化
const serviceAccountPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.join(__dirname, '../haircut-reservation-dev-firebase-adminsdk.json')

try {
  const serviceAccount = require(serviceAccountPath)

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'haircut-reservation-dev'
  })

  console.log('✅ Firebase Admin SDK initialized')
} catch (error) {
  console.error('❌ Firebase Admin SDK initialization failed:', error.message)
  console.log('💡 Make sure you have the service account key file')
  process.exit(1)
}

const db = admin.firestore()

// サンプルデータ
const sampleReservations = [
  {
    customerName: '田中太郎',
    notes: 'カット＆カラー、ロング',
    date: '2024-01-15',
    timeSlot: '10:00',
    category: 'color',
    status: 'active',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'admin'
  },
  {
    customerName: '佐藤花子',
    notes: 'パーマ、ミディアム',
    date: '2024-01-15',
    timeSlot: '14:00',
    category: 'perm',
    status: 'active',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'admin'
  },
  {
    customerName: '山田次郎',
    notes: 'カットのみ',
    date: '2024-01-16',
    timeSlot: '09:30',
    category: 'cut',
    status: 'completed',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'admin'
  },
  {
    customerName: '鈴木美咲',
    notes: '縮毛矯正、ロング',
    date: '2024-01-16',
    timeSlot: '13:00',
    category: 'straight',
    status: 'active',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'admin'
  },
  {
    customerName: '高橋健太',
    notes: 'メッシュ、ショート',
    date: '2024-01-17',
    timeSlot: '11:00',
    category: 'mesh',
    status: 'active',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'admin'
  }
]

const sampleUsers = [
  {
    uid: 'admin',
    displayName: '管理者',
    email: 'admin@haircut-reservation.dev',
    role: 'admin',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  }
]

async function initSampleData() {
  try {
    console.log('🚀 Starting sample data initialization...')

    // 既存データの確認
    const existingReservations = await db.collection('reservations').limit(1).get()
    if (!existingReservations.empty) {
      console.log('⚠️  Reservations collection already has data')
      const shouldContinue = process.argv.includes('--force')
      if (!shouldContinue) {
        console.log('💡 Use --force flag to add data anyway')
        return
      }
    }

    // 予約データ投入
    console.log('📅 Adding sample reservations...')
    const batch = db.batch()

    sampleReservations.forEach((reservation, index) => {
      const docRef = db.collection('reservations').doc()
      batch.set(docRef, reservation)
      console.log(
        `  ✓ ${reservation.customerName} - ${reservation.notes} (${reservation.date} ${reservation.timeSlot})`
      )
    })

    // ユーザーデータ投入
    console.log('👥 Adding sample users...')
    sampleUsers.forEach(user => {
      const { uid, ...userData } = user
      const userRef = db.collection('users').doc(uid)
      batch.set(userRef, userData)
      console.log(`  ✓ ${userData.displayName} (${userData.email})`)
    })

    // バッチ実行
    await batch.commit()

    console.log('✅ Sample data initialization completed!')
    console.log(
      `📊 Added ${sampleReservations.length} reservations and ${sampleUsers.length} users`
    )

    // データ確認
    const reservationCount = await db.collection('reservations').get()
    const userCount = await db.collection('users').get()

    console.log('\n📋 Current data summary:')
    console.log(`  Reservations: ${reservationCount.size}`)
    console.log(`  Users: ${userCount.size}`)
  } catch (error) {
    console.error('❌ Error initializing sample data:', error)
    process.exit(1)
  }
}

// スクリプト実行
if (require.main === module) {
  initSampleData()
    .then(() => {
      console.log('\n🎉 All done!')
      process.exit(0)
    })
    .catch(error => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}

module.exports = { initSampleData }
