#!/bin/bash

echo "=== AI並列開発システム 状況確認 ==="
echo "実行日時: $(date)"
echo ""

echo "=== TMux セッション状況 ==="
if tmux list-sessions 2>/dev/null; then
    echo "✅ TMux セッションが正常に動作中"
else
    echo "❌ TMux セッションが見つかりません"
    echo "解決策: ./scripts/start-team.sh を実行してください"
    exit 1
fi

echo ""
echo "=== 各エージェントの状態 ==="

echo "📋 CEO:"
if tmux capture-pane -t ceo -p 2>/dev/null | tail -3; then
    echo "✅ CEO セッション正常"
else
    echo "❌ CEO セッションに問題があります"
fi

echo ""
echo "👔 Manager:"
if tmux capture-pane -t team:0.0 -p 2>/dev/null | tail -3; then
    echo "✅ Manager セッション正常"
else
    echo "❌ Manager セッションに問題があります"
fi

echo ""
echo "💻 Dev1:"
if tmux capture-pane -t team:0.1 -p 2>/dev/null | tail -3; then
    echo "✅ Dev1 セッション正常"
else
    echo "❌ Dev1 セッションに問題があります"
fi

echo ""
echo "🔧 Dev2:"
if tmux capture-pane -t team:0.2 -p 2>/dev/null | tail -3; then
    echo "✅ Dev2 セッション正常"
else
    echo "❌ Dev2 セッションに問題があります"
fi

echo ""
echo "🔍 Dev3:"
if tmux capture-pane -t team:0.3 -p 2>/dev/null | tail -3; then
    echo "✅ Dev3 セッション正常"
else
    echo "❌ Dev3 セッションに問題があります"
fi

echo ""
echo "=== 最新の通信ログ (直近10件) ==="
if [ -f logs/communication.log ]; then
    tail -10 logs/communication.log
    echo ""
    echo "📊 通信ログ統計:"
    echo "  - 総メッセージ数: $(wc -l < logs/communication.log)"
    echo "  - 最新メッセージ: $(tail -1 logs/communication.log | cut -d']' -f1 | tr -d '[')"
else
    echo "❌ 通信ログファイルが見つかりません"
fi

echo ""
echo "=== システム健全性チェック ==="

# プロセス確認
TMUX_PROCESSES=$(ps aux | grep -c "[t]mux")
echo "🔄 TMux プロセス数: $TMUX_PROCESSES"

# Claude プロセス確認
CLAUDE_PROCESSES=$(ps aux | grep -c "[c]laude")
echo "🤖 Claude プロセス数: $CLAUDE_PROCESSES"

# ディスク使用量確認
LOG_SIZE=$(du -h logs/communication.log 2>/dev/null | cut -f1)
echo "💾 通信ログサイズ: ${LOG_SIZE:-N/A}"

echo ""
echo "=== 推奨アクション ==="
if [ "$CLAUDE_PROCESSES" -lt 5 ]; then
    echo "⚠️  Claude プロセス数が少ないです。一部のエージェントが停止している可能性があります。"
    echo "   対処法: 各セッションの状況を個別に確認してください。"
fi

if [ -f logs/communication.log ]; then
    LAST_MESSAGE_TIME=$(tail -1 logs/communication.log | grep -o '\[.*\]' | tr -d '[]')
    if [ -n "$LAST_MESSAGE_TIME" ]; then
        echo "📅 最後の通信: $LAST_MESSAGE_TIME"
        echo "   5分以上通信がない場合は、エージェントの状況を確認してください。"
    fi
fi

echo ""
echo "=== よく使用するコマンド ==="
echo "📺 CEO セッションに接続:        tmux attach -t ceo"
echo "👥 チームセッションに接続:      tmux attach -t team"
echo "📋 通信ログをリアルタイム監視:  tail -f logs/communication.log"
echo "🔄 システム再起動:              tmux kill-server && ./scripts/start-team.sh"
echo ""
