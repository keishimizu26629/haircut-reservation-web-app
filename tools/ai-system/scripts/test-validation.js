// E2Eテストファイル検証スクリプト
// テストファイルの構文チェックと基本的な検証

const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const frontendDir = path.resolve(__dirname, '../../frontend')
const testsDir = path.join(frontendDir, 'tests', 'e2e')

// テストファイル情報を収集
function analyzeTestFiles() {
  console.log('📋 E2Eテストファイル分析開始')
  
  const testFiles = fs.readdirSync(testsDir).filter(f => f.endsWith('.e2e.test.ts'))
  const analysis = []
  
  for (const file of testFiles) {
    const filePath = path.join(testsDir, file)
    const content = fs.readFileSync(filePath, 'utf8')
    
    // テストケース数をカウント
    const testMatches = content.match(/test\(/g) || []
    const describeMatches = content.match(/test\.describe\(/g) || []
    
    // 主要なテスト種別を判定
    let testTypes = []
    if (content.includes('ログイン')) testTypes.push('認証ログイン')
    if (content.includes('登録') || content.includes('register')) testTypes.push('ユーザー登録')
    if (content.includes('管理') || content.includes('admin')) testTypes.push('管理者機能')
    if (content.includes('予約') || content.includes('booking')) testTypes.push('予約機能')
    if (content.includes('システム') || content.includes('system')) testTypes.push('システム')
    
    analysis.push({
      file,
      testCases: testMatches.length,
      testSuites: describeMatches.length,
      types: testTypes,
      size: Math.round(fs.statSync(filePath).size / 1024) + 'KB',
      hasSetup: content.includes('beforeEach'),
      hasCleanup: content.includes('afterEach'),
      usesFirebase: content.includes('Firebase') || content.includes('firebase')
    })
  }
  
  return analysis
}

// Playwright設定ファイル検証
function validatePlaywrightConfig() {
  console.log('⚙️ Playwright設定検証')
  
  const configPath = path.join(frontendDir, 'playwright.config.ts')
  if (!fs.existsSync(configPath)) {
    return { valid: false, error: 'playwright.config.ts が見つかりません' }
  }
  
  const config = fs.readFileSync(configPath, 'utf8')
  
  const checks = {
    hasTestDir: config.includes('testDir'),
    hasTestMatch: config.includes('testMatch'),
    hasBaseURL: config.includes('baseURL'),
    hasGlobalSetup: config.includes('globalSetup'),
    hasReporter: config.includes('reporter'),
    targetsE2E: config.includes('.e2e.test.ts')
  }
  
  return {
    valid: Object.values(checks).every(Boolean),
    checks,
    path: configPath
  }
}

// package.json のスクリプト確認
function checkPackageScripts() {
  console.log('📦 package.json スクリプト確認')
  
  const packagePath = path.join(frontendDir, 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
  
  const relevantScripts = {}
  const scriptKeys = ['test:e2e', 'test:e2e:ui', 'dev', 'build']
  
  for (const key of scriptKeys) {
    if (packageJson.scripts && packageJson.scripts[key]) {
      relevantScripts[key] = packageJson.scripts[key]
    }
  }
  
  return {
    scripts: relevantScripts,
    hasPlaywright: packageJson.devDependencies && packageJson.devDependencies['@playwright/test']
  }
}

// テストの依存関係確認
function checkTestDependencies() {
  console.log('🔗 テスト依存関係確認')
  
  const setupPath = path.join(testsDir, 'setup.ts')
  const globalSetupPath = path.join(testsDir, 'global-setup.ts')
  
  return {
    setupExists: fs.existsSync(setupPath),
    globalSetupExists: fs.existsSync(globalSetupPath),
    setupSize: fs.existsSync(setupPath) ? fs.statSync(setupPath).size : 0,
    globalSetupSize: fs.existsSync(globalSetupPath) ? fs.statSync(globalSetupPath).size : 0
  }
}

// Playwrightテストのドライラン実行
function runPlaywrightDryRun() {
  return new Promise((resolve) => {
    console.log('🧪 Playwrightドライラン実行')
    
    const playwright = spawn('npx', ['playwright', 'test', '--list'], {
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
      resolve({
        exitCode: code,
        stdout,
        stderr,
        success: code === 0 && stdout.includes('tests in')
      })
    })
    
    // タイムアウト設定
    setTimeout(() => {
      playwright.kill()
      resolve({
        exitCode: -1,
        stdout,
        stderr: stderr + '\nタイムアウト',
        success: false
      })
    }, 30000)
  })
}

// メイン検証実行
async function main() {
  console.log('🔍 E2Eテスト品質検証開始\n')
  
  const results = {
    timestamp: new Date().toISOString(),
    testFiles: analyzeTestFiles(),
    playwrightConfig: validatePlaywrightConfig(),
    packageScripts: checkPackageScripts(),
    dependencies: checkTestDependencies(),
    dryRun: await runPlaywrightDryRun()
  }
  
  // 結果出力
  console.log('\n📊 検証結果サマリー:')
  console.log(`テストファイル数: ${results.testFiles.length}個`)
  console.log(`総テストケース数: ${results.testFiles.reduce((sum, f) => sum + f.testCases, 0)}個`)
  console.log(`Playwright設定: ${results.playwrightConfig.valid ? '✅ 正常' : '❌ 問題あり'}`)
  console.log(`依存関係: ${results.dependencies.setupExists && results.dependencies.globalSetupExists ? '✅ 完備' : '⚠️ 不足'}`)
  console.log(`ドライラン: ${results.dryRun.success ? '✅ 成功' : '❌ 失敗'}`)
  
  console.log('\n📝 詳細テストファイル情報:')
  for (const file of results.testFiles) {
    console.log(`  ${file.file}:`)
    console.log(`    - テストケース: ${file.testCases}個`)
    console.log(`    - テストスイート: ${file.testSuites}個`)
    console.log(`    - カテゴリ: ${file.types.join(', ')}`)
    console.log(`    - サイズ: ${file.size}`)
    console.log(`    - Firebase使用: ${file.usesFirebase ? 'Yes' : 'No'}`)
  }
  
  if (!results.dryRun.success) {
    console.log('\n❌ ドライラン失敗詳細:')
    console.log('STDOUT:', results.dryRun.stdout)
    console.log('STDERR:', results.dryRun.stderr)
  }
  
  // レポートファイル出力
  const reportPath = path.join(__dirname, 'test-validation-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2))
  console.log(`\n📄 詳細レポート: ${reportPath}`)
  
  return results
}

main().catch(console.error)