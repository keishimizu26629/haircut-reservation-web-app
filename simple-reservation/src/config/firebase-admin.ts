import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Firebase Admin SDK初期化
export function initializeFirebaseAdmin() {
  // 既に初期化されている場合はスキップ
  if (getApps().length > 0) {
    return;
  }

  // 環境変数から認証情報を取得
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  };

  // 必要な環境変数のチェック
  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    throw new Error('Firebase Admin SDK の環境変数が設定されていません');
  }

  // Firebase Admin SDK初期化
  initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.projectId
  });

  console.log('Firebase Admin SDK が初期化されました');
}

// Firebase Admin サービスのエクスポート
export const adminAuth = () => getAuth();
export const adminFirestore = () => getFirestore();

// 初期化実行
initializeFirebaseAdmin();