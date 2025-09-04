#!/bin/bash

# Dev Environment Control Script
# Firebase認証永続化対応版

set -e

# 色付きログ
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 必要な環境変数を設定
export FIREBASE_DEV_PROJECT_ID=haircut-reservation-dev
export FIREBASE_DEV_API_KEY=AIzaSyBTvdrOvdcdhNrONF_b9uXeInoqvVmKYfY
export FIREBASE_DEV_AUTH_DOMAIN=haircut-reservation-dev.firebaseapp.com
export FIREBASE_DEV_STORAGE_BUCKET=haircut-reservation-dev.firebasestorage.app
export FIREBASE_DEV_MESSAGING_SENDER_ID=509197594275
export FIREBASE_DEV_APP_ID=1:509197594275:web:c2aab827763cddcf441916
export FIREBASE_ENV=development
export NODE_ENV=development
export FIREBASE_USE_EMULATOR=false

# Docker Composeファイル
COMPOSE_FILES="-f environments/base.yml -f environments/dev.yml"

# ヘルプ表示
show_help() {
    echo -e "${BLUE}Dev Environment Control Script${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
    echo "使用方法: ./dev-control.sh [コマンド]"
    echo ""
    echo "コマンド:"
    echo "  start     - dev環境を起動"
    echo "  stop      - dev環境を停止"
    echo "  restart   - dev環境を再起動"
    echo "  rebuild   - イメージを再ビルドして起動"
    echo "  logs      - ログを表示"
    echo "  status    - コンテナの状態確認"
    echo "  clean     - 停止してボリュームも削除"
    echo "  help      - このヘルプを表示"
    echo ""
    echo "例:"
    echo "  ./dev-control.sh start"
    echo "  ./dev-control.sh logs"
    echo "  ./dev-control.sh restart"
}

# 環境起動
start_env() {
    echo -e "${GREEN}🚀 Dev環境を起動中...${NC}"
    echo -e "${YELLOW}Firebase Project: ${FIREBASE_DEV_PROJECT_ID}${NC}"

    docker compose $COMPOSE_FILES up -d

    echo ""
    echo -e "${GREEN}✅ Dev環境が起動しました！${NC}"
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}🌐 フロントエンド:    http://localhost:3000${NC}"
    echo -e "${BLUE}📊 Prometheus:       http://localhost:9090${NC}"
    echo -e "${BLUE}📈 Grafana:          http://localhost:3030${NC}"
    echo -e "${BLUE}🔥 Firebase Project: ${FIREBASE_DEV_PROJECT_ID}${NC}"
    echo -e "${BLUE}================================${NC}"
}

# 環境停止
stop_env() {
    echo -e "${YELLOW}🛑 Dev環境を停止中...${NC}"
    docker compose $COMPOSE_FILES down
    echo -e "${GREEN}✅ Dev環境を停止しました${NC}"
}

# 環境再起動
restart_env() {
    echo -e "${YELLOW}🔄 Dev環境を再起動中...${NC}"
    stop_env
    start_env
}

# リビルド
rebuild_env() {
    echo -e "${YELLOW}🔧 イメージを再ビルドして起動中...${NC}"
    docker compose $COMPOSE_FILES down
    docker compose $COMPOSE_FILES up --build -d
    echo -e "${GREEN}✅ リビルド完了！${NC}"
}

# ログ表示
show_logs() {
    echo -e "${BLUE}📋 ログを表示中... (Ctrl+Cで終了)${NC}"
    docker compose $COMPOSE_FILES logs -f
}

# 状態確認
show_status() {
    echo -e "${BLUE}📊 コンテナの状態:${NC}"
    docker compose $COMPOSE_FILES ps
    echo ""
    echo -e "${BLUE}🔍 ポート使用状況:${NC}"
    echo "Port 3000 (Frontend):"
    lsof -ti:3000 2>/dev/null && echo "  使用中" || echo "  空き"
    echo "Port 3030 (Grafana):"
    lsof -ti:3030 2>/dev/null && echo "  使用中" || echo "  空き"
    echo "Port 9090 (Prometheus):"
    lsof -ti:9090 2>/dev/null && echo "  使用中" || echo "  空き"
}

# クリーンアップ
clean_env() {
    echo -e "${RED}🧹 Dev環境をクリーンアップ中...${NC}"
    docker compose $COMPOSE_FILES down -v --remove-orphans
    echo -e "${GREEN}✅ クリーンアップ完了${NC}"
}

# メイン処理
case "${1:-help}" in
    "start")
        start_env
        ;;
    "stop")
        stop_env
        ;;
    "restart")
        restart_env
        ;;
    "rebuild")
        rebuild_env
        ;;
    "logs")
        show_logs
        ;;
    "status")
        show_status
        ;;
    "clean")
        clean_env
        ;;
    "help"|*)
        show_help
        ;;
esac
