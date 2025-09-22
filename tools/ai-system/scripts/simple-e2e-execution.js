// シンプルE2Eテスト実行スクリプト
// オプションエラーを回避して確実に実行

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const frontendDir = path.resolve(__dirname, '../../frontend')

console.log('🎯 E2Eテスト実行（シンプル版）')
console.log(`実行時刻: ${new Date().toISOString()}`)

// Playwrightテスト実行（基本オプションのみ）
function executeTests() {
  return new Promise((resolve, reject) => {
    console.log('\n🎭 Playwrightテスト実行')
    
    const startTime = Date.now()
    const args = [
      'test',
      '--project=chromium',
      'tests/e2e/auth-login.e2e.test.ts',
      'tests/e2e/auth-register.e2e.test.ts'
    ]
    
    console.log(`実行: npx playwright ${args.join(' ')}`)
    
    const playwright = spawn('npx', ['playwright', ...args], {
      cwd: frontendDir,
      stdio: 'pipe'
    })
    
    let stdout = ''
    let stderr = ''
    
    playwright.stdout.on('data', (data) => {
      const output = data.toString()
      stdout += output
      console.log(output)
    })
    
    playwright.stderr.on('data', (data) => {
      const output = data.toString()
      stderr += output
      console.error(output)
    })
    
    playwright.on('close', (code) => {
      const endTime = Date.now()
      const duration = endTime - startTime
      
      console.log(`\n⏱️ 実行完了 (${duration}ms, 終了コード: ${code})`)
      
      resolve({
        exitCode: code,
        success: code === 0,
        duration,
        stdout,
        stderr,
        timestamp: new Date().toISOString()
      })
    })
    
    playwright.on('error', (error) => {
      console.error('❌ 実行エラー:', error)
      reject(error)
    })
  })
}

// 結果分析
function analyzeResults(result) {
  const analysis = {
    success: result.success,
    duration: result.duration,
    testCount: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  }
  
  const output = result.stdout
  
  // テスト結果の抽出
  const passedMatch = output.match(/(\d+) passed/)
  if (passedMatch) analysis.passed = parseInt(passedMatch[1])
  
  const failedMatch = output.match(/(\d+) failed/)
  if (failedMatch) analysis.failed = parseInt(failedMatch[1])
  
  const skippedMatch = output.match(/(\d+) skipped/)
  if (skippedMatch) analysis.skipped = parseInt(skippedMatch[1])
  
  analysis.testCount = analysis.passed + analysis.failed + analysis.skipped
  
  console.log('\n📊 結果サマリー:')
  console.log(`総テスト数: ${analysis.testCount}`)
  console.log(`成功: ${analysis.passed} ✅`)
  console.log(`失敗: ${analysis.failed} ${analysis.failed > 0 ? '❌' : ''}`)
  console.log(`スキップ: ${analysis.skipped}`)
  console.log(`実行時間: ${analysis.duration}ms`)
  console.log(`成功率: ${analysis.testCount > 0 ? Math.round((analysis.passed / analysis.testCount) * 100) : 0}%`)
  
  return analysis
}

// メイン実行
async function main() {
  try {
    const result = await executeTests()
    const analysis = analyzeResults(result)
    
    // 簡易レポート出力
    const report = {
      timestamp: new Date().toISOString(),
      success: result.success,
      testCount: analysis.testCount,
      passed: analysis.passed,
      failed: analysis.failed,
      duration: analysis.duration,
      rawOutput: {
        stdout: result.stdout,
        stderr: result.stderr
      }
    }
    
    const reportPath = path.join(__dirname, 'e2e-execution-result.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    
    console.log(`\n📄 結果レポート: ${reportPath}`)
    console.log(`\n🎉 E2Eテスト実行完了: ${result.success ? '✅ 成功' : '❌ 一部失敗'}`)
    
    return report
    
  } catch (error) {
    console.error('❌ テスト実行エラー:', error)
    throw error
  }
}

main().catch(console.error)