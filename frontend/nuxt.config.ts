// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Nuxt 4互換モード有効化 - 一時的に無効化してauto-importテスト
  // future: {
  //   compatibilityVersion: 4
  // },

  devtools: { enabled: true },

  // Pages directory configuration
  pages: true,
  srcDir: '.',
  dir: {
    pages: 'app/pages',
    layouts: 'app/layouts',
    assets: 'app/assets',
    middleware: 'app/middleware',
    plugins: 'app/plugins'
  },

  // Composables auto-import configuration
  imports: {
    autoImport: true,
    dirs: ['app/composables', 'app/composables/**', 'app/stores'],
    // presets を削除して Nuxt のデフォルトインポートのみ使用
    // グローバル型生成
    global: true
  },

  // Alias configuration for path resolution
  alias: {
    '~': '.',
    '@': '.',
    '~~': '.',
    '@@': '.',
    '@stores': './app/stores',
    '~/composables': './app/composables',
    '~/components': './app/components',
    '~/pages': './app/pages',
    '~/assets': './app/assets'
  },

  // Development server configuration
  devServer: {
    host: '0.0.0.0',
    port: 3000
  },

  // TypeScript configuration
  typescript: {
    strict: false,
    typeCheck: false
  },

  // CSS Framework and Styling - Nuxt 4互換モード対応
  css: [
    '~/app/assets/css/design-system.css',
    '~/app/assets/css/responsive.css',
    '~/app/assets/css/cross-browser.css',
    '~/app/assets/css/main.css',
    '~/app/assets/css/labels.css'
  ],

  // Components auto-import configuration - Nuxt 4互換モード最適化版
  components: [
    {
      path: '~/app/components',
      pathPrefix: false,
      // パフォーマンス最適化：管理画面コンポーネントの遅延読み込み
      global: false // 全体での自動インポートを無効化
    }
  ],

  // Modules
  modules: ['@pinia/nuxt', '@vueuse/nuxt', '@nuxtjs/tailwindcss'],

  // SSR完全無効化
  ssr: false,

  // Runtime configuration - VueFire統合最適化版
  runtimeConfig: {
    // Private keys (only available on server-side)
    firebaseServiceAccount: process.env.FIREBASE_SERVICE_ACCOUNT || '',

    // Environment configuration
    nodeEnv: process.env.NODE_ENV || 'development',
    nuxtEnv: process.env.NUXT_ENV || 'local',
    firebaseEnv: process.env.FIREBASE_ENV || 'local',

    // Public keys (exposed to client-side)
    public: {
      // Environment information
      nodeEnv: process.env.NODE_ENV || 'development',
      nuxtEnv: process.env.NUXT_ENV || 'local',
      firebaseEnv: process.env.FIREBASE_ENV || 'local',

      // Firebase configuration (for client-side access)
      firebase: {
        projectId: process.env.FIREBASE_DEV_PROJECT_ID || '',
        apiKey: process.env.FIREBASE_DEV_API_KEY || '',
        authDomain: process.env.FIREBASE_DEV_AUTH_DOMAIN || '',
        storageBucket: process.env.FIREBASE_DEV_STORAGE_BUCKET || '',
        messagingSenderId: process.env.FIREBASE_DEV_MESSAGING_SENDER_ID || '',
        appId: process.env.FIREBASE_DEV_APP_ID || ''
      },

      // API configuration
      apiUrl: process.env.API_URL || 'http://localhost:3001',

      // Multi-tenant configuration
      multiTenant: {
        enabled: process.env.ENABLE_MULTI_TENANT === 'true',
        defaultTenantId: process.env.DEFAULT_TENANT_ID || 'default-salon'
      },

      // Firebase Emulators configuration (開発環境のみ)
      firebaseEmulators: {
        authHost:
          process.env.NODE_ENV === 'production'
            ? ''
            : process.env.FIREBASE_AUTH_EMULATOR_HOST || 'firebase-emulator:9099',
        firestoreHost:
          process.env.NODE_ENV === 'production'
            ? ''
            : process.env.FIREBASE_FIRESTORE_EMULATOR_HOST || 'firebase-emulator:8080',
        storageHost:
          process.env.NODE_ENV === 'production'
            ? ''
            : process.env.FIREBASE_STORAGE_EMULATOR_HOST || 'firebase-emulator:9199',
        functionsHost:
          process.env.NODE_ENV === 'production'
            ? ''
            : process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST || 'firebase-emulator:5001'
      },

      // Feature flags
      features: {
        debugMode: process.env.ENABLE_DEBUG_MODE === 'true',
        devtools: process.env.ENABLE_DEVTOOLS === 'true',
        mockData: process.env.ENABLE_MOCK_DATA === 'true',
        analytics: false, // Google Analytics無効化
        errorReporting: process.env.ENABLE_ERROR_REPORTING === 'true',
        performanceMonitoring: process.env.ENABLE_PERFORMANCE_MONITORING === 'true'
      },

      // Google Analytics設定（無効化）
      googleAnalytics: {
        id: '', // 空に設定してAnalyticsを無効化
        disabled: true
      },

      // Security settings - Firebase Auth対応でCSP無効化
      security: {
        csp: false,
        httpsRedirect: process.env.ENABLE_HTTPS_REDIRECT === 'true',
        hsts: process.env.ENABLE_HSTS === 'true'
      },

      // Logging configuration
      logging: {
        level: process.env.LOG_LEVEL || 'debug'
      }
    }
  },

  // Build optimization
  build: {
    transpile: ['vue-toastification']
  },

  // Vite configuration for performance - 超最適化版
  vite: {
    define: {
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false'
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@import "assets/scss/variables.scss";'
        }
      }
    },
    // Build optimization - 静的ホスティング対応
    build: {
      // Code splittingを最小限に抑制
      rollupOptions: {
        output: {
          manualChunks: () => 'main'
        }
      },
      // Chunk size warning threshold
      chunkSizeWarningLimit: 500, // より厳しい設定
      // Minification
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: process.env.NODE_ENV === 'production',
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug']
        },
        mangle: {
          safari10: true
        }
      },
      // 軽量化設定
      cssCodeSplit: true,
      sourcemap: false, // 本番では無効化
      reportCompressedSize: false // ビルド時間短縮
    },
    // Development optimization
    optimizeDeps: {
      include: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'vue', 'vue-router'],
      exclude: [
        // 管理画面コンポーネントは除外（遅延読み込み）
        '~/app/components/Admin'
      ]
    },
    // Server configuration for development
    server: {
      hmr: {
        overlay: false // HMRオーバーレイを無効化（パフォーマンス向上）
      }
    }
  },

  // App configuration - Lighthouse最適化版
  app: {
    head: {
      title: '美容室予約システム - オンライン予約',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        {
          name: 'description',
          content:
            '24時間オンライン美容室予約システム。簡単3ステップで予約完了。即時確認・安心予約。'
        },
        { name: 'keywords', content: '美容室,ヘアサロン,オンライン予約,24時間受付,即時確認' },
        { name: 'author', content: 'Haircut Reservation System' },
        { name: 'robots', content: 'index, follow' },
        { name: 'theme-color', content: '#3b82f6' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: '美容室予約' },
        { property: 'og:title', content: '美容室予約システム - オンライン予約' },
        {
          property: 'og:description',
          content: '24時間オンライン美容室予約システム。簡単3ステップで予約完了。'
        },
        { property: 'og:type', content: 'website' },
        { property: 'og:locale', content: 'ja_JP' },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: '美容室予約システム' },
        { name: 'twitter:description', content: '24時間オンライン予約受付中' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png', sizes: '180x180' },
        { rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: '#3b82f6' },
        { rel: 'manifest', href: '/manifest.json' },

        { rel: 'dns-prefetch', href: 'https://firebaseapp.com' },
        { rel: 'dns-prefetch', href: 'https://googleapis.com' }
      ]
    }
  },

  // Nitro configuration - VueFire + SSR最適化
  nitro: {
    preset: 'static',

    // SSR + Firebase最適化
    experimental: {
      wasm: true
    },

    // パフォーマンス最適化ルート設定
    routeRules: {
      // ルートページ（予約画面）: 超高速化設定
      '/': {
        ssr: false,
        prerender: true,
        headers: {
          'Cache-Control': 'no-cache',
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff'
        }
      },
      // 管理画面: 遅延読み込み
      '/dashboard/**': {
        ssr: false, // SPA mode for admin features
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Robots-Tag': 'noindex, nofollow'
        }
      },
      // 認証ページ: 軽量SPA
      '/login': {
        ssr: false,
        prerender: false,
        headers: {
          'Cache-Control': 'no-cache'
        }
      },
      '/register': {
        ssr: false,
        prerender: false,
        headers: {
          'Cache-Control': 'no-cache'
        }
      },
      // API routes
      '/api/**': {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'X-Robots-Tag': 'noindex, nofollow'
        }
      },
      // 静的資産の最適化
      '/_nuxt/**': {
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable' // 1年キャッシュ
        }
      }
    },

    // Performance optimization
    compressPublicAssets: true,
    minify: true,

    // Firebase Functions地域設定
    firebase: {
      region: 'asia-northeast1'
    }
  }

  // 日本語専用アプリケーション - i18n不要
})
