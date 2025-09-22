#!/bin/bash

# 継続的監視スクリプト - dev2・dev3作業サポート用
LOG_DIR="../../logs"
mkdir -p "$LOG_DIR"

TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
MONITOR_LOG="$LOG_DIR/continuous_monitor_${TIMESTAMP}.log"

echo "🔧 Docker環境継続監視開始 - $(date)" | tee "$MONITOR_LOG"
echo "=======================================" | tee -a "$MONITOR_LOG"

# 使用方法
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "使用方法:"
    echo "  $0 [オプション]"
    echo ""
    echo "オプション:"
    echo "  --start      継続監視開始（バックグラウンド）"
    echo "  --stop       継続監視停止"
    echo "  --status     現在の監視状況確認"
    echo "  --alert      アラート設定テスト"
    echo "  --help       このヘルプを表示"
    exit 0
fi

# プロセス管理
MONITOR_PID_FILE="/tmp/docker_monitor.pid"

# 監視メイン処理
run_monitoring() {
    while true; do
        CURRENT_TIME=$(date '+%H:%M:%S')
        echo "📊 定期監視実行 (${CURRENT_TIME}):" | tee -a "$MONITOR_LOG"
        
        # 1. コンテナ状態確認
        CONTAINERS_UP=$(docker-compose -f ../../environments/base.yml -f ../../environments/local.yml ps --format "{{.Status}}" | grep -c "Up")
        echo "  📦 起動中コンテナ: ${CONTAINERS_UP}/2" | tee -a "$MONITOR_LOG"
        
        if [ "$CONTAINERS_UP" -lt 2 ]; then
            echo "  🚨 ALERT: コンテナ停止検出！自動復旧を試行..." | tee -a "$MONITOR_LOG"
            docker-compose -f ../../environments/base.yml -f ../../environments/local.yml up -d | tee -a "$MONITOR_LOG"
            sleep 30
        fi
        
        # 2. ポート接続確認
        PORTS=("3000" "4000" "8080" "9099" "5001" "9199")
        OPEN_PORTS=0
        for port in "${PORTS[@]}"; do
            if nc -z localhost "$port" 2>/dev/null; then
                OPEN_PORTS=$((OPEN_PORTS + 1))
            else
                echo "  ⚠️  ポート ${port} 接続不可" | tee -a "$MONITOR_LOG"
            fi
        done
        echo "  🌐 利用可能ポート: ${OPEN_PORTS}/6" | tee -a "$MONITOR_LOG"
        
        # 3. リソース使用量確認
        CPU_USAGE=$(docker stats --no-stream --format "{{.CPUPerc}}" | sed 's/%//' | awk '{sum+=$1} END {printf "%.2f", sum}')
        MEM_USAGE=$(docker stats --no-stream --format "{{.MemPerc}}" | sed 's/%//' | awk '{sum+=$1} END {printf "%.2f", sum}')
        echo "  💻 CPU使用率: ${CPU_USAGE}%, メモリ使用率: ${MEM_USAGE}%" | tee -a "$MONITOR_LOG"
        
        # 4. エラーログ監視
        ERROR_COUNT=$(docker-compose -f ../../environments/base.yml -f ../../environments/local.yml logs --tail=50 | grep -i "error\|exception\|failed" | wc -l)
        if [ "$ERROR_COUNT" -gt 10 ]; then
            echo "  🚨 ALERT: 多数のエラー検出 (${ERROR_COUNT}件)" | tee -a "$MONITOR_LOG"
        else
            echo "  ✅ エラー状況: 正常 (${ERROR_COUNT}件)" | tee -a "$MONITOR_LOG"
        fi
        
        # 5. Frontend健全性確認
        FRONTEND_STATUS=$(curl -s -w "%{http_code}" -m 5 http://localhost:3000/ -o /dev/null 2>/dev/null || echo "000")
        if [ "$FRONTEND_STATUS" = "200" ]; then
            echo "  ✅ Frontend: 正常動作" | tee -a "$MONITOR_LOG"
        else
            echo "  🚨 ALERT: Frontend異常 (HTTP ${FRONTEND_STATUS})" | tee -a "$MONITOR_LOG"
        fi
        
        # 6. Firebase Emulator確認
        FIREBASE_STATUS=$(curl -s -w "%{http_code}" -m 5 http://localhost:4000/ -o /dev/null 2>/dev/null || echo "000")
        if [ "$FIREBASE_STATUS" = "200" ]; then
            echo "  ✅ Firebase Emulator: 正常動作" | tee -a "$MONITOR_LOG"
        else
            echo "  🚨 ALERT: Firebase Emulator異常 (HTTP ${FIREBASE_STATUS})" | tee -a "$MONITOR_LOG"
        fi
        
        echo "  ----------------------------------------" | tee -a "$MONITOR_LOG"
        
        # 60秒間隔で監視
        sleep 60
    done
}

# 監視開始
start_monitoring() {
    if [ -f "$MONITOR_PID_FILE" ] && kill -0 $(cat "$MONITOR_PID_FILE") 2>/dev/null; then
        echo "⚠️  監視プロセスは既に実行中です (PID: $(cat $MONITOR_PID_FILE))"
        return 1
    fi
    
    echo "🚀 継続監視開始..."
    nohup bash -c "$(declare -f run_monitoring); run_monitoring" > "$LOG_DIR/monitor_background.log" 2>&1 &
    MONITOR_PID=$!
    echo $MONITOR_PID > "$MONITOR_PID_FILE"
    echo "📊 監視プロセス開始: PID $MONITOR_PID"
    echo "📝 バックグラウンドログ: $LOG_DIR/monitor_background.log"
}

# 監視停止
stop_monitoring() {
    if [ -f "$MONITOR_PID_FILE" ]; then
        PID=$(cat "$MONITOR_PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            kill "$PID"
            echo "🛑 監視プロセス停止: PID $PID"
        else
            echo "⚠️  監視プロセスは既に停止しています"
        fi
        rm -f "$MONITOR_PID_FILE"
    else
        echo "⚠️  監視プロセスが見つかりません"
    fi
}

# 監視状況確認  
check_status() {
    echo "🔍 継続監視状況:"
    if [ -f "$MONITOR_PID_FILE" ] && kill -0 $(cat "$MONITOR_PID_FILE") 2>/dev/null; then
        PID=$(cat "$MONITOR_PID_FILE")
        echo "  ✅ 監視プロセス: 実行中 (PID: $PID)"
        echo "  📊 監視間隔: 60秒"
        echo "  📝 ログファイル: $LOG_DIR/monitor_background.log"
        
        # 最新監視結果表示
        if [ -f "$LOG_DIR/monitor_background.log" ]; then
            echo ""
            echo "📊 最新監視結果:"
            tail -10 "$LOG_DIR/monitor_background.log"
        fi
    else
        echo "  ❌ 監視プロセス: 停止中"
        echo "  💡 開始方法: $0 --start"
    fi
}

# アラート設定テスト
test_alert() {
    echo "🚨 アラート設定テスト実行中..."
    
    # フェイクアラート生成
    echo "TEST ALERT: Docker環境監視テスト - $(date)" | tee -a "$MONITOR_LOG"
    
    # 通知ログ出力
    echo "📧 アラート通知テスト完了"
    echo "📝 アラートログ: $MONITOR_LOG"
}

# メイン処理
case "$1" in
    "--start")
        start_monitoring
        ;;
    "--stop")
        stop_monitoring
        ;;
    "--status")
        check_status
        ;;
    "--alert")
        test_alert
        ;;
    *)
        echo "🔧 Docker環境継続監視システム"
        echo ""
        echo "💡 開発チーム作業サポート用の自動監視"
        echo "   - コンテナ状態監視・自動復旧"
        echo "   - ポート接続確認"
        echo "   - リソース使用量監視"
        echo "   - エラーログ監視"
        echo "   - Frontend・Firebase Emulator健全性確認"
        echo ""
        echo "使用方法: $0 [--start|--stop|--status|--alert|--help]"
        echo ""
        echo "🚀 監視開始: $0 --start"
        echo "🔍 状況確認: $0 --status"
        ;;
esac

echo "=======================================" | tee -a "$MONITOR_LOG"
echo "📝 ログファイル: $MONITOR_LOG" | tee -a "$MONITOR_LOG"