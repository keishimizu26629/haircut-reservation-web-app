import { FullConfig } from '@playwright/test';
import { execSync } from 'child_process';
import { firebaseEmulatorProcess } from './global-setup';

// Firebase Emulator設定
const FIRESTORE_PORT = 8080;
const AUTH_PORT = 9099;
const FIREBASE_UI_PORT = 4000;

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Firebase Emulator + E2E Test Global Teardown starting...');
  
  try {
    // 管理されたFirebase Emulatorプロセスを停止
    if (firebaseEmulatorProcess && !firebaseEmulatorProcess.killed) {
      console.log('🔥 Stopping managed Firebase Emulator process...');
      
      firebaseEmulatorProcess.kill('SIGTERM');
      
      // プロセスが終了するまで少し待機
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 強制終了が必要な場合
      if (!firebaseEmulatorProcess.killed) {
        firebaseEmulatorProcess.kill('SIGKILL');
      }
    }
    
    // Firebase CLI経由での停止
    await stopFirebaseEmulator();
    
    // ポートベースでの強制クリーンアップ
    await forceCleanupPorts();
    
    // テストデータクリーンアップ
    await cleanupTestData();
    
    console.log('✅ Global teardown completed successfully');
    
  } catch (error) {
    console.warn('⚠️ Error during teardown:', error);
    
    // エラーが発生しても強制クリーンアップを実行
    await forceCleanupPorts();
  }
}

async function stopFirebaseEmulator(): Promise<void> {
  try {
    console.log('🛑 Stopping Firebase Emulator via CLI...');
    
    execSync('cd ../simple-reservation && npx firebase emulators:kill', { 
      stdio: 'pipe',
      timeout: 15000 
    });
    
    // 停止後の待機時間
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ Firebase Emulator stopped via CLI');
  } catch (error) {
    console.warn('⚠️ Firebase CLI stop failed, proceeding with port cleanup');
  }
}

async function forceCleanupPorts(): Promise<void> {
  const ports = [FIRESTORE_PORT, AUTH_PORT, FIREBASE_UI_PORT];
  
  console.log('🧽 Force cleaning up Firebase Emulator ports...');
  
  for (const port of ports) {
    try {
      // macOS/Linux: lsof + kill
      execSync(`lsof -ti:${port} | xargs kill -9`, { 
        stdio: 'pipe',
        timeout: 5000 
      });
      
      console.log(`✅ Cleaned up port ${port}`);
    } catch (error) {
      // ポートが使用されていない場合は正常
      console.log(`ℹ️ Port ${port} was not in use`);
    }
  }
  
  // 最終クリーンアップ待機
  await new Promise(resolve => setTimeout(resolve, 1000));
}

async function cleanupTestData(): Promise<void> {
  try {
    console.log('🗑️ Cleaning up test data...');
    
    // Firebase Emulatorが完全に停止していることを確認してからクリーンアップ
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Emulatorデータディレクトリのクリーンアップ（もしあれば）
    try {
      execSync('cd ../simple-reservation && rm -rf .firebase/emulators', { 
        stdio: 'pipe',
        timeout: 10000 
      });
    } catch (error) {
      // ディレクトリが存在しない場合は無視
    }
    
    console.log('✅ Test data cleanup completed');
  } catch (error) {
    console.warn('⚠️ Test data cleanup failed:', error);
  }
}

// プロセス異常終了時のクリーンアップ
process.on('SIGINT', async () => {
  console.log('🚨 Received SIGINT, performing emergency cleanup...');
  await forceCleanupPorts();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🚨 Received SIGTERM, performing emergency cleanup...');
  await forceCleanupPorts();
  process.exit(0);
});

// 未処理の例外によるクリーンアップ
process.on('uncaughtException', async (error) => {
  console.error('🚨 Uncaught exception during teardown:', error);
  await forceCleanupPorts();
  process.exit(1);
});

export default globalTeardown;