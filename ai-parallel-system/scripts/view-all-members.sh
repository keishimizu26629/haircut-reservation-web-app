#!/bin/bash

# 🔍 AI並列開発チーム - 全メンバー表示システム

# 使用方法表示
show_usage() {
    cat << EOF
🌟 AIチーム 全メンバー表示システム
=================================

使用方法:
  $0              - 全メンバーを一画面で表示
  $0 --help       - このヘルプを表示
  $0 --status     - 各セッションの状態確認

表示レイアウト:
┌─────────────┬─────────────┐
│    CEO      │   Manager   │
│   (ceo:0)   │  (team:0.0) │
├─────────────┼─────────────┤
│    dev1     │    dev2     │
│  (team:0.1) │  (team:0.2) │
├─────────────┴─────────────┤
│         dev3              │
│       (team:0.3)          │
└───────────────────────────┘

操作方法:
・マウスクリック     : ペイン切り替え
・Ctrl+] → ↑↓←→    : キーボードでペイン移動
・Ctrl+] → d        : デタッチ（終了ではない）
・Ctrl+] → x        : 表示終了
EOF
}

# セッション状態確認
check_status() {
    echo "📊 AIチーム セッション状態"
    echo "=========================="
    
    # CEOセッション確認
    if tmux has-session -t ceo 2>/dev/null; then
        echo "✅ CEO      : アクティブ (ceo:0)"
    else
        echo "❌ CEO      : 停止中"
    fi
    
    # チームセッション確認
    if tmux has-session -t team 2>/dev/null; then
        echo "✅ Manager  : アクティブ (team:0.0)"
        echo "✅ dev1     : アクティブ (team:0.1)"
        echo "✅ dev2     : アクティブ (team:0.2)"
        echo "✅ dev3     : アクティブ (team:0.3)"
    else
        echo "❌ Team     : 停止中 (Manager, dev1-3)"
    fi
    
    echo ""
    echo "📝 起動方法:"
    echo "   ./scripts/start-team.sh    # チーム起動"
    echo "   ./scripts/view-all-members.sh  # 全員表示"
}

# セッション存在確認
check_sessions() {
    local missing_sessions=()
    
    if ! tmux has-session -t ceo 2>/dev/null; then
        missing_sessions+=("ceo")
    fi
    
    if ! tmux has-session -t team 2>/dev/null; then
        missing_sessions+=("team")
    fi
    
    if [[ ${#missing_sessions[@]} -gt 0 ]]; then
        echo "❌ エラー: 以下のセッションが見つかりません:"
        for session in "${missing_sessions[@]}"; do
            echo "   - $session"
        done
        echo ""
        echo "先に以下を実行してください:"
        echo "   ./scripts/start-team.sh"
        return 1
    fi
    
    return 0
}

# 全メンバー表示画面作成
create_overview_session() {
    local session_name="ai-team-overview"
    
    # 既存のオーバービューセッションを削除
    tmux kill-session -t "$session_name" 2>/dev/null
    
    echo "🚀 全メンバー表示画面を作成中..."
    
    # 新しいセッション作成
    tmux new-session -d -s "$session_name"
    
    # 5分割レイアウト作成
    # 上段：CEO | Manager
    tmux split-window -h -t "$session_name:0.0"
    
    # 中段：dev1 | dev2  
    tmux split-window -v -t "$session_name:0.0"
    tmux split-window -v -t "$session_name:0.1"
    
    # 下段：dev3（横幅全体）
    tmux split-window -v -t "$session_name:0.2"
    
    # レイアウト調整（均等分割）
    tmux select-layout -t "$session_name" tiled
    
    echo "📺 各ペインにエージェントを接続中..."
    
    # 各ペインに対応するセッションを接続
    # ペイン0: CEO
    tmux send-keys -t "$session_name:0.0" "tmux attach -t ceo" C-m
    sleep 0.5
    
    # ペイン1: Manager  
    tmux send-keys -t "$session_name:0.1" "tmux attach -t team \\; select-pane -t 0.0" C-m
    sleep 0.5
    
    # ペイン2: dev1
    tmux send-keys -t "$session_name:0.2" "tmux attach -t team \\; select-pane -t 0.1" C-m
    sleep 0.5
    
    # ペイン3: dev2
    tmux send-keys -t "$session_name:0.3" "tmux attach -t team \\; select-pane -t 0.2" C-m
    sleep 0.5
    
    # ペイン4: dev3
    tmux send-keys -t "$session_name:0.4" "tmux attach -t team \\; select-pane -t 0.3" C-m
    sleep 0.5
    
    echo "✅ 全メンバー表示準備完了！"
    echo ""
    echo "🎯 接続中..."
    
    # オーバービューセッションにアタッチ
    tmux attach -t "$session_name"
}

# メイン処理
main() {
    # 引数チェック
    case "${1:-}" in
        "--help"|"-h")
            show_usage
            exit 0
            ;;
        "--status"|"-s")
            check_status
            exit 0
            ;;
        "")
            # 全メンバー表示処理
            ;;
        *)
            echo "❌ エラー: 無効なオプション '$1'"
            show_usage
            exit 1
            ;;
    esac
    
    echo "🔍 AIチーム 全メンバー表示システム"
    echo "=================================="
    echo ""
    
    # セッション存在確認
    if ! check_sessions; then
        exit 1
    fi
    
    # 全メンバー表示画面作成・接続
    create_overview_session
}

main "$@"