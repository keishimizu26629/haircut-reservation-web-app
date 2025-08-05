const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// Firebase Admin SDK初期化
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'demo-project',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
};

// デモ用設定
const useEmulator = process.env.NODE_ENV !== 'production';

if (useEmulator) {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
}

initializeApp({
  credential: useEmulator ? undefined : cert(serviceAccount),
  projectId: serviceAccount.projectId
});

const db = getFirestore();
const auth = getAuth();

// サンプルデータ初期化
async function initializeSampleData() {
  console.log('サンプルデータの初期化を開始します...');

  try {
    // 1. 設定データ作成
    await createSettings();
    
    // 2. サンプルスタッフ作成
    await createSampleStaff();
    
    // 3. サンプル予約データ作成
    await createSampleReservations();

    console.log('サンプルデータの初期化が完了しました！');
  } catch (error) {
    console.error('初期化エラー:', error);
  }
}

// 設定データ作成
async function createSettings() {
  console.log('設定データを作成中...');
  
  const settings = {
    businessHours: {
      start: '09:00',
      end: '20:00'
    },
    timeSlotDuration: 30,
    maxAdvanceBookingDays: 30,
    categories: ['haircut', 'color', 'perm', 'treatment', 'other'],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };

  await db.collection('settings').doc('reservation-settings').set(settings);
  console.log('設定データが作成されました');
}

// サンプルスタッフ作成
async function createSampleStaff() {
  console.log('サンプルスタッフを作成中...');

  const staffList = [
    {
      email: 'admin@example.com',
      password: 'password123',
      displayName: '管理者',
      role: 'admin'
    },
    {
      email: 'staff1@example.com', 
      password: 'password123',
      displayName: 'スタッフ1',
      role: 'staff'
    },
    {
      email: 'staff2@example.com',
      password: 'password123', 
      displayName: 'スタッフ2',
      role: 'staff'
    }
  ];

  for (const staff of staffList) {
    try {
      // Firebase Authにユーザー作成
      const userRecord = await auth.createUser({
        email: staff.email,
        password: staff.password,
        displayName: staff.displayName,
        emailVerified: true
      });

      // カスタムクレーム設定
      await auth.setCustomUserClaims(userRecord.uid, {
        staff: true,
        admin: staff.role === 'admin',
        staffId: userRecord.uid
      });

      // Firestoreにスタッフ情報保存
      await db.collection('staff').doc(userRecord.uid).set({
        email: staff.email,
        displayName: staff.displayName,
        role: staff.role,
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      console.log(`スタッフ ${staff.displayName} (${staff.email}) が作成されました`);
    } catch (error) {
      console.error(`スタッフ ${staff.email} の作成エラー:`, error.message);
    }
  }
}

// サンプル予約データ作成
async function createSampleReservations() {
  console.log('サンプル予約データを作成中...');

  const today = new Date();
  const reservations = [];

  // 今日から7日間のサンプルデータ作成
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    date.setHours(0, 0, 0, 0);

    // 各日に複数の予約スロット作成
    const timeSlots = ['09:00', '10:30', '13:30', '15:00', '17:30'];
    const categories = ['haircut', 'color', 'perm', 'treatment'];
    const statuses = ['available', 'booked', 'available', 'booked', 'available'];

    timeSlots.forEach((timeSlot, index) => {
      const reservation = {
        date: Timestamp.fromDate(date),
        timeSlot: timeSlot,
        content: statuses[index] === 'booked' ? 'お客様A - カット' : '',
        category: categories[index % categories.length],
        status: statuses[index],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      reservations.push(reservation);
    });
  }

  // バッチ処理で予約データ作成
  const batch = db.batch();
  reservations.forEach(reservation => {
    const docRef = db.collection('reservations').doc();
    batch.set(docRef, reservation);
  });

  await batch.commit();
  console.log(`${reservations.length}件のサンプル予約データが作成されました`);
}

// スクリプト実行
if (require.main === module) {
  initializeSampleData()
    .then(() => {
      console.log('初期化完了');
      process.exit(0);
    })
    .catch(error => {
      console.error('初期化失敗:', error);
      process.exit(1);
    });
}

module.exports = { initializeSampleData };