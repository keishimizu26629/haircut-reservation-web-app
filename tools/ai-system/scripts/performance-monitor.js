#!/usr/bin/env node

/**
 * Performance Monitoring Script
 * Measures baseline performance and Core Web Vitals
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Performance measurement configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  pages: [
    { path: '/', name: 'home' },
    { path: '/booking', name: 'booking' },
    { path: '/login', name: 'login' },
    { path: '/dashboard', name: 'dashboard' }
  ],
  runs: 3,
  timeout: 30000,
  reportDir: '../reports/performance'
};

// Core Web Vitals measurement script
const WEB_VITALS_SCRIPT = `
  // Web Vitals measurement
  window.webVitalsData = {};
  
  // CLS measurement
  let clsValue = 0;
  let clsEntries = [];
  const observer = new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
        clsEntries.push(entry);
      }
    }
    window.webVitalsData.cls = clsValue;
  });
  observer.observe({entryTypes: ['layout-shift']});
  
  // FCP, LCP measurement
  const perfObserver = new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      if (entry.entryType === 'paint') {
        if (entry.name === 'first-contentful-paint') {
          window.webVitalsData.fcp = entry.startTime;
        }
      }
      if (entry.entryType === 'largest-contentful-paint') {
        window.webVitalsData.lcp = entry.startTime;
      }
    }
  });
  perfObserver.observe({entryTypes: ['paint', 'largest-contentful-paint']});
  
  // FID measurement
  const fidObserver = new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      window.webVitalsData.fid = entry.processingStart - entry.startTime;
    }
  });
  fidObserver.observe({entryTypes: ['first-input']});
  
  // TTFB measurement
  window.addEventListener('load', () => {
    const navEntry = performance.getEntriesByType('navigation')[0];
    window.webVitalsData.ttfb = navEntry.responseStart - navEntry.requestStart;
  });
`;

async function measurePagePerformance(page, url, pageName) {
  const measurements = [];
  
  for (let run = 1; run <= CONFIG.runs; run++) {
    console.log(`📊 Measuring ${pageName} - Run ${run}/${CONFIG.runs}`);
    
    // Start performance measurement
    const navigationPromise = page.waitForLoadState('networkidle');
    
    // Navigate to page
    const startTime = Date.now();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await navigationPromise;
    
    // Inject Web Vitals measurement script
    await page.addScriptTag({ content: WEB_VITALS_SCRIPT });
    
    // Wait for measurements to complete
    await page.waitForTimeout(2000);
    
    // Collect metrics
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    // Get Web Vitals data
    const webVitals = await page.evaluate(() => window.webVitalsData || {});
    
    // Get additional performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        domSize: document.querySelectorAll('*').length,
        resourceCount: performance.getEntriesByType('resource').length
      };
    });
    
    measurements.push({
      run,
      loadTime,
      timestamp: new Date().toISOString(),
      webVitals,
      performanceMetrics,
      page: pageName,
      url
    });
  }
  
  return measurements;
}

function calculateAverages(measurements) {
  const totals = measurements.reduce((acc, m) => ({
    loadTime: acc.loadTime + m.loadTime,
    fcp: acc.fcp + (m.webVitals.fcp || 0),
    lcp: acc.lcp + (m.webVitals.lcp || 0),
    cls: acc.cls + (m.webVitals.cls || 0),
    ttfb: acc.ttfb + (m.webVitals.ttfb || 0),
    domSize: acc.domSize + (m.performanceMetrics.domSize || 0),
    resourceCount: acc.resourceCount + (m.performanceMetrics.resourceCount || 0)
  }), { loadTime: 0, fcp: 0, lcp: 0, cls: 0, ttfb: 0, domSize: 0, resourceCount: 0 });
  
  const count = measurements.length;
  return {
    loadTime: Math.round(totals.loadTime / count),
    fcp: Math.round(totals.fcp / count),
    lcp: Math.round(totals.lcp / count),
    cls: Math.round((totals.cls / count) * 1000) / 1000,
    ttfb: Math.round(totals.ttfb / count),
    domSize: Math.round(totals.domSize / count),
    resourceCount: Math.round(totals.resourceCount / count)
  };
}

async function main() {
  console.log('🚀 Starting Performance Baseline Measurement');
  
  // Ensure report directory exists
  const reportDir = path.resolve(__dirname, CONFIG.reportDir);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 }
  });
  const page = await context.newPage();
  
  const allMeasurements = [];
  
  try {
    for (const pageConfig of CONFIG.pages) {
      const url = CONFIG.baseUrl + pageConfig.path;
      const measurements = await measurePagePerformance(page, url, pageConfig.name);
      allMeasurements.push(...measurements);
    }
    
    // Calculate summary statistics
    const summary = {};
    for (const pageConfig of CONFIG.pages) {
      const pageMeasurements = allMeasurements.filter(m => m.page === pageConfig.name);
      summary[pageConfig.name] = {
        averages: calculateAverages(pageMeasurements),
        measurements: pageMeasurements
      };
    }
    
    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      config: CONFIG,
      summary,
      allMeasurements,
      recommendations: generateRecommendations(summary)
    };
    
    // Save report
    const reportFile = path.join(reportDir, `baseline-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    // Print summary
    console.log('\\n📊 Performance Baseline Results:');
    console.log('==========================================');
    for (const [pageName, data] of Object.entries(summary)) {
      console.log(`\\n${pageName.toUpperCase()}:`);
      console.log(`  Load Time: ${data.averages.loadTime}ms`);
      console.log(`  FCP: ${data.averages.fcp}ms`);
      console.log(`  LCP: ${data.averages.lcp}ms`);
      console.log(`  CLS: ${data.averages.cls}`);
      console.log(`  TTFB: ${data.averages.ttfb}ms`);
      console.log(`  DOM Size: ${data.averages.domSize} elements`);
      console.log(`  Resources: ${data.averages.resourceCount}`);
    }
    
    console.log(`\\n📄 Detailed report saved: ${reportFile}`);
    
  } catch (error) {
    console.error('❌ Performance measurement failed:', error);
  } finally {
    await browser.close();
  }
}

function generateRecommendations(summary) {
  const recommendations = [];
  
  for (const [pageName, data] of Object.entries(summary)) {
    const avg = data.averages;
    
    if (avg.loadTime > 3000) {
      recommendations.push(`${pageName}: Load time (${avg.loadTime}ms) exceeds 3s target`);
    }
    if (avg.fcp > 1800) {
      recommendations.push(`${pageName}: FCP (${avg.fcp}ms) needs optimization`);
    }
    if (avg.lcp > 2500) {
      recommendations.push(`${pageName}: LCP (${avg.lcp}ms) exceeds recommended 2.5s`);
    }
    if (avg.cls > 0.1) {
      recommendations.push(`${pageName}: CLS (${avg.cls}) exceeds recommended 0.1`);
    }
    if (avg.ttfb > 600) {
      recommendations.push(`${pageName}: TTFB (${avg.ttfb}ms) needs optimization`);
    }
    if (avg.domSize > 1500) {
      recommendations.push(`${pageName}: DOM size (${avg.domSize}) is large`);
    }
    if (avg.resourceCount > 100) {
      recommendations.push(`${pageName}: Resource count (${avg.resourceCount}) is high`);
    }
  }
  
  return recommendations;
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { measurePagePerformance, calculateAverages };