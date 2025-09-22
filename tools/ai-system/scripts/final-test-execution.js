// 最終テスト実行スクリプト（修正後検証）
// 31ケースの完全実行と品質検証

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

console.log('🎯 最終テスト実行開始（修正後検証）')
console.log(`実行時刻: ${new Date().toISOString()}`)
console.log(`対象: 31テストケース（ログイン13 + 登録18）`)

// 修正後環境確認
async function verifyFixedEnvironment() {
  console.log('\n🔍 修正後環境確認')
  
  const http = require('http')
  const results = {
    loginPage: false,
    registerPage: false,
    firebase: false,
    timestamp: new Date().toISOString()
  }
  
  // ログインページ確認
  results.loginPage = await new Promise((resolve) => {
    const req = http.get('http://localhost:3000/login', (res) => {
      resolve(res.statusCode === 200)
    })
    req.on('error', () => resolve(false))
    req.setTimeout(5000, () => resolve(false))
  })
  
  // 登録ページ確認
  results.registerPage = await new Promise((resolve) => {
    const req = http.get('http://localhost:3000/register', (res) => {
      resolve(res.statusCode === 200)
    })
    req.on('error', () => resolve(false))
    req.setTimeout(5000, () => resolve(false))
  })
  
  // Firebase Emulator確認
  results.firebase = await new Promise((resolve) => {
    const req = http.get('http://localhost:4000', (res) => {
      resolve(res.statusCode === 200)
    })
    req.on('error', () => resolve(false))
    req.setTimeout(5000, () => resolve(false))
  })
  
  console.log(`ログインページ: ${results.loginPage ? '✅' : '❌'}`)
  console.log(`登録ページ: ${results.registerPage ? '✅' : '❌'}`)
  console.log(`Firebase Emulator: ${results.firebase ? '✅' : '❌'}`)
  
  return results
}

// Playwrightテスト実行
function executeFinalTests() {
  return new Promise((resolve, reject) => {
    console.log('\n🎭 Playwright最終テスト実行')
    
    const startTime = Date.now()
    const args = [
      'test',
      '--project=chromium',
      '--reporter=line',
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
      
      // リアルタイム進捗表示（重要な情報のみ）
      const lines = output.split('\n')
      for (const line of lines) {
        if (line.includes('Running') || 
            line.includes('passed') || 
            line.includes('failed') ||
            line.includes('[') ||
            line.includes('✓') ||
            line.includes('✘')) {
          console.log(line)
        }
      }
    })
    
    playwright.stderr.on('data', (data) => {
      const output = data.toString()
      stderr += output
      if (output.trim() && !output.includes('Warning')) {
        console.error('⚠️', output.trim())
      }
    })
    
    playwright.on('close', (code) => {
      const endTime = Date.now()
      const duration = endTime - startTime
      
      console.log(`\n⏱️ テスト実行完了`)
      console.log(`終了コード: ${code}`)
      console.log(`実行時間: ${Math.round(duration/1000)}秒`)
      
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
    
    // タイムアウト設定（10分）
    setTimeout(() => {
      console.log('⏰ テスト実行タイムアウト（10分）')
      playwright.kill()
      resolve({
        exitCode: -1,
        success: false,
        duration: 600000,
        stdout,
        stderr: stderr + '\nテスト実行タイムアウト',
        timestamp: new Date().toISOString()
      })
    }, 600000)
  })
}

// 結果の詳細分析
function analyzeTestResults(result) {
  console.log('\n📊 テスト結果詳細分析')
  
  const analysis = {
    timestamp: result.timestamp,
    success: result.success,
    duration: result.duration,
    exitCode: result.exitCode,
    testResults: {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0
    },
    failedTests: [],
    performance: {
      totalDuration: result.duration,
      avgTestTime: 0
    },
    quality: {
      passRate: 0,
      reliability: 'Unknown'
    }
  }
  
  const output = result.stdout
  
  // テスト結果抽出
  const passedMatch = output.match(/(\d+) passed/)
  if (passedMatch) analysis.testResults.passed = parseInt(passedMatch[1])
  
  const failedMatch = output.match(/(\d+) failed/)
  if (failedMatch) analysis.testResults.failed = parseInt(failedMatch[1])
  
  const skippedMatch = output.match(/(\d+) skipped/)
  if (skippedMatch) analysis.testResults.skipped = parseInt(skippedMatch[1])
  
  analysis.testResults.total = analysis.testResults.passed + analysis.testResults.failed + analysis.testResults.skipped
  
  // 成功率計算
  if (analysis.testResults.total > 0) {
    analysis.quality.passRate = Math.round((analysis.testResults.passed / analysis.testResults.total) * 100)
  }
  
  // 信頼性評価
  if (analysis.quality.passRate >= 95) {
    analysis.quality.reliability = 'Excellent'
  } else if (analysis.quality.passRate >= 80) {
    analysis.quality.reliability = 'Good'
  } else if (analysis.quality.passRate >= 60) {
    analysis.quality.reliability = 'Fair'
  } else {
    analysis.quality.reliability = 'Poor'
  }
  
  // 失敗テスト抽出
  const failedTestRegex = /✘\s+\[chromium\]\s+›\s+(.+)/g
  let match
  while ((match = failedTestRegex.exec(output)) !== null) {
    analysis.failedTests.push(match[1])
  }
  
  // 結果表示
  console.log(`📈 テスト結果サマリー:`)
  console.log(`  総テスト数: ${analysis.testResults.total}`)
  console.log(`  成功: ${analysis.testResults.passed} ✅`)
  console.log(`  失敗: ${analysis.testResults.failed} ${analysis.testResults.failed > 0 ? '❌' : ''}`)
  console.log(`  スキップ: ${analysis.testResults.skipped}`)
  console.log(`  成功率: ${analysis.quality.passRate}%`)
  console.log(`  品質評価: ${analysis.quality.reliability}`)
  console.log(`  実行時間: ${Math.round(analysis.duration/1000)}秒`)
  
  if (analysis.failedTests.length > 0) {
    console.log('\n❌ 失敗したテスト:')
    analysis.failedTests.forEach((test, index) => {
      console.log(`  ${index + 1}. ${test}`)
    })
  }
  
  return analysis
}

// 最終品質評価
function generateFinalQualityAssessment(envCheck, testResult, analysis) {
  const assessment = {
    executionSummary: {
      timestamp: new Date().toISOString(),
      environmentStatus: envCheck,
      testExecution: {
        success: testResult.success,
        duration: testResult.duration,
        exitCode: testResult.exitCode
      },
      results: analysis
    },
    qualityGrade: 'F',
    overallStatus: 'Failed',
    recommendations: []
  }
  
  // 品質グレード決定
  if (analysis.quality.passRate >= 95 && testResult.success) {
    assessment.qualityGrade = 'A+'
    assessment.overallStatus = 'Excellent'
  } else if (analysis.quality.passRate >= 90) {
    assessment.qualityGrade = 'A'
    assessment.overallStatus = 'Very Good'
  } else if (analysis.quality.passRate >= 80) {
    assessment.qualityGrade = 'B'
    assessment.overallStatus = 'Good'
  } else if (analysis.quality.passRate >= 70) {
    assessment.qualityGrade = 'C'
    assessment.overallStatus = 'Fair'
  } else {
    assessment.qualityGrade = 'D'
    assessment.overallStatus = 'Needs Improvement'
  }
  
  // 推奨事項生成
  if (analysis.testResults.failed === 0) {
    assessment.recommendations.push('全テストが正常に実行されました。優秀な品質です。')
  } else {
    assessment.recommendations.push(`${analysis.testResults.failed}件の失敗テストの修正が必要です。`)
  }
  
  if (analysis.duration > 300000) {
    assessment.recommendations.push('テスト実行時間の最適化を検討してください。')
  }
  
  // レポート出力
  const reportPath = path.join(__dirname, `final-test-execution-report-${timestamp}.json`)
  fs.writeFileSync(reportPath, JSON.stringify(assessment, null, 2))
  
  console.log(`\n📄 最終テストレポート: ${reportPath}`)
  
  return assessment
}

// メイン実行
async function main() {
  try {
    console.log('🚀 修正後最終テスト検証開始')
    
    // Step 1: 修正後環境確認
    const envCheck = await verifyFixedEnvironment()
    
    if (!envCheck.loginPage || !envCheck.registerPage || !envCheck.firebase) {
      console.log('❌ 修正後環境に問題があります')
      process.exit(1)
    }
    
    console.log('✅ 修正後環境確認完了')
    
    // Step 2: テスト実行
    const testResult = await executeFinalTests()
    
    // Step 3: 結果分析
    const analysis = analyzeTestResults(testResult)
    
    // Step 4: 最終品質評価
    const finalAssessment = generateFinalQualityAssessment(envCheck, testResult, analysis)
    
    // Step 5: 最終結果発表
    console.log('\n🎉 最終テスト実行完了')
    console.log(`📊 総合評価: ${finalAssessment.qualityGrade} (${finalAssessment.overallStatus})`)
    console.log(`🎯 実行結果: ${finalAssessment.executionSummary.testExecution.success ? '✅ 成功' : '❌ 一部課題'}`)
    
    if (finalAssessment.recommendations.length > 0) {
      console.log('\n📋 推奨事項:')
      finalAssessment.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`)
      })
    }
    
    return finalAssessment
    
  } catch (error) {
    console.error('❌ 最終テスト実行中にエラーが発生:', error)
    process.exit(1)
  }
}

main().catch(console.error)