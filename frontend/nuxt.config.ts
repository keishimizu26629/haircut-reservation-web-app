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
    components: 'app/components',
    assets: 'app/assets',
    middleware: 'app/middleware',
    plugins: 'app/plugins'
  },

    // Composables auto-import configuration
  imports: {
    autoImport: true,
    dirs: [
      'app/composables',
      'app/composables/**',
      'app/stores'
    ],
    presets: [
      'vue',
      'vue-router',
      'pinia'
    ]
  },



  // Nitro configuration for composables
  nitro: {
    experimental: {
      wasm: true
    }
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
    'bootstrap/dist/css/bootstrap.min.css',
    'bootstrap-icons/font/bootstrap-icons.css',
    '~/app/assets/css/design-system.css',
    '~/app/assets/css/responsive.css',
    '~/app/assets/css/cross-browser.css',
    '~/app/assets/css/main.css'
  ],

  // Components auto-import configuration - Nuxt 4互換モード最適化版
  components: [
    {
      path: '~/app/components',
      pathPrefix: false,
      // パフォーマンス最適化：管理画面コンポーネントの遅延読み込み
      global: false, // 全体での自動インポートを無効化
    }
  ],

  // Modules
  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/google-fonts',
    '@nuxtjs/tailwindcss',
    'nuxt-vuefire'
  ],

  // Google Fonts configuration - パフォーマンス最適化版
  googleFonts: {
    families: {
      Inter: [400, 600], // 必要最小限のフォントウェイト
      'Noto Sans JP': [400, 500] // 日本語フォントも最小限
    },
    display: 'swap', // フォント読み込み中のテキスト表示
    prefetch: true, // プリフェッチ有効化
    preconnect: true, // プリコネクト有効化
    preload: true, // プリロード有効化
    download: false, // ローカルダウンロード無効（CDN使用）
    base64: false, // Base64無効（パフォーマンス重視）
    subsets: 'latin', // 必要なサブセットのみ
    text: '' // 特定文字セットの指定なし
  },

  // VueFire configuration - Emulator専用設定
  vuefire: {
    // Firebase設定（Emulator専用）
    config: {
      apiKey: 'demo-api-key',
      authDomain: 'demo-project.firebaseapp.com',
      projectId: 'demo-project',
      storageBucket: 'demo-project.appspot.com',
      messagingSenderId: '123456789',
      appId: '1:123456789:web:demo123'
    },

    // SSR無効化
    ssr: false,

    // Firebase Auth設定（Emulator使用）
    auth: {
      enabled: true,
      sessionCookie: false,
      emulatorHost: 'localhost:9099',
      emulatorOptions: {
        disableWarnings: true
      }
    },

    // Firestore設定（Emulator使用）
    firestore: {
      emulatorHost: 'localhost:8080',
      emulatorOptions: {
        experimentalForceLongPolling: true
      }
    },

    // AppCheck完全無効化
    appCheck: false
  },

  // Runtime configuration - VueFire統合最適化版
  runtimeConfig: {
    // Private keys (only available on server-side)
    firebaseServiceAccount: process.env.FIREBASE_SERVICE_ACCOUNT,

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

      // ❌ Firebase config removed - VueFire handles this automatically
      // VueFire モジュールが設定を管理するため、重複を避けるため削除

      // API configuration
      apiUrl: process.env.API_URL || 'http://localhost:3001',

      // Multi-tenant configuration
      multiTenant: {
        enabled: process.env.ENABLE_MULTI_TENANT === 'true',
        defaultTenantId: process.env.DEFAULT_TENANT_ID || 'default-salon'
      },

      // Firebase Emulators configuration
      firebaseEmulators: {
        authHost: process.env.FIREBASE_AUTH_EMULATOR_HOST || 'firebase-emulator:9099',
        firestoreHost: process.env.FIREBASE_FIRESTORE_EMULATOR_HOST || 'firebase-emulator:8080',
        storageHost: process.env.FIREBASE_STORAGE_EMULATOR_HOST || 'firebase-emulator:9199',
        functionsHost: process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST || 'firebase-emulator:5001'
      },

      // Feature flags
      features: {
        debugMode: process.env.ENABLE_DEBUG_MODE === 'true',
        devtools: process.env.ENABLE_DEVTOOLS === 'true',
        mockData: process.env.ENABLE_MOCK_DATA === 'true',
        analytics: process.env.ENABLE_ANALYTICS === 'true',
        errorReporting: process.env.ENABLE_ERROR_REPORTING === 'true',
        performanceMonitoring: process.env.ENABLE_PERFORMANCE_MONITORING === 'true'
      },

      // Security settings
      security: {
        csp: process.env.ENABLE_CSP === 'true',
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
    // Build optimization - パフォーマンス重視設定
    build: {
      // Code splitting for better performance
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Firebase関連は別チャンク
            if (id.includes('firebase')) return 'firebase'
            // Vue core関連
            if (id.includes('vue') || id.includes('@vue')) return 'vue-vendor'
            // Bootstrap等のUI
            if (id.includes('bootstrap')) return 'ui-vendor'
            // 管理画面関連は遅延読み込み
            if (id.includes('components/Admin') || id.includes('dashboard')) return 'admin'
            // その他のライブラリ
            if (id.includes('node_modules')) return 'vendor'
          }
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
      reportCompressedSize: false, // ビルド時間短縮
    },
    // Development optimization
    optimizeDeps: {
      include: [
        'firebase/app',
        'firebase/auth',
        'firebase/firestore',
        'vue',
        'vue-router'
      ],
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
        { name: 'description', content: '24時間オンライン美容室予約システム。簡単3ステップで予約完了。即時確認・安心予約。' },
        { name: 'keywords', content: '美容室,ヘアサロン,オンライン予約,24時間受付,即時確認' },
        { name: 'author', content: 'Haircut Reservation System' },
        { name: 'robots', content: 'index, follow' },
        { name: 'theme-color', content: '#3b82f6' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: '美容室予約' },
        { property: 'og:title', content: '美容室予約システム - オンライン予約' },
        { property: 'og:description', content: '24時間オンライン美容室予約システム。簡単3ステップで予約完了。' },
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
        // プリロード設定 - 重要なリソースを先読み
        { rel: 'preload', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+JP:wght@300;400;500;700&display=swap', as: 'style' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
        { rel: 'dns-prefetch', href: 'https://firebaseapp.com' },
        { rel: 'dns-prefetch', href: 'https://googleapis.com' }
      ]
    }
  },

  // Nitro configuration - VueFire + SSR最適化
  nitro: {
    preset: 'node-server',

    // SSR + Firebase最適化
    experimental: {
      wasm: true
    },

    // パフォーマンス最適化ルート設定
    routeRules: {
      // ルートページ（予約画面）: 超高速化設定
      '/': {
        ssr: true, // SSRで初期表示を高速化
        prerender: false, // 動的コンテンツのためプリレンダー無効
        headers: {
          'Cache-Control': 'public, max-age=300', // 5分キャッシュ
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff',
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
  },

  // PWA configuration
  pwa: {
    registerType: 'autoUpdate',
    workbox: {
      navigateFallback: '/'
    },
    client: {
      installPrompt: true
    },
    devOptions: {
      enabled: true,
      suppressWarnings: true,
      navigateFallbackAllowlist: [/^\/$/],
      type: 'module'
    }
  },

  // 日本語専用アプリケーション - i18n不要
})
