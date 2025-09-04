#!/bin/bash

# E2Eテスト環境サポートスクリプト
LOG_DIR="../../logs"
mkdir -p "$LOG_DIR"

TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
E2E_LOG="$LOG_DIR/e2e_support_${TIMESTAMP}.log"

echo "🧪 E2Eテスト環境サポート開始 - $(date)" | tee "$E2E_LOG"
echo "=======================================" | tee -a "$E2E_LOG"

# 使用方法を表示
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "使用方法:"
    echo "  $0 [オプション]"
    echo ""
    echo "オプション:"
    echo "  --prepare    E2Eテスト環境の事前準備"
    echo "  --monitor    E2Eテスト実行中の監視（バックグラウンド）"
    echo "  --cleanup    E2Eテスト完了後のクリーンアップ"
    echo "  --status     現在の環境状況確認"
    echo "  --help       このヘルプを表示"
    exit 0
fi

# 現在の環境状況確認
check_environment() {
    echo "🔍 環境状況確認:" | tee -a "$E2E_LOG"
    
    # コンテナ状態確認
    CONTAINERS_STATUS=$(docker-compose -f ../../environments/base.yml -f ../../environments/local.yml ps --format "{{.Status}}" | grep -c "Up")
    echo "  📦 起動中コンテナ: ${CONTAINERS_STATUS}/2" | tee -a "$E2E_LOG"
    
    # ポート確認
    PORTS=("3000" "4000" "8080" "9099" "5001" "9199")
    OPEN_PORTS=0
    for port in "${PORTS[@]}"; do
        if nc -z localhost "$port" 2>/dev/null; then
            OPEN_PORTS=$((OPEN_PORTS + 1))
        fi
    done
    echo "  🌐 利用可能ポート: ${OPEN_PORTS}/6" | tee -a "$E2E_LOG"
    
    # リソース使用量
    CPU_USAGE=$(docker stats --no-stream --format "{{.CPUPerc}}" | sed 's/%//' | awk '{sum+=$1} END {printf "%.2f", sum}')
    echo "  💻 CPU使用率: ${CPU_USAGE}%" | tee -a "$E2E_LOG"
    
    return $((CONTAINERS_STATUS + OPEN_PORTS))
}

# E2Eテスト事前準備
prepare_e2e() {
    echo "🔧 E2Eテスト事前準備:" | tee -a "$E2E_LOG"
    
    # 1. コンテナ状態確認・修復
    echo "  1. コンテナ状態確認・修復" | tee -a "$E2E_LOG"
    docker-compose -f ../../environments/base.yml -f ../../environments/local.yml ps | tee -a "$E2E_LOG"
    
    # 停止しているコンテナがある場合は再起動
    STOPPED_CONTAINERS=$(docker-compose -f ../../environments/base.yml -f ../../environments/local.yml ps --format "{{.Status}}" | grep -c "Exit\|Stopped" || echo "0")
    if [ "$STOPPED_CONTAINERS" -gt 0 ]; then
        echo "    ⚠️  停止中のコンテナを検出、再起動中..." | tee -a "$E2E_LOG"
        docker-compose -f ../../environments/base.yml -f ../../environments/local.yml up -d | tee -a "$E2E_LOG"
        sleep 30
    fi
    
    # 2. ログクリーンアップ
    echo "  2. 古いログのクリーンアップ" | tee -a "$E2E_LOG"
    find "$LOG_DIR" -name "*.log" -mtime +1 -delete 2>/dev/null || true
    
    # 3. テストデータベース初期化
    echo "  3. テストデータベース初期化" | tee -a "$E2E_LOG"
    # Firestore Emulatorは自動的にメモリ内でデータをリセット
    
    # 4. 環境変数確認
    echo "  4. 環境変数確認" | tee -a "$E2E_LOG"
    docker exec environments-frontend-1 env | grep -E "FIREBASE|NODE_ENV" | tee -a "$E2E_LOG"
    
    echo "  ✅ E2Eテスト事前準備完了" | tee -a "$E2E_LOG"
}

# E2Eテスト実行中監視
monitor_e2e() {
    echo "👁️  E2Eテスト実行監視開始:" | tee -a "$E2E_LOG"
    
    # バックグラウンドプロセスとして実行する場合
    if [[ "$2" == "--background" ]]; then
        nohup "$0" --monitor > "${LOG_DIR}/e2e_monitor_bg.log" 2>&1 &
        echo "  📊 バックグラウンド監視プロセス開始: PID $!" | tee -a "$E2E_LOG"
        return
    fi
    
    # リアルタイム監視（60秒間）
    for i in {1..12}; do
        echo "  📊 監視 ${i}/12 ($(date '+%H:%M:%S')):" | tee -a "$E2E_LOG"
        
        # CPU/メモリ使用量
        docker stats --no-stream --format "    {{.Container}}: CPU {{.CPUPerc}}, Memory {{.MemUsage}}" | tee -a "$E2E_LOG"
        
        # 最新エラーログ確認
        ERROR_COUNT=$(docker-compose -f ../../environments/base.yml -f ../../environments/local.yml logs --tail=10 | grep -i "error\|exception\|failed" | wc -l)
        if [ "$ERROR_COUNT" -gt 0 ]; then
            echo "    ⚠️  新しいエラー: ${ERROR_COUNT}件" | tee -a "$E2E_LOG"
        fi
        
        sleep 5
    done
    
    echo "  ✅ E2Eテスト監視完了" | tee -a "$E2E_LOG"
}

# E2Eテスト完了後クリーンアップ
cleanup_e2e() {
    echo "🧹 E2Eテスト完了後クリーンアップ:" | tee -a "$E2E_LOG"
    
    # 1. ログファイル整理
    echo "  1. ログファイル整理" | tee -a "$E2E_LOG"
    FINAL_LOG_DIR="${LOG_DIR}/e2e_$(date '+%Y%m%d')"
    mkdir -p "$FINAL_LOG_DIR"
    mv "${LOG_DIR}"/e2e_*.log "$FINAL_LOG_DIR/" 2>/dev/null || true
    
    # 2. 不要なDockerリソースクリーンアップ
    echo "  2. Dockerリソースクリーンアップ" | tee -a "$E2E_LOG"
    docker system prune -f | tee -a "$E2E_LOG"
    
    # 3. 環境リセット準備
    echo "  3. 次回テスト用環境リセット" | tee -a "$E2E_LOG"
    # Firestore Emulatorデータは自動クリア（メモリベース）
    
    echo "  ✅ E2Eテストクリーンアップ完了" | tee -a "$E2E_LOG"
}

# メイン処理
case "$1" in
    "--prepare")
        prepare_e2e
        ;;
    "--monitor")
        monitor_e2e "$@"
        ;;
    "--cleanup")
        cleanup_e2e
        ;;
    "--status")
        check_environment
        SCORE=$?
        if [ "$SCORE" -ge 7 ]; then
            echo "🎉 環境状況: E2Eテスト実行準備完了" | tee -a "$E2E_LOG"
        else
            echo "⚠️  環境状況: 準備不完全、--prepare実行を推奨" | tee -a "$E2E_LOG"
        fi
        ;;
    *)
        echo "🚀 E2Eテスト環境自動サポート:" | tee -a "$E2E_LOG"
        
        # 環境状況確認
        check_environment
        SCORE=$?
        
        if [ "$SCORE" -ge 7 ]; then
            echo "✅ 環境準備完了: E2Eテスト実行可能" | tee -a "$E2E_LOG"
        else
            echo "⚠️  環境準備が必要: 自動準備を実行中..." | tee -a "$E2E_LOG"
            prepare_e2e
        fi
        
        echo "" | tee -a "$E2E_LOG"
        echo "💡 使用方法:" | tee -a "$E2E_LOG"
        echo "  E2Eテスト前: $0 --prepare" | tee -a "$E2E_LOG"
        echo "  実行中監視: $0 --monitor --background" | tee -a "$E2E_LOG"
        echo "  完了後処理: $0 --cleanup" | tee -a "$E2E_LOG"
        echo "  状況確認: $0 --status" | tee -a "$E2E_LOG"
        ;;
esac

echo "=======================================" | tee -a "$E2E_LOG"
echo "📝 ログファイル: $E2E_LOG" | tee -a "$E2E_LOG"