// 特定のPlaywrightテストファイルのみを実行するスクリプト
// VitestとPlaywrightが混在している環境での対策

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const frontendDir = path.resolve(__dirname, '../../frontend')
const resultsDir = path.join(frontendDir, 'test-results')

// 結果ディレクトリ作成
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true })
}

// 正しいPlaywrightテストファイルのみを対象とする
const validPlaywrightTests = [
  'tests/e2e/auth-login.e2e.test.ts',
  'tests/e2e/auth-register.e2e.test.ts'
]

// 特定のテストファイルを実行
function runSpecificTests(testFiles) {
  return new Promise((resolve, reject) => {
    console.log('🎭 指定されたPlaywrightテスト実行開始')
    console.log(`対象ファイル: ${testFiles.join(', ')}`)
    
    const args = [
      'test',
      '--project=chromium',
      '--headed=false',
      '--reporter=json',
      '--output-dir=test-results',
      ...testFiles
    ]
    
    console.log(`実行コマンド: npx playwright ${args.join(' ')}`)
    
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
      const result = {
        exitCode: code,
        stdout,
        stderr,
        success: code === 0,
        timestamp: new Date().toISOString()
      }
      
      console.log(`\n✅ テスト実行完了 (終了コード: ${code})`)
      resolve(result)
    })
    
    playwright.on('error', (error) => {
      console.error('❌ テスト実行エラー:', error)
      reject(error)
    })
  })
}

// テスト実行結果の分析
function analyzeTestResults(result) {
  const analysis = {
    timestamp: new Date().toISOString(),
    exitCode: result.exitCode,
    success: result.success,
    testCount: 0,
    passedCount: 0,
    failedCount: 0,
    skippedCount: 0,
    duration: 0,
    errors: [],
    warnings: []
  }
  
  // 標準出力からテスト結果を解析
  const output = result.stdout
  
  // テスト数の抽出
  const testCountMatch = output.match(/(\d+) passed/)
  if (testCountMatch) {
    analysis.passedCount = parseInt(testCountMatch[1])
  }
  
  const failedMatch = output.match(/(\d+) failed/)
  if (failedMatch) {
    analysis.failedCount = parseInt(failedMatch[1])
  }
  
  const skippedMatch = output.match(/(\d+) skipped/)
  if (skippedMatch) {
    analysis.skippedCount = parseInt(skippedMatch[1])
  }
  
  analysis.testCount = analysis.passedCount + analysis.failedCount + analysis.skippedCount
  
  // 実行時間の抽出
  const timeMatch = output.match(/(\d+\.?\d*)[ms]/g)
  if (timeMatch) {
    const times = timeMatch.map(t => parseFloat(t.replace(/[ms]/g, '')))
    analysis.duration = Math.max(...times)
  }
  
  // エラーメッセージの抽出
  if (result.stderr) {
    const errorLines = result.stderr.split('\n').filter(line => 
      line.includes('Error:') || line.includes('Failed:') || line.includes('✘')
    )
    analysis.errors = errorLines
  }
  
  // 警告メッセージの抽出
  const warningLines = output.split('\n').filter(line => 
    line.includes('Warning:') || line.includes('⚠')
  )
  analysis.warnings = warningLines
  
  return analysis
}

// テストリスト表示（構文確認用）
function listTests(testFiles) {
  return new Promise((resolve, reject) => {
    console.log('📋 テストリスト表示')
    
    const args = ['test', '--list', ...testFiles]
    
    const playwright = spawn('npx', ['playwright', ...args], {
      cwd: frontendDir,
      stdio: 'pipe'
    })
    
    let stdout = ''
    let stderr = ''
    
    playwright.stdout.on('data', (data) => {
      stdout += data.toString()
    })
    
    playwright.stderr.on('data', (data) => {
      stderr += data.toString()
    })
    
    playwright.on('close', (code) => {
      if (code === 0 && stdout.includes('tests in')) {
        console.log('✅ テストファイル読み込み成功')
        console.log(stdout)
        resolve({ success: true, output: stdout })
      } else {
        console.log('❌ テストファイル読み込み失敗')
        console.log('STDERR:', stderr)
        resolve({ success: false, output: stderr })
      }
    })
    
    playwright.on('error', (error) => {
      reject(error)
    })
  })
}

// メイン実行
async function main() {
  console.log('🔍 Playwright E2Eテスト実行・品質検証')
  
  try {
    // Step 1: テストリスト表示（構文確認）
    console.log('\n=== Step 1: テストファイル構文確認 ===')
    const listResult = await listTests(validPlaywrightTests)
    
    if (!listResult.success) {
      console.log('❌ テストファイルに構文エラーがあります')
      return
    }
    
    // Step 2: 実際のテスト実行（環境が整っていれば）
    console.log('\n=== Step 2: テスト実行 ===')
    
    // Firebase Emulator確認
    const http = require('http')
    const emulatorRunning = await new Promise((resolve) => {
      const req = http.get('http://localhost:4000', (res) => resolve(true))
      req.on('error', () => resolve(false))
      req.setTimeout(3000, () => resolve(false))
    })
    
    if (!emulatorRunning) {
      console.log('⚠️ Firebase Emulator未起動のため、テスト実行をスキップ')
      console.log('📋 構文確認は完了済みです')
      
      // 構文確認結果のレポート作成
      const report = {
        timestamp: new Date().toISOString(),
        status: 'syntax_check_only',
        syntaxValid: true,
        emulatorRunning: false,
        testFiles: validPlaywrightTests,
        testCount: '31+ (推定)',
        message: 'テストファイルの構文は正常。実行環境（Firebase Emulator + フロントエンド）が整えば実行可能。'
      }
      
      const reportPath = path.join(resultsDir, 'e2e-test-report.json')
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
      console.log(`📄 レポート出力: ${reportPath}`)
      return report
    }
    
    // テスト実行
    const result = await runSpecificTests(validPlaywrightTests)
    
    // Step 3: 結果分析
    console.log('\n=== Step 3: 結果分析 ===')
    const analysis = analyzeTestResults(result)
    
    console.log(`📊 テスト結果サマリー:`)
    console.log(`  成功: ${analysis.success ? '✅' : '❌'}`)
    console.log(`  総テスト数: ${analysis.testCount}`)
    console.log(`  成功: ${analysis.passedCount}`)
    console.log(`  失敗: ${analysis.failedCount}`)
    console.log(`  スキップ: ${analysis.skippedCount}`)
    console.log(`  実行時間: ${analysis.duration}ms`)
    
    if (analysis.errors.length > 0) {
      console.log('\n❌ エラー詳細:')
      analysis.errors.forEach(error => console.log(`  ${error}`))
    }
    
    if (analysis.warnings.length > 0) {
      console.log('\n⚠️ 警告:')
      analysis.warnings.forEach(warning => console.log(`  ${warning}`))
    }
    
    // レポート出力
    const finalReport = {
      ...analysis,
      testFiles: validPlaywrightTests,
      emulatorRunning: true,
      rawOutput: {
        stdout: result.stdout,
        stderr: result.stderr
      }
    }
    
    const reportPath = path.join(resultsDir, 'e2e-test-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(finalReport, null, 2))
    console.log(`\n📄 詳細レポート: ${reportPath}`)
    
    return finalReport
    
  } catch (error) {
    console.error('❌ テスト実行中にエラーが発生:', error)
    throw error
  }
}

main().catch(console.error)