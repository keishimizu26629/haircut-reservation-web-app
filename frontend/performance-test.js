#!/usr/bin/env node

/**
 * パフォーマンス測定スクリプト
 * 目標: 初期表示時間 0.5秒達成確認
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

const TEST_URL = 'http://localhost:3000';
const PERFORMANCE_TARGET = 500; // 0.5秒（ミリ秒）

async function runLighthouseTest() {
  console.log('🚀 パフォーマンステスト開始...');
  console.log(`📊 テストURL: ${TEST_URL}`);
  console.log(`🎯 目標: 初期表示時間 ${PERFORMANCE_TARGET}ms以下`);
  
  let chrome;
  try {
    // Chrome起動
    chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage']
    });
    
    // Lighthouse実行設定
    const options = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance'],
      port: chrome.port,
      settings: {
        // パフォーマンス重視の設定
        throttlingMethod: 'simulate',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0
        },
        emulatedFormFactor: 'mobile',
        audits: [
          'first-contentful-paint',
          'largest-contentful-paint', 
          'first-meaningful-paint',
          'speed-index',
          'interactive',
          'cumulative-layout-shift',
          'total-blocking-time'
        ]
      }
    };
    
    // Lighthouse実行
    console.log('⚡ Lighthouse分析実行中...');
    const runnerResult = await lighthouse(TEST_URL, options);
    
    if (!runnerResult) {
      throw new Error('Lighthouse分析に失敗しました');
    }
    
    // 結果解析
    const { lhr } = runnerResult;
    const audits = lhr.audits;
    
    // パフォーマンス指標
    const metrics = {
      'FCP (First Contentful Paint)': Math.round(audits['first-contentful-paint'].numericValue),
      'LCP (Largest Contentful Paint)': Math.round(audits['largest-contentful-paint'].numericValue), 
      'FMP (First Meaningful Paint)': Math.round(audits['first-meaningful-paint']?.numericValue || 0),
      'Speed Index': Math.round(audits['speed-index'].numericValue),
      'Time to Interactive': Math.round(audits['interactive'].numericValue),
      'CLS (Cumulative Layout Shift)': audits['cumulative-layout-shift'].numericValue,
      'TBT (Total Blocking Time)': Math.round(audits['total-blocking-time'].numericValue),
      'Performance Score': Math.round(lhr.categories.performance.score * 100)
    };
    
    // 結果表示
    console.log('\n📊 パフォーマンス測定結果:');
    console.log('=====================================');
    
    Object.entries(metrics).forEach(([key, value]) => {
      const unit = key.includes('Score') ? '%' : 
                  key.includes('CLS') ? '' : 'ms';
      console.log(`${key}: ${value}${unit}`);
    });
    
    // 目標達成確認
    const fcp = metrics['FCP (First Contentful Paint)'];
    const lcp = metrics['LCP (Largest Contentful Paint)'];
    const performanceScore = metrics['Performance Score'];
    
    console.log('\n🎯 目標達成確認:');
    console.log('=====================================');
    
    // 0.5秒目標チェック
    const fcpSuccess = fcp <= PERFORMANCE_TARGET;
    const lcpSuccess = lcp <= 1500; // LCPは1.5秒が良好
    const scoreSuccess = performanceScore >= 90;
    
    console.log(`FCP 0.5秒以下: ${fcpSuccess ? '✅ 達成' : '❌ 未達成'} (${fcp}ms)`);
    console.log(`LCP 1.5秒以下: ${lcpSuccess ? '✅ 達成' : '❌ 未達成'} (${lcp}ms)`);
    console.log(`スコア 90以上: ${scoreSuccess ? '✅ 達成' : '❌ 未達成'} (${performanceScore}%)`);
    
    const allSuccess = fcpSuccess && lcpSuccess && scoreSuccess;
    
    console.log(`\n🎉 総合評価: ${allSuccess ? '✅ 全目標達成！' : '⚠️  改善が必要'}`);
    
    // 結果をファイルに保存
    const reportPath = path.join(__dirname, 'performance-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      url: TEST_URL,
      metrics,
      targetAchieved: allSuccess,
      targets: {
        fcp: PERFORMANCE_TARGET,
        lcp: 1500,
        score: 90
      }
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 詳細レポート: ${reportPath}`);
    
    return allSuccess;
    
  } catch (error) {
    console.error('❌ テスト実行エラー:', error.message);
    return false;
  } finally {
    if (chrome) {
      await chrome.kill();
    }
  }
}

// メイン実行
if (require.main === module) {
  runLighthouseTest()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { runLighthouseTest };