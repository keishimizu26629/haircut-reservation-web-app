#!/bin/bash

# 🤖 AI並列開発チーム - メッセージ送信システム

# 使用方法表示
show_usage() {
    cat << EOF
🚀 AIチーム メッセージ送信システム

使用方法:
  $0 [エージェント名] [メッセージ]
  $0 --list

利用可能エージェント:
  ceo     - 最高経営責任者（全体統括）
  manager - プロジェクトマネージャー（柔軟なチーム管理）
  dev1    - 実行エージェント1（柔軟な役割対応）
  dev2    - 実行エージェント2（柔軟な役割対応）
  dev3    - 実行エージェント3（柔軟な役割対応）

使用例:
  $0 manager "新しいプロジェクトを開始してください"
  $0 dev1 "【マーケティング担当として】市場調査を実施してください"
  $0 dev2 "【データ分析担当として】売上分析を実施してください"
EOF
}

# エージェント一覧表示
show_agents() {
    echo "📋 AIチームメンバー一覧:"
    echo "======================="
    echo "  ceo     → ceo:0        (最高経営責任者)"
    echo "  manager → team:0.0     (プロジェクトマネージャー)"
    echo "  dev1    → team:0.1     (実行エージェント1)"
    echo "  dev2    → team:0.2     (実行エージェント2)"
    echo "  dev3    → team:0.3     (実行エージェント3)"
}

# ログ機能
log_message() {
    local agent="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    mkdir -p logs
    echo "[$timestamp] → $agent: \"$message\"" >> logs/communication.log
}

# セッション存在確認
check_session() {
    local session_name="$1"
    if ! tmux has-session -t "$session_name" 2>/dev/null; then
        echo "❌ エラー: セッション '$session_name' が見つかりません"
        echo "先に ./start-team.sh を実行してください"
        return 1
    fi
    return 0
}

# 改良版メッセージ送信
send_enhanced_message() {
    local target="$1"
    local message="$2"
    local agent_name="$3"
    
    echo "📤 送信中: $agent_name へメッセージを送信..."
    
    # 1. プロンプトクリア（より確実に）
    tmux send-keys -t "$target" C-c
    sleep 0.4
    
    # 2. 追加のクリア（念のため）
    tmux send-keys -t "$target" C-u
    sleep 0.2
    
    # 3. メッセージ送信
    tmux send-keys -t "$target" "$message"
    sleep 0.3
    
    # 4. Enter押下（自動実行）
    tmux send-keys -t "$target" C-m
    sleep 0.5
    
    echo "✅ 送信完了: $agent_name に自動実行されました"
}

# メイン処理
main() {
    # 引数チェック
    if [[ $# -eq 0 ]]; then
        show_usage
        exit 1
    fi
    
    # --listオプション
    if [[ "$1" == "--list" ]]; then
        show_agents
        exit 0
    fi
    
    if [[ $# -lt 2 ]]; then
        show_usage
        exit 1
    fi
    
    local agent="$1"
    local message="$2"
    
    # 送信先の決定
    local session=""
    local pane=""
    local target=""
    
    case $agent in
        "ceo")
            session="ceo"
            pane="0"
            target="ceo:0"
            ;;
        "manager")
            session="team"
            pane="0.0"
            target="team:0.0"
            ;;
        "dev1")
            session="team"
            pane="0.1"
            target="team:0.1"
            ;;
        "dev2")
            session="team"
            pane="0.2"
            target="team:0.2"
            ;;
        "dev3")
            session="team"
            pane="0.3"
            target="team:0.3"
            ;;
        *)
            echo "❌ エラー: 無効なエージェント名 '$agent'"
            echo "利用可能エージェント: $0 --list"
            exit 1
            ;;
    esac
    
    # セッション存在確認
    if ! check_session "$session"; then
        exit 1
    fi
    
    # メッセージ送信
    send_enhanced_message "$target" "$message" "$agent"
    
    # ログ記録
    log_message "$agent" "$message"
    
    echo ""
    echo "🎯 メッセージ詳細:"
    echo "   宛先: $agent ($target)"
    echo "   内容: \"$message\""
    echo "   ログ: logs/communication.log に記録済み"
    
    return 0
}

main "$@"