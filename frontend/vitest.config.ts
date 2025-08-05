import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        '.nuxt/',
        'dist/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.*',
        'tests/',
        'playwright.config.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    include: [
      'tests/unit/**/*.{test,spec}.{js,ts,vue}',
      'components/**/*.{test,spec}.{js,ts,vue}',
      'composables/**/*.{test,spec}.{js,ts,vue}',
      'utils/**/*.{test,spec}.{js,ts,vue}'
    ],
    exclude: [
      'node_modules/',
      '.nuxt/',
      'dist/',
      'tests/e2e/'
    ]
  },
  resolve: {
    alias: {
      '~': resolve(__dirname),
      '@': resolve(__dirname),
      '#app': resolve(__dirname, '.nuxt/app'),
      '#components': resolve(__dirname, '.nuxt/components')
    }
  }
})