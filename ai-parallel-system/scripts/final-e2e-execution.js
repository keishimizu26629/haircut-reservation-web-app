// 最終E2Eテスト実行スクリプト
// 31ケースの完全実行とレポート生成

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const frontendDir = path.resolve(__dirname, '../../frontend')
const resultsDir = path.join(frontendDir, 'test-results')
const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

// 結果ディレクトリ確保
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true })
}

console.log('🎯 最終E2Eテスト実行開始')
console.log(`実行時刻: ${new Date().toISOString()}`)
console.log(`対象: 31テストケース（ログイン13 + 登録18）`)

// テスト実行前の環境確認
async function verifyEnvironment() {
  console.log('\n🔍 実行前環境確認')
  
  const checks = {
    frontend: false,
    firebase: false,
    testFiles: false
  }
  
  // フロントエンド確認
  try {
    const http = require('http')
    checks.frontend = await new Promise((resolve) => {
      const req = http.get('http://localhost:3000', (res) => {
        resolve(res.statusCode === 200)
      })
      req.on('error', () => resolve(false))
      req.setTimeout(5000, () => resolve(false))
    })
  } catch (error) {
    checks.frontend = false
  }
  
  // Firebase Emulator確認
  try {
    const http = require('http')
    checks.firebase = await new Promise((resolve) => {
      const req = http.get('http://localhost:4000', (res) => {
        resolve(res.statusCode === 200)
      })
      req.on('error', () => resolve(false))
      req.setTimeout(5000, () => resolve(false))
    })
  } catch (error) {
    checks.firebase = false
  }
  
  // テストファイル確認
  const authLoginExists = fs.existsSync(path.join(frontendDir, 'tests/e2e/auth-login.e2e.test.ts'))
  const authRegisterExists = fs.existsSync(path.join(frontendDir, 'tests/e2e/auth-register.e2e.test.ts'))
  checks.testFiles = authLoginExists && authRegisterExists
  
  console.log(`フロントエンド: ${checks.frontend ? '✅' : '❌'}`)
  console.log(`Firebase Emulator: ${checks.firebase ? '✅' : '❌'}`)
  console.log(`テストファイル: ${checks.testFiles ? '✅' : '❌'}`)
  
  return checks
}

// Playwrightテスト実行
function executePlaywrightTests() {
  return new Promise((resolve, reject) => {
    console.log('\n🎭 Playwrightテスト実行開始')
    
    const startTime = Date.now()
    const args = [
      'test',
      '--project=chromium',
      '--reporter=json',
      `--output-dir=test-results/run-${timestamp}`,
      'tests/e2e/auth-login.e2e.test.ts',
      'tests/e2e/auth-register.e2e.test.ts'
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
      // リアルタイム進捗表示
      if (output.includes('Running') || output.includes('passed') || output.includes('failed')) {
        process.stdout.write(output)
      }
    })
    
    playwright.stderr.on('data', (data) => {
      const output = data.toString()
      stderr += output
      if (output.trim()) {
        console.error('⚠️', output.trim())
      }
    })
    
    playwright.on('close', (code) => {
      const endTime = Date.now()
      const duration = endTime - startTime
      
      console.log(`\n⏱️ テスト実行完了 (${duration}ms)`)
      console.log(`終了コード: ${code}`)
      
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
      console.error('❌ テスト実行エラー:', error)
      reject(error)
    })
    
    // タイムアウト設定（5分）
    setTimeout(() => {
      console.log('⏰ テスト実行タイムアウト')
      playwright.kill()
      resolve({
        exitCode: -1,
        success: false,
        duration: 300000,
        stdout,
        stderr: stderr + '\nテスト実行タイムアウト',
        timestamp: new Date().toISOString()
      })
    }, 300000)
  })
}

// テスト結果の詳細分析
function analyzeResults(result) {
  console.log('\n📊 テスト結果分析')
  
  const analysis = {
    timestamp: result.timestamp,
    success: result.success,
    exitCode: result.exitCode,
    duration: result.duration,
    testResults: {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      flaky: 0
    },
    failedTests: [],
    performance: {
      averageTestTime: 0,
      slowestTest: null,
      fastestTest: null
    },
    errors: [],
    warnings: []
  }
  
  // JSON結果ファイルの解析を試行
  const jsonResultPath = path.join(resultsDir, `run-${timestamp}`, 'results.json')
  if (fs.existsSync(jsonResultPath)) {
    try {
      const jsonResult = JSON.parse(fs.readFileSync(jsonResultPath, 'utf8'))
      
      if (jsonResult.suites) {
        // Playwrightの結果構造から情報抽出
        jsonResult.suites.forEach(suite => {
          if (suite.specs) {
            suite.specs.forEach(spec => {
              analysis.testResults.total++
              
              if (spec.tests) {
                spec.tests.forEach(test => {
                  if (test.results) {
                    test.results.forEach(testResult => {
                      switch (testResult.status) {
                        case 'passed':
                          analysis.testResults.passed++
                          break
                        case 'failed':
                          analysis.testResults.failed++
                          analysis.failedTests.push({
                            title: test.title,
                            file: spec.title,
                            error: testResult.error?.message || 'Unknown error'
                          })
                          break
                        case 'skipped':
                          analysis.testResults.skipped++
                          break
                        case 'flaky':
                          analysis.testResults.flaky++
                          break
                      }
                    })
                  }
                })
              }
            })
          }
        })
      }
    } catch (error) {
      console.log('⚠️ JSON結果ファイル解析失敗:', error.message)
    }
  }
  
  // 標準出力からの情報抽出
  const output = result.stdout
  
  // テスト数の抽出
  const passedMatch = output.match(/(\d+) passed/)
  if (passedMatch) analysis.testResults.passed = parseInt(passedMatch[1])
  
  const failedMatch = output.match(/(\d+) failed/)
  if (failedMatch) analysis.testResults.failed = parseInt(failedMatch[1])
  
  const skippedMatch = output.match(/(\d+) skipped/)
  if (skippedMatch) analysis.testResults.skipped = parseInt(skippedMatch[1])
  
  analysis.testResults.total = analysis.testResults.passed + analysis.testResults.failed + analysis.testResults.skipped
  
  // エラー抽出
  if (result.stderr) {
    analysis.errors = result.stderr.split('\n').filter(line => 
      line.includes('Error:') || line.includes('Failed:')
    )
  }
  
  // 結果表示
  console.log(`総テスト数: ${analysis.testResults.total}`)
  console.log(`成功: ${analysis.testResults.passed} ✅`)
  console.log(`失敗: ${analysis.testResults.failed} ${analysis.testResults.failed > 0 ? '❌' : ''}`)
  console.log(`スキップ: ${analysis.testResults.skipped}`)
  console.log(`実行時間: ${analysis.duration}ms`)
  console.log(`成功率: ${analysis.testResults.total > 0 ? Math.round((analysis.testResults.passed / analysis.testResults.total) * 100) : 0}%`)
  
  if (analysis.failedTests.length > 0) {
    console.log('\n❌ 失敗したテスト:')
    analysis.failedTests.forEach(test => {
      console.log(`  - ${test.title} (${test.file})`)
      console.log(`    エラー: ${test.error}`)
    })
  }
  
  return analysis
}

// レポート生成
function generateFinalReport(envCheck, testResult, analysis) {
  const report = {
    executionSummary: {
      timestamp: new Date().toISOString(),
      environment: envCheck,
      testExecution: testResult,
      analysis: analysis
    },
    qualityAssessment: {
      overallSuccess: analysis.success,
      testCoverage: analysis.testResults.total >= 31 ? 'Complete' : 'Incomplete',
      reliability: analysis.testResults.failed === 0 ? 'High' : 'Medium',
      performance: analysis.duration < 180000 ? 'Good' : 'Needs Improvement'
    },
    recommendations: []
  }
  
  // 推奨事項の生成
  if (analysis.testResults.failed > 0) {
    report.recommendations.push('失敗したテストケースの修正が必要です')
  }
  
  if (analysis.duration > 180000) {
    report.recommendations.push('テスト実行時間の最適化を検討してください')
  }
  
  if (analysis.testResults.total < 31) {
    report.recommendations.push('全テストケースの実行確認が必要です')
  }
  
  if (report.recommendations.length === 0) {
    report.recommendations.push('すべて正常に実行されました。高品質な実装です。')
  }
  
  // レポートファイル出力
  const reportPath = path.join(__dirname, `final-e2e-execution-report-${timestamp}.json`)
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  
  console.log(`\n📄 最終実行レポート: ${reportPath}`)
  
  return report
}

// メイン実行
async function main() {
  try {
    // Step 1: 環境確認
    const envCheck = await verifyEnvironment()
    
    if (!envCheck.frontend || !envCheck.firebase || !envCheck.testFiles) {
      console.log('❌ 実行前環境チェック失敗')
      process.exit(1)
    }
    
    console.log('✅ 実行前環境チェック完了')
    
    // Step 2: テスト実行
    const testResult = await executePlaywrightTests()
    
    // Step 3: 結果分析
    const analysis = analyzeResults(testResult)
    
    // Step 4: 最終レポート生成
    const finalReport = generateFinalReport(envCheck, testResult, analysis)
    
    // Step 5: 結果サマリー
    console.log('\n🎉 最終E2Eテスト実行完了')
    console.log(`実行結果: ${finalReport.qualityAssessment.overallSuccess ? '✅ 成功' : '❌ 一部失敗'}`)
    console.log(`品質評価: ${finalReport.qualityAssessment.reliability}`)
    
    process.exit(finalReport.qualityAssessment.overallSuccess ? 0 : 1)
    
  } catch (error) {
    console.error('❌ 最終テスト実行中にエラーが発生:', error)
    process.exit(1)
  }
}

main()