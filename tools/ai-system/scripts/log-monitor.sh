#!/bin/bash

# ログ監視スクリプト
LOG_DIR="../../logs"
mkdir -p "$LOG_DIR"

TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
INTEGRATION_LOG="$LOG_DIR/integration_test_${TIMESTAMP}.log"

echo "🔧 統合テストログ監視開始 - $(date)" | tee "$INTEGRATION_LOG"
echo "=================================" | tee -a "$INTEGRATION_LOG"

# 1. Docker Compose全体ログの取得
echo "📊 Docker Compose サービス状況:" | tee -a "$INTEGRATION_LOG"
docker-compose -f ../../environments/base.yml -f ../../environments/local.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" | tee -a "$INTEGRATION_LOG"
echo "" | tee -a "$INTEGRATION_LOG"

# 2. Firebase Emulatorログの監視
echo "🔥 Firebase Emulator 最新ログ (直近30行):" | tee -a "$INTEGRATION_LOG"
docker-compose -f ../../environments/base.yml -f ../../environments/local.yml logs firebase-emulator --tail=30 | tee -a "$INTEGRATION_LOG"
echo "" | tee -a "$INTEGRATION_LOG"

# 3. フロントエンドログの監視
echo "🖥️  Frontend 最新ログ (直近30行):" | tee -a "$INTEGRATION_LOG"
docker-compose -f ../../environments/base.yml -f ../../environments/local.yml logs frontend --tail=30 | tee -a "$INTEGRATION_LOG"
echo "" | tee -a "$INTEGRATION_LOG"

# 4. エラーパターンの検出
echo "🚨 エラーパターン検出:" | tee -a "$INTEGRATION_LOG"
ERROR_COUNT=0

# Firebaseエラー検出
FIREBASE_ERRORS=$(docker-compose -f ../../environments/base.yml -f ../../environments/local.yml logs firebase-emulator --tail=100 | grep -i "error\|failed\|exception" | wc -l)
if [ "$FIREBASE_ERRORS" -gt 0 ]; then
    echo "  ❌ Firebase Emulator: ${FIREBASE_ERRORS}個のエラー/警告" | tee -a "$INTEGRATION_LOG"
    ERROR_COUNT=$((ERROR_COUNT + FIREBASE_ERRORS))
else
    echo "  ✅ Firebase Emulator: エラーなし" | tee -a "$INTEGRATION_LOG"
fi

# フロントエンドエラー検出
FRONTEND_ERRORS=$(docker-compose -f ../../environments/base.yml -f ../../environments/local.yml logs frontend --tail=100 | grep -i "error\|failed\|exception" | wc -l)
if [ "$FRONTEND_ERRORS" -gt 0 ]; then
    echo "  ❌ Frontend: ${FRONTEND_ERRORS}個のエラー/警告" | tee -a "$INTEGRATION_LOG"
    ERROR_COUNT=$((ERROR_COUNT + FRONTEND_ERRORS))
else
    echo "  ✅ Frontend: エラーなし" | tee -a "$INTEGRATION_LOG"
fi

echo "" | tee -a "$INTEGRATION_LOG"

# 5. システムリソース状況
echo "💻 システムリソース状況:" | tee -a "$INTEGRATION_LOG"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | tee -a "$INTEGRATION_LOG"
echo "" | tee -a "$INTEGRATION_LOG"

# 6. E2Eテスト環境準備状況
echo "🧪 E2Eテスト環境準備状況:" | tee -a "$INTEGRATION_LOG"

# 各サービスのポート確認
SERVICES=("3000:Frontend" "4000:Firebase-UI" "8080:Firestore" "9099:Auth" "9199:Storage")
READY_COUNT=0

for service in "${SERVICES[@]}"; do
    PORT=$(echo "$service" | cut -d':' -f1)
    NAME=$(echo "$service" | cut -d':' -f2)
    
    if nc -z localhost "$PORT" 2>/dev/null; then
        echo "  ✅ ${NAME} (port ${PORT}): 準備完了" | tee -a "$INTEGRATION_LOG"
        READY_COUNT=$((READY_COUNT + 1))
    else
        echo "  ❌ ${NAME} (port ${PORT}): 準備未完了" | tee -a "$INTEGRATION_LOG"
    fi
done

echo "" | tee -a "$INTEGRATION_LOG"
echo "=================================" | tee -a "$INTEGRATION_LOG"

# 7. 最終判定
if [ "$READY_COUNT" -eq 5 ] && [ "$ERROR_COUNT" -lt 3 ]; then
    echo "🎉 統合テスト結果: E2Eテスト実行準備完了" | tee -a "$INTEGRATION_LOG"
    echo "  - 準備完了サービス: ${READY_COUNT}/5" | tee -a "$INTEGRATION_LOG"
    echo "  - エラー件数: ${ERROR_COUNT}" | tee -a "$INTEGRATION_LOG"
    exit 0
elif [ "$READY_COUNT" -ge 4 ] && [ "$ERROR_COUNT" -lt 5 ]; then
    echo "⚠️  統合テスト結果: 軽微な問題あり、E2Eテスト実行可能" | tee -a "$INTEGRATION_LOG"
    echo "  - 準備完了サービス: ${READY_COUNT}/5" | tee -a "$INTEGRATION_LOG"
    echo "  - エラー件数: ${ERROR_COUNT}" | tee -a "$INTEGRATION_LOG"
    exit 0
else
    echo "❌ 統合テスト結果: 重要な問題あり、要対応" | tee -a "$INTEGRATION_LOG"
    echo "  - 準備完了サービス: ${READY_COUNT}/5" | tee -a "$INTEGRATION_LOG"
    echo "  - エラー件数: ${ERROR_COUNT}" | tee -a "$INTEGRATION_LOG"
    exit 1
fi