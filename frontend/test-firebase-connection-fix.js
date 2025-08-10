#!/usr/bin/env node

/**
 * Firebase SDK修正後の接続テスト
 * Firebase Admin SDK初期化エラー修正の検証用
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🔧 Firebase SDK修正後の接続テスト開始...\n');

// Nuxt dev serverを起動してテスト
const frontendPath = path.resolve(__dirname);
const nuxtProcess = spawn('npm', ['run', 'dev'], {
  cwd: frontendPath,
  stdio: 'pipe',
  env: {
    ...process.env,
    NODE_ENV: 'development',
    FIREBASE_PROJECT_ID: 'demo-project',
    FIRESTORE_EMULATOR_HOST: 'localhost:8080',
    FIREBASE_AUTH_EMULATOR_HOST: 'localhost:9099'
  }
});

let serverStarted = false;
let hasErrors = false;
const startTime = Date.now();

// 出力を監視
nuxtProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);
  
  // 成功指標をチェック
  if (output.includes('Local:') && output.includes('localhost:3000')) {
    serverStarted = true;
    console.log('✅ Nuxt開発サーバー起動成功！');
  }
  
  if (output.includes('Firebase Admin SDK initialized')) {
    console.log('✅ Firebase Admin SDK初期化成功！');
  }
  
  if (output.includes('Firebase Client Plugin initialized successfully')) {
    console.log('✅ Firebase Client Plugin初期化成功！');
  }
});

// エラー出力を監視
nuxtProcess.stderr.on('data', (data) => {
  const error = data.toString();
  console.error('stderr:', error);
  
  // 致命的エラーをチェック
  if (error.includes('500') || error.includes('Firebase Admin SDK initialization failed')) {
    hasErrors = true;
    console.error('❌ 致命的エラー検出');
  }
});

// プロセス終了処理
nuxtProcess.on('close', (code) => {
  const duration = (Date.now() - startTime) / 1000;
  console.log(`\n🏁 テスト完了 (${duration}秒)`);
  
  if (code === 0 && serverStarted && !hasErrors) {
    console.log('✅ Firebase SDK修正成功！');
    console.log('✅ フロントエンド500エラー解消確認');
    process.exit(0);
  } else {
    console.log('❌ まだ問題が残っています');
    console.log(`   - サーバー起動: ${serverStarted ? '成功' : '失敗'}`);
    console.log(`   - エラー: ${hasErrors ? 'あり' : 'なし'}`);
    console.log(`   - 終了コード: ${code}`);
    process.exit(1);
  }
});

// 30秒でタイムアウト
setTimeout(() => {
  console.log('\n⏰ タイムアウト - プロセスを終了します');
  nuxtProcess.kill();
}, 30000);

// Ctrl+C対応
process.on('SIGINT', () => {
  console.log('\n⏹️  テスト中断');
  nuxtProcess.kill();
  process.exit(1);
});

console.log('⏳ Nuxt開発サーバーの起動を待機中...');
console.log('   Firebase Admin SDK初期化を確認中...');
console.log('   30秒でタイムアウトします\n');