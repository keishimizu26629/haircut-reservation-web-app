// Playwright グローバルセットアップ
// 全テスト実行前の初期化処理

import { FullConfig } from '@playwright/test'
import { setupE2EEnvironment } from './setup'

async function globalSetup(config: FullConfig) {
  console.log('🚀 E2Eテストグローバルセットアップ開始')
  
  try {
    // Firebase Emulator環境の確認とテストデータ作成
    await setupE2EEnvironment()
    
    console.log('✅ E2Eテストグローバルセットアップ完了')
  } catch (error) {
    console.error('❌ E2Eテストグローバルセットアップ失敗:', error)
    throw error
  }
}

export default globalSetup