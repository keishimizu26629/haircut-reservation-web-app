<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Hero Section -->
    <section class="bg-primary-600 text-white py-20">
      <div class="container mx-auto px-4 text-center">
        <h1 class="text-4xl md:text-6xl font-bold mb-4">
          美容室の予約がもっと簡単に
        </h1>
        <p class="text-xl md:text-2xl mb-8">
          オンラインで24時間いつでも予約可能。あなたの美しさのための時間を予約しましょう。
        </p>
        <div class="d-flex flex-column flex-md-row justify-content-center gap-3 align-items-center">
          <NuxtLink
            to="/booking"
            class="btn btn-light btn-lg px-4 py-3 fw-bold w-100 w-md-auto"
            style="font-size: 1.1rem; max-width: 200px;"
            role="button"
            aria-label="オンライン予約ページに移動"
          >
            <i class="bi bi-calendar-plus me-2" aria-hidden="true"></i>
            今すぐ予約
          </NuxtLink>
          <NuxtLink
            to="/login"
            class="btn btn-outline-light btn-lg px-4 py-3 fw-bold w-100 w-md-auto"
            style="font-size: 1.1rem; max-width: 200px;"
            role="button"
            aria-label="ログインページに移動"
          >
            <i class="bi bi-person-circle me-2" aria-hidden="true"></i>
            ログイン
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-16">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12">なぜ選ばれるのか</h2>
        <div class="grid md:grid-cols-3 gap-8">
          <div class="text-center p-6">
            <div class="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <i class="bi bi-calendar-check text-primary-600 text-2xl"></i>
            </div>
            <h3 class="text-xl font-semibold mb-2">簡単予約</h3>
            <p class="text-gray-600">直感的なカレンダーで簡単に予約できます。空き時間が一目でわかります。</p>
          </div>
          <div class="text-center p-6">
            <div class="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <i class="bi bi-person-check text-primary-600 text-2xl"></i>
            </div>
            <h3 class="text-xl font-semibold mb-2">スタイリスト選択</h3>
            <p class="text-gray-600">お気に入りのスタイリストを指名できます</p>
          </div>
          <div class="text-center p-6">
            <div class="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <i class="bi bi-bell text-primary-600 text-2xl"></i>
            </div>
            <h3 class="text-xl font-semibold mb-2">リマインダー</h3>
            <p class="text-gray-600">予約日時をメールでお知らせします</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Status Section -->
    <section class="bg-gray-100 py-12">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-2xl font-bold mb-8">システム状況</h2>
        <div class="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div class="bg-white p-6 rounded-lg shadow">
            <h3 class="font-semibold mb-2">Firebase接続</h3>
            <div class="flex items-center justify-center">
              <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                <i class="bi bi-check-circle mr-1"></i>
                接続中
              </span>
            </div>
          </div>
          <div class="bg-white p-6 rounded-lg shadow">
            <h3 class="font-semibold mb-2">システム状態</h3>
            <div class="flex items-center justify-center">
              <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                <i class="bi bi-gear mr-1"></i>
                運用中
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// SEO設定 - ランディングページ最適化
useHead({
  title: 'Haircut Reservation System - 美容室予約システム | ランディングページ',
  meta: [
    { name: 'description', content: 'Professional haircut reservation and management system - プロフェッショナルな美容室予約・管理システムへようこそ' },
    { name: 'keywords', content: '美容室, 予約システム, オンライン予約, ヘアカット, スタイリスト' },
    { property: 'og:title', content: '美容室予約システム - ランディングページ' },
    { property: 'og:description', content: '簡単・便利なオンライン予約で、あなたの理想のスタイルを実現' },
    { property: 'og:type', content: 'website' }
  ]
})

// Firebase接続状態の確認 - VueFire統合対応
const firebaseStatus = ref('checking')

onMounted(async () => {
  try {
    // VueFire統合環境でのFirebase接続テスト
    const { $firebaseApp } = useNuxtApp()

    if ($firebaseApp) {
      firebaseStatus.value = 'connected'
      console.log('🔥 Landing Page: Firebase connected via VueFire')
    } else {
      firebaseStatus.value = 'disconnected'
      console.warn('⚠️ Landing Page: Firebase not available')
    }
  } catch (error) {
    console.error('Landing Page Firebase connection test failed:', error)
    firebaseStatus.value = 'disconnected'
  }
})
</script>

<style scoped>
/* ランディングページ専用スタイル */
.bg-primary-600 {
  background-color: #2563eb;
}
.text-primary-600 {
  color: #2563eb;
}
.bg-primary-100 {
  background-color: #dbeafe;
}

/* ランディングページ強化アニメーション */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.container {
  animation: fadeInUp 0.8s ease-out;
}

/* ボタンホバー効果強化 */
.btn:hover {
  transform: translateY(-2px);
  transition: all 0.3s ease;
}

/* レスポンシブ対応強化 */
@media (max-width: 768px) {
  .text-4xl.md\\:text-6xl {
    font-size: 2.5rem;
  }

  .text-xl.md\\:text-2xl {
    font-size: 1.25rem;
  }
}
</style>
