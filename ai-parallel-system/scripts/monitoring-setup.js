#!/usr/bin/env node

/**
 * Monitoring Setup Script
 * Prepares monitoring infrastructure for page migration comparison
 */

const fs = require('fs');
const path = require('path');

class MonitoringSetup {
  constructor() {
    this.config = {
      reportDir: '../reports/monitoring',
      baselineDir: '../reports/performance',
      analyticsConfig: {
        firebaseAnalytics: true,
        customEvents: true,
        userJourney: true,
        performanceTracking: true
      }
    };
  }

  async setupMonitoring() {
    console.log('📊 Setting up Monitoring Infrastructure');
    
    await this.createDirectoryStructure();
    await this.generateAnalyticsConfig();
    await this.createComparisonTools();
    await this.setupUserBehaviorAnalytics();
    await this.createMonitoringDashboard();
    
    return this.generateSetupReport();
  }

  async createDirectoryStructure() {
    console.log('📁 Creating monitoring directory structure...');
    
    const dirs = [
      '../reports/monitoring',
      '../reports/monitoring/before',
      '../reports/monitoring/after',
      '../reports/monitoring/comparison',
      '../reports/monitoring/user-behavior',
      '../reports/monitoring/dashboards'
    ];
    
    dirs.forEach(dir => {
      const fullPath = path.resolve(__dirname, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
    
    console.log('✅ Directory structure created');
  }

  async generateAnalyticsConfig() {
    console.log('⚙️ Generating analytics configuration...');
    
    const analyticsConfig = {
      // Firebase Analytics Configuration
      firebase: {
        measurementId: 'G-XXXXXXXXXX', // To be configured
        customEvents: [
          {
            name: 'page_view_performance',
            parameters: {
              page_title: 'string',
              page_location: 'string',
              load_time: 'number',
              fcp: 'number',
              lcp: 'number',
              cls: 'number',
              ttfb: 'number'
            }
          },
          {
            name: 'booking_flow_start',
            parameters: {
              source_page: 'string',
              user_type: 'string',
              timestamp: 'number'
            }
          },
          {
            name: 'booking_flow_completion',
            parameters: {
              completion_time: 'number',
              steps_completed: 'number',
              abandonment_point: 'string'
            }
          },
          {
            name: 'user_interaction',
            parameters: {
              element_type: 'string',
              element_id: 'string',
              page_location: 'string',
              interaction_time: 'number'
            }
          }
        ],
        userProperties: [
          'user_type',
          'preferred_language',
          'device_type',
          'session_count'
        ]
      },
      
      // Custom Performance Tracking
      performance: {
        realUserMonitoring: {
          enabled: true,
          sampleRate: 0.1, // 10% of users
          metrics: [
            'navigation_timing',
            'resource_timing',
            'paint_timing',
            'layout_shifts',
            'user_interactions'
          ]
        },
        vitalsTracking: {
          fcp: { target: 1800, warning: 3000 },
          lcp: { target: 2500, warning: 4000 },
          fid: { target: 100, warning: 300 },
          cls: { target: 0.1, warning: 0.25 },
          ttfb: { target: 600, warning: 1200 }
        }
      },
      
      // User Behavior Analytics
      userBehavior: {
        heatmaps: {
          enabled: true,
          pages: ['/', '/booking', '/login', '/dashboard'],
          sampleRate: 0.05 // 5% of users
        },
        sessionRecording: {
          enabled: false, // Privacy consideration
          errorRecording: true,
          sampleRate: 0.01 // 1% of error sessions
        },
        scrollTracking: {
          enabled: true,
          milestones: [25, 50, 75, 100] // Percentage milestones
        },
        clickTracking: {
          enabled: true,
          trackClasses: ['.btn', '.nav-link', '.booking-button'],
          trackIds: ['#booking-cta', '#login-btn', '#register-btn']
        }
      }
    };
    
    const configPath = path.resolve(__dirname, '../reports/monitoring/analytics-config.json');
    fs.writeFileSync(configPath, JSON.stringify(analyticsConfig, null, 2));
    
    console.log('✅ Analytics configuration generated');
    return analyticsConfig;
  }

  async createComparisonTools() {
    console.log('🔄 Creating comparison tools...');
    
    const comparisonScript = `
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
        recommendations.push(\`\${metric} degraded by \${Math.abs(data.improvement)}% - needs attention\`);
      } else if (data.improvement > 20) {
        recommendations.push(\`\${metric} improved significantly by \${data.improvement}% - great progress\`);
      }
    });
    
    return recommendations;
  }
}

module.exports = PerformanceComparator;
`;
    
    const scriptPath = path.resolve(__dirname, '../reports/monitoring/comparison-tool.js');
    fs.writeFileSync(scriptPath, comparisonScript);
    
    console.log('✅ Comparison tools created');
  }

  async setupUserBehaviorAnalytics() {
    console.log('👤 Setting up user behavior analytics...');
    
    const userBehaviorConfig = {
      // Page-specific tracking configurations
      pages: {
        home: {
          key_interactions: [
            'hero_cta_click',
            'booking_button_click',
            'service_selection',
            'scroll_to_features'
          ],
          conversion_goals: [
            'booking_initiation',
            'login_completion',
            'service_inquiry'
          ]
        },
        booking: {
          key_interactions: [
            'date_selection',
            'time_selection',
            'service_selection',
            'stylist_selection',
            'form_submission'
          ],
          conversion_goals: [
            'booking_completion',
            'payment_initiation'
          ],
          funnel_steps: [
            'page_load',
            'service_selected',
            'date_selected',
            'time_selected',
            'details_entered',
            'booking_confirmed'
          ]
        },
        login: {
          key_interactions: [
            'email_field_focus',
            'password_field_focus',
            'login_button_click',
            'forgot_password_click',
            'register_link_click'
          ],
          conversion_goals: [
            'successful_login',
            'account_creation'
          ]
        }
      },
      
      // A/B Testing Framework
      experiments: [
        {
          id: 'landing_page_redesign',
          name: 'Landing Page Redesign Impact',
          description: 'Measure impact of new landing page structure on conversion',
          variants: ['control', 'new_design'],
          metrics: [
            'booking_conversion_rate',
            'time_to_booking',
            'bounce_rate',
            'page_load_time'
          ],
          duration_days: 14,
          traffic_split: 0.5
        }
      ],
      
      // Cohort Analysis
      cohorts: {
        new_users: {
          definition: 'first_visit_date',
          metrics: ['retention_day_1', 'retention_day_7', 'first_booking_rate']
        },
        returning_users: {
          definition: 'visit_count > 1',
          metrics: ['booking_frequency', 'session_duration', 'feature_usage']
        }
      }
    };
    
    const configPath = path.resolve(__dirname, '../reports/monitoring/user-behavior-config.json');
    fs.writeFileSync(configPath, JSON.stringify(userBehaviorConfig, null, 2));
    
    console.log('✅ User behavior analytics configured');
    return userBehaviorConfig;
  }

  async createMonitoringDashboard() {
    console.log('📈 Creating monitoring dashboard config...');
    
    const dashboardConfig = {
      dashboards: [
        {
          id: 'performance_overview',
          name: 'Performance Overview',
          description: 'Real-time performance metrics and trends',
          widgets: [
            {
              type: 'metric_card',
              title: 'Average Page Load Time',
              metric: 'avg_load_time',
              target: 500,
              format: 'milliseconds'
            },
            {
              type: 'line_chart',
              title: 'Core Web Vitals Trend',
              metrics: ['fcp', 'lcp', 'cls', 'fid'],
              timeRange: '7d'
            },
            {
              type: 'funnel_chart',
              title: 'Booking Conversion Funnel',
              steps: [
                'page_visit',
                'booking_page_view',
                'service_selection',
                'date_selection',
                'booking_submission',
                'booking_confirmed'
              ]
            }
          ]
        },
        {
          id: 'before_after_comparison',
          name: 'Before/After Migration',
          description: 'Comparison of metrics before and after page structure changes',
          widgets: [
            {
              type: 'comparison_table',
              title: 'Performance Metrics Comparison',
              metrics: ['loadTime', 'fcp', 'lcp', 'cls', 'ttfb'],
              showImprovement: true
            },
            {
              type: 'bar_chart',
              title: 'User Engagement Comparison',
              metrics: ['bounce_rate', 'session_duration', 'pages_per_session'],
              comparison: 'before_vs_after'
            }
          ]
        },
        {
          id: 'user_behavior',
          name: 'User Behavior Analytics',
          description: 'User interaction patterns and behavior insights',
          widgets: [
            {
              type: 'heatmap',
              title: 'Click Heatmap',
              pages: ['/', '/booking'],
              timeRange: '24h'
            },
            {
              type: 'scroll_map',
              title: 'Scroll Behavior',
              pages: ['/', '/booking'],
              milestones: [25, 50, 75, 100]
            }
          ]
        }
      ],
      
      alerts: [
        {
          name: 'Performance Degradation',
          condition: 'avg_load_time > 3000',
          severity: 'high',
          notification: ['email', 'slack']
        },
        {
          name: 'High Bounce Rate',
          condition: 'bounce_rate > 0.7',
          severity: 'medium',
          notification: ['email']
        },
        {
          name: 'Low Conversion Rate',
          condition: 'booking_conversion_rate < 0.1',
          severity: 'high',
          notification: ['email', 'slack']
        }
      ]
    };
    
    const configPath = path.resolve(__dirname, '../reports/monitoring/dashboard-config.json');
    fs.writeFileSync(configPath, JSON.stringify(dashboardConfig, null, 2));
    
    console.log('✅ Monitoring dashboard configured');
    return dashboardConfig;
  }

  generateSetupReport() {
    const report = {
      timestamp: new Date().toISOString(),
      setup: {
        directories: 'created',
        analytics: 'configured',
        comparison_tools: 'ready',
        user_behavior: 'configured',
        dashboards: 'configured'
      },
      
      implementation_plan: {
        phase1: {
          name: 'Pre-migration Baseline',
          duration: '1-2 days',
          tasks: [
            'Run performance baseline measurement',
            'Configure Firebase Analytics',
            'Set up user behavior tracking',
            'Create initial monitoring dashboards'
          ]
        },
        phase2: {
          name: 'Migration Implementation',
          duration: '3-5 days',
          tasks: [
            'Implement page structure changes',
            'Update tracking configurations',
            'Deploy monitoring code',
            'Verify tracking functionality'
          ]
        },
        phase3: {
          name: 'Post-migration Analysis',
          duration: '1-2 weeks',
          tasks: [
            'Collect post-migration metrics',
            'Run comparison analysis',
            'Generate improvement reports',
            'Optimize based on findings'
          ]
        }
      },
      
      tools_ready: [
        'Performance measurement scripts',
        'Security analysis tools',
        'Lighthouse CI configuration',
        'User behavior tracking setup',
        'Comparison and reporting tools'
      ],
      
      next_steps: [
        'Configure Firebase Analytics with provided measurement ID',
        'Deploy performance tracking scripts to production',
        'Set up monitoring dashboards',
        'Run baseline measurements',
        'Begin page structure migration'
      ]
    };
    
    const reportPath = path.resolve(__dirname, '../reports/monitoring/setup-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    return report;
  }
}

async function main() {
  const setup = new MonitoringSetup();
  const report = await setup.setupMonitoring();
  
  console.log('\\n📊 Monitoring Setup Complete!');
  console.log('==================================');
  console.log('✅ Analytics configuration ready');
  console.log('✅ Comparison tools created');
  console.log('✅ User behavior tracking configured');
  console.log('✅ Monitoring dashboards prepared');
  console.log('✅ Implementation plan generated');
  
  console.log('\\n📋 Next Steps:');
  report.next_steps.forEach((step, index) => {
    console.log(`${index + 1}. ${step}`);
  });
  
  console.log(`\\n📄 Setup report saved: ${path.resolve(__dirname, '../reports/monitoring/setup-report.json')}`);
  
  return report;
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = MonitoringSetup;