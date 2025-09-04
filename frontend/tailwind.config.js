/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,vue,ts}',
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue'
  ],
  theme: {
    extend: {
      colors: {
        // パステルカラーパレット
        pastel: {
          pink: '#FFE4E1',
          blue: '#E0E4FF',
          green: '#E1F5E4',
          yellow: '#FFF7E0',
          purple: '#F0E4FF',
          mint: '#E0F7FA',
          peach: '#FFE8E0',
          lavender: '#F0E6FF'
        },
        // 予約システム専用カラー
        reservation: {
          available: '#E1F5E4', // 予約可能（薄緑）
          booked: '#FFE4E1', // 予約済み（薄ピンク）
          closed: '#F5F5F5', // 休業日（グレー）
          selected: '#E0E4FF', // 選択中（薄青）
          pending: '#FFF7E0', // 保留中（薄黄）
          confirmed: '#E0F7FA' // 確定（薄ミント）
        }
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans JP', 'sans-serif']
      },
      fontSize: {
        // CSS変数を参照するカスタムフォントサイズ
        'calendar-time-sm': 'var(--calendar-time-text-sm)',
        'calendar-time-lg': 'var(--calendar-time-text-lg)',
        'calendar-month': 'var(--calendar-month-text)',
        'calendar-reservation': 'var(--calendar-reservation-text)',
        'calendar-date': 'var(--calendar-date-text)'
      },
      spacing: {
        18: '4.5rem',
        88: '22rem'
      },
      maxWidth: {
        '8xl': '88rem'
      }
    }
  },
  plugins: []
}
