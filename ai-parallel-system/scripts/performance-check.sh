#!/bin/bash

# パフォーマンス確認スクリプト
LOG_DIR="../../logs"
mkdir -p "$LOG_DIR"

TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
PERF_LOG="$LOG_DIR/performance_${TIMESTAMP}.log"

echo "⚡ パフォーマンス確認開始 - $(date)" | tee "$PERF_LOG"
echo "=================================" | tee -a "$PERF_LOG"

# 1. システムリソース監視（30秒間）
echo "💻 システムリソース監視 (30秒間):" | tee -a "$PERF_LOG"
for i in {1..6}; do
    echo "  📊 測定${i}/6:" | tee -a "$PERF_LOG"
    docker stats --no-stream --format "    {{.Container}} - CPU: {{.CPUPerc}}, Memory: {{.MemUsage}}, Net I/O: {{.NetIO}}" | tee -a "$PERF_LOG"
    sleep 5
done
echo "" | tee -a "$PERF_LOG"

# 2. レスポンス時間測定
echo "⏱️  レスポンス時間測定:" | tee -a "$PERF_LOG"

# Firebase Emulator UI
UI_TIME=$(curl -w "%{time_total}" -o /dev/null -s http://localhost:4000)
echo "  🔥 Firebase UI: ${UI_TIME}秒" | tee -a "$PERF_LOG"

# Auth Emulator
AUTH_TIME=$(curl -w "%{time_total}" -o /dev/null -s http://localhost:9099/)
echo "  🔐 Auth Emulator: ${AUTH_TIME}秒" | tee -a "$PERF_LOG"

# Frontend (ヘルスチェック)
FRONTEND_TIME=$(curl -w "%{time_total}" -o /dev/null -s -m 10 http://localhost:3000/_nuxt/builds/meta.json 2>/dev/null || echo "timeout")
if [[ "$FRONTEND_TIME" == "timeout" ]]; then
    echo "  🖥️  Frontend: タイムアウト (10秒)" | tee -a "$PERF_LOG"
else
    echo "  🖥️  Frontend: ${FRONTEND_TIME}秒" | tee -a "$PERF_LOG"
fi

echo "" | tee -a "$PERF_LOG"

# 3. コンテナヘルスチェック
echo "🏥 コンテナヘルスチェック:" | tee -a "$PERF_LOG"
CONTAINERS=$(docker-compose -f ../../environments/base.yml -f ../../environments/local.yml ps --format "table {{.Name}}\t{{.Status}}")
echo "$CONTAINERS" | tee -a "$PERF_LOG"
echo "" | tee -a "$PERF_LOG"

# 4. ディスク使用量確認
echo "💾 ディスク使用量:" | tee -a "$PERF_LOG"
docker system df | tee -a "$PERF_LOG"
echo "" | tee -a "$PERF_LOG"

# 5. ネットワーク確認
echo "🌐 ネットワーク接続確認:" | tee -a "$PERF_LOG"
NETWORK_TESTS=("3000:Frontend" "4000:Firebase-UI" "8080:Firestore" "9099:Auth" "5001:Functions")
NETWORK_OK=0

for test in "${NETWORK_TESTS[@]}"; do
    PORT=$(echo "$test" | cut -d':' -f1)
    NAME=$(echo "$test" | cut -d':' -f2)
    
    if nc -z localhost "$PORT" 2>/dev/null; then
        echo "  ✅ ${NAME} (port ${PORT}): 接続OK" | tee -a "$PERF_LOG"
        NETWORK_OK=$((NETWORK_OK + 1))
    else
        echo "  ❌ ${NAME} (port ${PORT}): 接続NG" | tee -a "$PERF_LOG"
    fi
done

echo "" | tee -a "$PERF_LOG"

# 6. E2Eテスト実行準備状況判定
echo "🧪 E2Eテスト実行準備状況:" | tee -a "$PERF_LOG"

# レスポンス時間評価
UI_SCORE=0
AUTH_SCORE=0
FRONTEND_SCORE=0

if (( $(echo "$UI_TIME < 2.0" | bc -l) )); then
    UI_SCORE=1
    echo "  ✅ Firebase UI レスポンス: 良好 (${UI_TIME}s < 2.0s)" | tee -a "$PERF_LOG"
else
    echo "  ⚠️  Firebase UI レスポンス: 要注意 (${UI_TIME}s >= 2.0s)" | tee -a "$PERF_LOG"
fi

if (( $(echo "$AUTH_TIME < 1.0" | bc -l) )); then
    AUTH_SCORE=1
    echo "  ✅ Auth Emulator レスポンス: 良好 (${AUTH_TIME}s < 1.0s)" | tee -a "$PERF_LOG"
else
    echo "  ⚠️  Auth Emulator レスポンス: 要注意 (${AUTH_TIME}s >= 1.0s)" | tee -a "$PERF_LOG"
fi

if [[ "$FRONTEND_TIME" != "timeout" ]] && (( $(echo "$FRONTEND_TIME < 5.0" | bc -l) )); then
    FRONTEND_SCORE=1
    echo "  ✅ Frontend レスポンス: 良好 (${FRONTEND_TIME}s < 5.0s)" | tee -a "$PERF_LOG"
else
    echo "  ⚠️  Frontend レスポンス: 要注意 (タイムアウトまたは遅延)" | tee -a "$PERF_LOG"
fi

TOTAL_SCORE=$((UI_SCORE + AUTH_SCORE + FRONTEND_SCORE + (NETWORK_OK >= 4 ? 1 : 0)))

echo "" | tee -a "$PERF_LOG"
echo "=================================" | tee -a "$PERF_LOG"

# 7. 最終判定
if [ "$TOTAL_SCORE" -ge 3 ] && [ "$NETWORK_OK" -ge 4 ]; then
    echo "🎉 パフォーマンス評価: E2Eテスト実行に適した環境" | tee -a "$PERF_LOG"
    echo "  - パフォーマンススコア: ${TOTAL_SCORE}/4" | tee -a "$PERF_LOG"
    echo "  - ネットワーク接続: ${NETWORK_OK}/5" | tee -a "$PERF_LOG"
    exit 0
elif [ "$TOTAL_SCORE" -ge 2 ] && [ "$NETWORK_OK" -ge 3 ]; then
    echo "⚠️  パフォーマンス評価: 軽微な問題あり、E2Eテスト実行可能" | tee -a "$PERF_LOG"
    echo "  - パフォーマンススコア: ${TOTAL_SCORE}/4" | tee -a "$PERF_LOG"
    echo "  - ネットワーク接続: ${NETWORK_OK}/5" | tee -a "$PERF_LOG"
    exit 0
else
    echo "❌ パフォーマンス評価: 重要な問題あり、最適化が必要" | tee -a "$PERF_LOG"
    echo "  - パフォーマンススコア: ${TOTAL_SCORE}/4" | tee -a "$PERF_LOG"
    echo "  - ネットワーク接続: ${NETWORK_OK}/5" | tee -a "$PERF_LOG"
    exit 1
fi