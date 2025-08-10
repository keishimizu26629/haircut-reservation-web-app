// 修正後のクイックテストチェック

const { spawn } = require('child_process')
const path = require('path')

const frontendDir = path.resolve(__dirname, '../../frontend')

console.log('🔧 修正後テスト実行確認')

function runQuickTest() {
  return new Promise((resolve) => {
    const args = [
      'test',
      '--project=chromium',
      '--reporter=line',
      '--max-failures=3',
      'tests/e2e/auth-login.e2e.test.ts'
    ]
    
    console.log('実行: npx playwright', args.join(' '))
    
    const playwright = spawn('npx', ['playwright', ...args], {
      cwd: frontendDir,
      stdio: 'pipe'
    })
    
    let output = ''
    
    playwright.stdout.on('data', (data) => {
      const text = data.toString()
      output += text
      console.log(text)
    })
    
    playwright.stderr.on('data', (data) => {
      const text = data.toString()
      output += text
      console.error(text)
    })
    
    playwright.on('close', (code) => {
      console.log(`\n終了コード: ${code}`)
      
      const analysis = {
        exitCode: code,
        success: code === 0,
        output: output,
        containsError: output.includes('SecurityError') || output.includes('localStorage'),
        testCount: (output.match(/\d+ passed/) || [])[0] || '0 passed'
      }
      
      console.log('📊 結果分析:')
      console.log(`成功: ${analysis.success ? '✅' : '❌'}`)
      console.log(`localStorage問題: ${analysis.containsError ? '❌ 残存' : '✅ 解決'}`)
      console.log(`テスト結果: ${analysis.testCount}`)
      
      resolve(analysis)
    })
    
    // タイムアウト
    setTimeout(() => {
      playwright.kill()
      resolve({ timeout: true, exitCode: -1 })
    }, 60000)
  })
}

runQuickTest().then(result => {
  if (result.timeout) {
    console.log('⏰ タイムアウト')
  } else if (result.success) {
    console.log('🎉 修正成功！')
  } else {
    console.log('⚠️ まだ問題があります')
  }
})