
// Performance Comparison Tool
class PerformanceComparator {
  constructor(beforeData, afterData) {
    this.before = beforeData;
    this.after = afterData;
  }
  
  compareMetrics() {
    const comparison = {};
    const metrics = ['loadTime', 'fcp', 'lcp', 'cls', 'ttfb'];
    
    metrics.forEach(metric => {
      const beforeValue = this.before.averages[metric] || 0;
      const afterValue = this.after.averages[metric] || 0;
      const improvement = ((beforeValue - afterValue) / beforeValue) * 100;
      
      comparison[metric] = {
        before: beforeValue,
        after: afterValue,
        improvement: Math.round(improvement * 100) / 100,
        status: improvement > 0 ? 'improved' : improvement < 0 ? 'degraded' : 'unchanged'
      };
    });
    
    return comparison;
  }
  
  generateReport() {
    const comparison = this.compareMetrics();
    const overallImprovement = Object.values(comparison)
      .reduce((acc, metric) => acc + metric.improvement, 0) / Object.keys(comparison).length;
    
    return {
      timestamp: new Date().toISOString(),
      overallImprovement: Math.round(overallImprovement * 100) / 100,
      metrics: comparison,
      recommendations: this.generateRecommendations(comparison)
    };
  }
  
  generateRecommendations(comparison) {
    const recommendations = [];
    
    Object.entries(comparison).forEach(([metric, data]) => {
      if (data.status === 'degraded') {
        recommendations.push(`${metric} degraded by ${Math.abs(data.improvement)}% - needs attention`);
      } else if (data.improvement > 20) {
        recommendations.push(`${metric} improved significantly by ${data.improvement}% - great progress`);
      }
    });
    
    return recommendations;
  }
}

module.exports = PerformanceComparator;
