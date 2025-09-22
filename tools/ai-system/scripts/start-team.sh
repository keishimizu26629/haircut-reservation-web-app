#!/bin/bash

# 現在のディレクトリを取得
CURRENT_DIR=$(pwd)

# 既存のセッションをクリーンアップ
tmux kill-session -t ceo 2>/dev/null
tmux kill-session -t team 2>/dev/null

# CEOセッション（単独画面）
tmux new-session -d -s ceo -c "$CURRENT_DIR"
tmux send-keys -t ceo "claude --dangerously-skip-permissions instructions/ceo.md || bash" C-m

# チームセッション（4分割）
tmux new-session -d -s team -c "$CURRENT_DIR"

# 2x2のグリッド作成
tmux split-window -h -t team
tmux split-window -v -t team:0.0
tmux split-window -v -t team:0.1

# 各画面に移動してClaude起動（対応するmdファイル指定）
# team:0.0 = manager
tmux send-keys -t team:0.0 "claude --dangerously-skip-permissions instructions/manager.md || bash" C-m

# team:0.1 = dev1
tmux send-keys -t team:0.1 "claude --dangerously-skip-permissions instructions/developer.md || bash" C-m

# team:0.2 = dev2
tmux send-keys -t team:0.2 "claude --dangerously-skip-permissions instructions/developer.md || bash" C-m

# team:0.3 = dev3
tmux send-keys -t team:0.3 "claude --dangerously-skip-permissions instructions/developer.md || bash" C-m

echo "AI並列開発システムを起動しました！"
echo ""
echo "使い方："
echo "・CEO画面に接続: tmux attach -t ceo"
echo "・チーム画面に接続: tmux attach -t team"
echo "・全メンバー表示: ./scripts/view-all-members.sh"
echo ""
echo "画面操作："
echo "・Ctrl+B → ↑↓←→で画面移動"
echo "・Ctrl+B → dでデタッチ（終了ではない）"
echo "・tmux kill-server で完全終了"
echo ""
echo "注意："
echo "・セキュリティ制限によりディレクトリ移動エラーが表示される場合がありますが、正常動作です"
echo "・エージェント間の通信は logs/communication.log で確認できます"
