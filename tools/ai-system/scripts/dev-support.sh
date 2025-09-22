#!/bin/bash

# dev2・dev3作業サポートツール
LOG_DIR="../../logs"
mkdir -p "$LOG_DIR"

echo "👥 dev2・dev3 作業サポートツール"
echo "================================"

# 使用方法
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "使用方法:"
    echo "  $0 [コマンド]"
    echo ""
    echo "サポートコマンド:"
    echo "  quick-check    環境状況クイックチェック"
    echo "  reset-env      環境リセット・復旧"
    echo "  logs-summary   エラーログサマリー表示" 
    echo "  service-test   全サービス接続テスト"
    echo "  db-status      Firestore Emulator状況確認"
    echo "  clear-cache    キャッシュクリア・再構築"
    echo "  help           このヘルプを表示"
    exit 0
fi

# クイックチェック
quick_check() {
    echo "⚡ 環境状況クイックチェック:"
    
    # Docker状況
    echo "  📦 Docker状況:"
    docker-compose -f ../../environments/base.yml -f ../../environments/local.yml ps --format "    {{.Service}}: {{.Status}}"
    
    # ポート状況
    echo "  🌐 ポート状況:"
    PORTS=("3000:Frontend" "4000:Firebase-UI" "8080:Firestore" "9099:Auth" "5001:Functions" "9199:Storage")
    for service in "${PORTS[@]}"; do
        PORT=$(echo "$service" | cut -d':' -f1)
        NAME=$(echo "$service" | cut -d':' -f2)
        if nc -z localhost "$PORT" 2>/dev/null; then
            echo "    ✅ ${NAME} (${PORT}): OK"
        else
            echo "    ❌ ${NAME} (${PORT}): NG"
        fi
    done
    
    # 最新エラー確認
    ERROR_COUNT=$(docker-compose -f ../../environments/base.yml -f ../../environments/local.yml logs --tail=20 | grep -i "error\|exception" | wc -l)
    echo "  🚨 最新エラー: ${ERROR_COUNT}件"
}

# 環境リセット・復旧
reset_env() {
    echo "🔄 環境リセット・復旧実行中..."
    
    echo "  1. コンテナ停止・削除"
    docker-compose -f ../../environments/base.yml -f ../../environments/local.yml down
    
    echo "  2. 不要リソースクリーンアップ"
    docker system prune -f
    
    echo "  3. コンテナ再構築・起動"
    docker-compose -f ../../environments/base.yml -f ../../environments/local.yml up -d --build
    
    echo "  4. 起動完了待機（60秒）"
    sleep 60
    
    echo "  5. 復旧確認"
    quick_check
    
    echo "✅ 環境リセット完了"
}

# エラーログサマリー
logs_summary() {
    echo "📋 エラーログサマリー（直近50行）:"
    
    echo "  🔥 Firebase Emulator エラー:"
    docker-compose -f ../../environments/base.yml -f ../../environments/local.yml logs firebase-emulator --tail=50 | grep -i "error\|exception\|failed" | head -5
    
    echo "  🖥️  Frontend エラー:"
    docker-compose -f ../../environments/base.yml -f ../../environments/local.yml logs frontend --tail=50 | grep -i "error\|exception\|failed" | head -5
    
    echo "  📊 エラー統計:"
    FIREBASE_ERRORS=$(docker-compose -f ../../environments/base.yml -f ../../environments/local.yml logs firebase-emulator --tail=100 | grep -i "error\|exception\|failed" | wc -l)
    FRONTEND_ERRORS=$(docker-compose -f ../../environments/base.yml -f ../../environments/local.yml logs frontend --tail=100 | grep -i "error\|exception\|failed" | wc -l)
    echo "    Firebase: ${FIREBASE_ERRORS}件, Frontend: ${FRONTEND_ERRORS}件"
}

# 全サービス接続テスト
service_test() {
    echo "🔧 全サービス接続テスト実行中..."
    
    SERVICES=("http://localhost:3000/:Frontend" "http://localhost:4000/:Firebase-UI" "http://localhost:9099/:Auth-Emulator")
    
    for service in "${SERVICES[@]}"; do
        URL=$(echo "$service" | cut -d':' -f1-3)
        NAME=$(echo "$service" | cut -d':' -f4)
        
        STATUS=$(curl -s -w "%{http_code}" -m 5 "$URL" -o /dev/null 2>/dev/null || echo "000")
        RESPONSE_TIME=$(curl -s -w "%{time_total}" -m 5 "$URL" -o /dev/null 2>/dev/null || echo "timeout")
        
        if [ "$STATUS" = "200" ]; then
            echo "  ✅ ${NAME}: OK (${RESPONSE_TIME}s)"
        else
            echo "  ❌ ${NAME}: NG (HTTP ${STATUS})"
        fi
    done
}

# Firestore Emulator状況確認
db_status() {
    echo "💾 Firestore Emulator状況:"
    
    # 基本接続確認
    if nc -z localhost 8080 2>/dev/null; then
        echo "  ✅ Firestore Emulator: 接続OK"
        
        # プロジェクト情報確認
        echo "  📊 プロジェクト情報:"
        curl -s -m 5 "http://localhost:8080/v1/projects" | head -3 || echo "    ⚠️  API応答なし"
        
        # データベース一覧
        echo "  📁 データベース:"
        curl -s -m 5 "http://localhost:8080/v1/projects/demo-project/databases" | head -3 || echo "    ⚠️  データベース情報取得失敗"
        
    else
        echo "  ❌ Firestore Emulator: 接続NG"
        echo "  💡 解決策: ./dev-support.sh reset-env"
    fi
}

# キャッシュクリア・再構築
clear_cache() {
    echo "🧹 キャッシュクリア・再構築:"
    
    echo "  1. Nuxtキャッシュクリア"
    docker exec environments-frontend-1 rm -rf /app/.nuxt/dist 2>/dev/null || echo "    ⚠️  Nuxtキャッシュクリア（コンテナ未起動）"
    
    echo "  2. Nodeキャッシュクリア"
    docker exec environments-frontend-1 npm cache clean --force 2>/dev/null || echo "    ⚠️  Nodeキャッシュクリア（コンテナ未起動）"
    
    echo "  3. Dockerイメージ再構築"
    docker-compose -f ../../environments/base.yml -f ../../environments/local.yml build --no-cache frontend
    
    echo "  4. サービス再起動"
    docker-compose -f ../../environments/base.yml -f ../../environments/local.yml restart
    
    echo "✅ キャッシュクリア完了"
}

# メイン処理
case "$1" in
    "quick-check")
        quick_check
        ;;
    "reset-env")
        reset_env
        ;;
    "logs-summary")
        logs_summary
        ;;
    "service-test")
        service_test
        ;;
    "db-status")
        db_status
        ;;
    "clear-cache")
        clear_cache
        ;;
    "help"|"--help"|"-h")
        $0 --help
        ;;
    *)
        echo "🎯 dev2・dev3向け作業支援メニュー:"
        echo ""
        echo "  ⚡ ./dev-support.sh quick-check     環境状況確認"
        echo "  🔧 ./dev-support.sh service-test    サービステスト"
        echo "  📋 ./dev-support.sh logs-summary    エラーログ確認"
        echo "  💾 ./dev-support.sh db-status       DB状況確認"
        echo "  🧹 ./dev-support.sh clear-cache     キャッシュクリア"
        echo "  🔄 ./dev-support.sh reset-env       環境リセット"
        echo ""
        echo "💡 詳細ヘルプ: ./dev-support.sh help"
        ;;
esac