import { FullConfig } from '@playwright/test';
import { execSync, spawn, ChildProcess } from 'child_process';
// Node.js 組み込みのfetchを使用

// Firebase Emulator設定
const FIREBASE_EMULATOR_HOST = 'localhost';
const FIRESTORE_PORT = 8080;
const AUTH_PORT = 9099;
const FIREBASE_UI_PORT = 4000;

// グローバル変数でプロセス管理
let firebaseEmulatorProcess: ChildProcess | null = null;

async function globalSetup(config: FullConfig) {
  console.log('🚀 Firebase Emulator + E2E Test Global Setup starting...');

  // 環境変数設定
  process.env.NODE_ENV = 'test';
  process.env.BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
  process.env.API_URL = process.env.API_URL || 'http://localhost:3001';

  // Firebase Emulator環境変数設定
  process.env.FIRESTORE_EMULATOR_HOST = `${FIREBASE_EMULATOR_HOST}:${FIRESTORE_PORT}`;
  process.env.FIREBASE_AUTH_EMULATOR_HOST = `${FIREBASE_EMULATOR_HOST}:${AUTH_PORT}`;

  console.log('📋 Test environment configured:');
  console.log(`- BASE_URL: ${process.env.BASE_URL}`);
  console.log(`- FIRESTORE_EMULATOR_HOST: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  console.log(`- FIREBASE_AUTH_EMULATOR_HOST: ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);

  // 既存のFirebase Emulatorプロセスを停止
  await stopExistingEmulators();

  // Firebase Emulator Suite起動確認
  const isEmulatorRunning = await checkEmulatorHealth();

  if (!isEmulatorRunning) {
    console.log('🔥 Starting Firebase Emulator Suite...');
    await startFirebaseEmulator();

    // エミュレーター起動待機
    await waitForEmulatorReady();
  } else {
    console.log('✅ Firebase Emulator Suite already running');
  }

  // テストデータの初期化
  await initializeTestData();

  console.log('✅ Global setup completed successfully');
}

async function stopExistingEmulators(): Promise<void> {
  try {
    console.log('🧹 Stopping existing Firebase Emulators...');

    // Firebase CLI経由でエミュレーター停止
    execSync('cd ../simple-reservation && npx firebase emulators:kill', {
      stdio: 'pipe',
      timeout: 10000
    });

    // ポートベースでプロセス強制終了
    const ports = [FIRESTORE_PORT, AUTH_PORT, FIREBASE_UI_PORT];

    for (const port of ports) {
      try {
        execSync(`lsof -ti:${port} | xargs kill -9`, {
          stdio: 'pipe',
          timeout: 5000
        });
      } catch (error) {
        // ポートが使用されていない場合は無視
      }
    }

    // 少し待機
    await new Promise(resolve => setTimeout(resolve, 2000));

  } catch (error) {
    console.log('⚠️ No existing emulators to stop');
  }
}

async function startFirebaseEmulator(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Firebase Emulator Suite を非同期で起動
      firebaseEmulatorProcess = spawn('npm', ['run', 'start:dev'], {
        cwd: '../simple-reservation',
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false
      });

      let startupComplete = false;

      firebaseEmulatorProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        console.log(`📦 Firebase Emulator: ${output.trim()}`);

        // エミュレーター起動完了の判定
        if (output.includes('All emulators ready') || output.includes('View Emulator UI at')) {
          startupComplete = true;
          resolve();
        }
      });

      firebaseEmulatorProcess.stderr?.on('data', (data) => {
        const error = data.toString();
        if (!error.includes('warn')) {
          console.error(`❌ Firebase Emulator Error: ${error.trim()}`);
        }
      });

      firebaseEmulatorProcess.on('error', (error) => {
        console.error('❌ Failed to start Firebase Emulator:', error);
        reject(error);
      });

      // タイムアウト処理
      setTimeout(() => {
        if (!startupComplete) {
          console.log('⏰ Firebase Emulator startup timeout, proceeding...');
          resolve();
        }
      }, 30000);

    } catch (error) {
      console.error('❌ Error starting Firebase Emulator:', error);
      reject(error);
    }
  });
}

async function waitForEmulatorReady(): Promise<void> {
  const maxRetries = 30;
  const retryDelay = 2000;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const isReady = await checkEmulatorHealth();
      if (isReady) {
        console.log('✅ Firebase Emulator Suite is ready');
        return;
      }
    } catch (error) {
      // 接続エラーは無視して続行
    }

    console.log(`⏳ Waiting for Firebase Emulator... (${i + 1}/${maxRetries})`);
    await new Promise(resolve => setTimeout(resolve, retryDelay));
  }

  throw new Error('Firebase Emulator failed to start within timeout');
}

async function checkEmulatorHealth(): Promise<boolean> {
  try {
    // Firebase UI の健康状態確認
    const uiResponse = await fetch(`http://${FIREBASE_EMULATOR_HOST}:${FIREBASE_UI_PORT}`, {
      timeout: 3000
    });

    // Firestore エミュレーターの健康状態確認
    const firestoreResponse = await fetch(`http://${FIREBASE_EMULATOR_HOST}:${FIRESTORE_PORT}`, {
      timeout: 3000
    });

    return uiResponse.ok && firestoreResponse.ok;
  } catch (error) {
    return false;
  }
}

async function initializeTestData(): Promise<void> {
  try {
    console.log('🗂️ Initializing test data...');

    // サンプルデータ初期化スクリプト実行
    execSync('cd ../simple-reservation && npm run init-data', {
      stdio: 'pipe',
      timeout: 30000,
      env: {
        ...process.env,
        NODE_ENV: 'test'
      }
    });

    console.log('✅ Test data initialized successfully');
  } catch (error) {
    console.warn('⚠️ Test data initialization failed, continuing with empty state');
    console.warn('Error:', error);
  }
}

// テスト完了時のクリーンアップ用にプロセス情報をエクスポート
export { firebaseEmulatorProcess };

export default globalSetup;
