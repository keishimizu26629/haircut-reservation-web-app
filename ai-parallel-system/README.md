# AI 並列実行チームシステム - 汎用開発支援ツール

## 概要

Claude CLI を使用した tmux 並列実行環境で、5 つの AI エージェントが協調して任意のプロジェクトを実行するシステムです。開発に限らず、マーケティング、企画、分析など幅広い業務に対応可能な汎用的な開発支援ツールです。

このシステムは、任意のプロジェクトの開発を支援する AI ツールとして設計されており、プロジェクト本体から独立した開発ツール環境を提供します。

## 重要な注意事項

**このディレクトリはアプリケーション本体から独立した開発ツール用のディレクトリです。**

実際の開発作業は、このディレクトリの親ディレクトリ（プロジェクトルート）で行ってください：

- **フロントエンド**: プロジェクトルート配下の適切なディレクトリ
- **バックエンド**: プロジェクトルート配下の適切なディレクトリ
- **インフラ**: プロジェクトルート配下の適切なディレクトリ
- **テスト**: プロジェクトルート配下の適切なディレクトリ
- **その他**: プロジェクトルートの各ディレクトリ

## システム構成

- **CEO**: 戦略決定と最終承認を行う最高経営責任者
- **Manager**: プロジェクトマネージャーとしてタスク管理と依存関係を制御
- **Dev1-3**: 柔軟な役割を持つ実行エージェント（開発、マーケティング、分析など）

## 目的

- AI 並列開発システムの管理
- 開発ツールとスクリプトの管理
- プロジェクト本体から独立した開発環境の提供
- 複数の AI エージェントによる協調的なタスク実行

## ディレクトリ構成

```
ai-parallel-system/
├── README.md               # このファイル
├── CLAUDE.md              # システムの詳細仕様とガイドライン
├── instructions/          # 各エージェントの役割定義
│   ├── ceo.md            # CEO エージェントの指示書
│   ├── manager.md        # Manager エージェントの指示書
│   └── developer.md      # Developer エージェントの指示書
├── scripts/              # システム管理スクリプト
│   ├── start-team.sh     # チーム起動スクリプト
│   ├── initialize-agents.sh # エージェント初期化
│   ├── ceo-command.sh    # CEO コマンド実行
│   ├── send-message.sh   # メッセージ送信
│   └── view-all-members.sh # 全メンバー表示
└── logs/                 # 通信ログ
    └── communication.log # エージェント間通信ログ
```

## 使用方法

### 前提条件

- Claude CLI がインストールされていること
- tmux がインストールされていること
- プロジェクトルートにこのディレクトリが配置されていること

### 1. システム起動

```bash
cd ai-parallel-system
./scripts/start-team.sh
```

このコマンドにより以下が起動されます：

- `ceo` セッション（CEO エージェント用）
- `team` セッション（4 分割画面で Manager + Dev1-3 エージェント用）

### 2. CEO セッションへ接続

```bash
tmux attach -t ceo
```

### 3. チームセッションへ接続（4 分割画面）

```bash
tmux attach -t team
```

### 4. 全メンバー表示

```bash
./scripts/view-all-members.sh
```

### 5. プロジェクト依頼の実行

1. CEO セッションに接続
2. 依頼内容を入力（例：「新機能の実装」「バグ修正」「コードレビュー」など）
3. CEO が Manager を通じて各エージェントに自動的にタスクを展開
4. 各エージェントが協調して作業を実行

### 6. 画面操作

- **画面移動**: `Ctrl+B` → `↑↓←→`
- **デタッチ**: `Ctrl+B` → `d` （セッションは継続）
- **完全終了**: `tmux kill-server`

## 開発作業の進め方

### 重要：作業ディレクトリについて

**全ての開発作業は、このディレクトリ（ai-parallel-system）ではなく、プロジェクトルートディレクトリで実行してください。**

```bash
# 正しい作業場所
cd ../                    # プロジェクトルートに移動
# ここで実際の開発作業を行う

# 間違った作業場所
cd ai-parallel-system/    # ここでは開発作業を行わない
```

### 作業フロー

1. **要件定義**: CEO エージェントが要件を整理・承認
2. **タスク分解**: Manager エージェントがタスクを分解・割り当て
3. **並列実行**: Dev1-3 エージェントが協調して実装
4. **品質管理**: 各エージェントが相互レビューを実施
5. **最終承認**: CEO エージェントが最終承認

### エージェント間の協調

- エージェント間の通信は `logs/communication.log` に記録
- 依存関係のあるタスクは Manager が調整
- コンフリクトや問題は CEO が最終判断

## システム管理

### セッション確認

```bash
tmux list-sessions
```

### 特定セッションの終了

```bash
tmux kill-session -t ceo    # CEO セッションのみ終了
tmux kill-session -t team   # チームセッションのみ終了
```

### 全セッション終了

```bash
tmux kill-server
```

### ログ確認

```bash
tail -f logs/communication.log
```

## トラブルシューティング

### セッションが作成されない場合

1. Claude CLI の動作確認

```bash
claude --version
```

2. tmux の動作確認

```bash
tmux -V
```

3. 権限の確認

```bash
chmod +x scripts/*.sh
```

### セッションが途中で終了する場合

- スクリプトは Claude コマンドが失敗してもシェルが継続するよう設計されています
- 問題が続く場合は手動でセッションを再作成してください

### エージェントが応答しない・動作が止まった場合

#### 1. システム状況の確認

**セッション状況を確認**

```bash
tmux list-sessions
```

**各エージェントの画面内容を確認**

```bash
# CEO エージェントの画面確認
tmux capture-pane -t ceo -p

# Manager エージェント（team:0.0）の画面確認
tmux capture-pane -t team:0.0 -p

# Dev1 エージェント（team:0.1）の画面確認
tmux capture-pane -t team:0.1 -p

# Dev2 エージェント（team:0.2）の画面確認
tmux capture-pane -t team:0.2 -p

# Dev3 エージェント（team:0.3）の画面確認
tmux capture-pane -t team:0.3 -p
```

**通信ログを確認**

```bash
# 最新の通信状況を確認
tail -20 logs/communication.log

# リアルタイムで通信ログを監視
tail -f logs/communication.log

# 特定のエージェントのメッセージを検索
grep "dev1" logs/communication.log | tail -5
grep "dev2" logs/communication.log | tail -5
grep "dev3" logs/communication.log | tail -5
grep "manager" logs/communication.log | tail -5
```

#### 2. 完了報告が送信されない場合

**問題の診断**

```bash
# エージェントの現在の状態を確認
tmux capture-pane -t team:0.1 -p  # dev1
tmux capture-pane -t team:0.2 -p  # dev2
tmux capture-pane -t team:0.3 -p  # dev3
```

**手動での完了報告送信**

作業が完了しているのに報告されない場合：

```bash
# dev1 の完了報告を手動送信
./scripts/send-message.sh manager "【完了報告】dev1: フロントエンド作業完了しました。"

# dev2 の完了報告を手動送信
./scripts/send-message.sh manager "【完了報告】dev2: バックエンド作業完了しました。"

# dev3 の完了報告を手動送信
./scripts/send-message.sh manager "【完了報告】dev3: 品質管理作業完了しました。"
```

**エージェントセッションに直接コマンド送信**

```bash
# dev1 セッションに完了報告コマンドを送信
tmux send-keys -t team:0.1 "./scripts/send-message.sh manager \"【完了報告】作業完了\"" C-m

# dev2 セッションに完了報告コマンドを送信
tmux send-keys -t team:0.2 "./scripts/send-message.sh manager \"【完了報告】作業完了\"" C-m

# dev3 セッションに完了報告コマンドを送信
tmux send-keys -t team:0.3 "./scripts/send-message.sh manager \"【完了報告】作業完了\"" C-m
```

#### 3. エージェントが反応しない場合

**エージェントの再起動**

```bash
# 特定のエージェントを再起動（例：dev2）
tmux send-keys -t team:0.2 C-c  # 現在のプロセスを停止
tmux send-keys -t team:0.2 "claude --dangerously-skip-permissions instructions/developer.md || bash" C-m

# Manager を再起動
tmux send-keys -t team:0.0 C-c
tmux send-keys -t team:0.0 "claude --dangerously-skip-permissions instructions/manager.md || bash" C-m

# CEO を再起動
tmux send-keys -t ceo C-c
tmux send-keys -t ceo "claude --dangerously-skip-permissions instructions/ceo.md || bash" C-m
```

**緊急時のメッセージ送信**

```bash
# Manager に状況報告を要求
./scripts/send-message.sh manager "【状況確認】現在の進捗状況を報告してください。"

# 特定のエージェントに作業継続を指示
./scripts/send-message.sh dev2 "【作業継続指示】現在の作業を継続してください。完了時は必ず manager に報告してください。"

# CEO に全体状況の確認を要求
./scripts/send-message.sh ceo "【全体状況確認】プロジェクトの現在の状況を確認してください。"
```

#### 4. セキュリティエラーが表示される場合

**ディレクトリ移動エラー**

```
Error: cd to '/path/to/directory' was blocked
```

これは正常な動作です。Claude CLI のセキュリティ制限によるもので、システムの動作には影響しません。

**対処法：**

- エラーメッセージは無視して問題ありません
- エージェントは正常に動作を継続します
- 必要に応じて上記の診断コマンドで状況を確認してください

#### 5. システム全体の復旧

**完全な再起動が必要な場合**

```bash
# 全セッションを終了
tmux kill-server

# システムを再起動
./scripts/start-team.sh

# 必要に応じて作業継続の指示を送信
./scripts/send-message.sh manager "【作業再開指示】システム再起動後の作業再開をお願いします。"
```

### 診断用コマンド集

#### システム状況の一括確認

```bash
# システム全体の状況確認スクリプト（作成推奨）
cat > scripts/system-status.sh << 'EOF'
#!/bin/bash
echo "=== TMux セッション状況 ==="
tmux list-sessions

echo -e "\n=== 各エージェントの状態 ==="
echo "CEO:"
tmux capture-pane -t ceo -p | tail -3

echo -e "\nManager:"
tmux capture-pane -t team:0.0 -p | tail -3

echo -e "\nDev1:"
tmux capture-pane -t team:0.1 -p | tail -3

echo -e "\nDev2:"
tmux capture-pane -t team:0.2 -p | tail -3

echo -e "\nDev3:"
tmux capture-pane -t team:0.3 -p | tail -3

echo -e "\n=== 最新の通信ログ ==="
tail -10 logs/communication.log
EOF

chmod +x scripts/system-status.sh
```

使用方法：

```bash
./scripts/system-status.sh
```

#### 緊急時の一括メッセージ送信

```bash
# 全エージェントに状況報告を要求
./scripts/send-message.sh manager "【緊急確認】現在の状況を報告してください。"
./scripts/send-message.sh dev1 "【緊急確認】現在の状況を報告してください。"
./scripts/send-message.sh dev2 "【緊急確認】現在の状況を報告してください。"
./scripts/send-message.sh dev3 "【緊急確認】現在の状況を報告してください。"
```

### よくある問題と解決策

| 問題                     | 症状                          | 解決策                                                |
| ------------------------ | ----------------------------- | ----------------------------------------------------- |
| エージェントが無反応     | 画面が止まっている            | `tmux capture-pane` で状況確認、必要に応じて再起動    |
| 完了報告されない         | 作業完了しているが報告なし    | 手動で `send-message.sh` を使用して報告送信           |
| セキュリティエラー       | `cd` コマンドがブロックされる | 正常動作、無視して問題なし                            |
| 通信が止まる             | ログに新しい記録がない        | `system-status.sh` で全体確認、必要に応じて再起動     |
| セッションが見つからない | `can't find session` エラー   | `tmux list-sessions` で確認、`start-team.sh` で再作成 |

### 予防策

1. **定期的な状況確認**

```bash
# 30分ごとに状況確認（推奨）
watch -n 1800 './scripts/system-status.sh'
```

2. **ログの定期的な確認**

```bash
# 通信ログの監視
tail -f logs/communication.log
```

3. **バックアップの作成**

```bash
# 重要な作業前にログをバックアップ
cp logs/communication.log logs/communication.log.backup.$(date +%Y%m%d_%H%M%S)
```

## カスタマイズ

### エージェントの役割変更

`instructions/` ディレクトリ内の各 `.md` ファイルを編集することで、エージェントの役割をカスタマイズできます。

### 新しいプロジェクトでの使用

1. 新しいプロジェクトルートにこのディレクトリをコピー
2. 必要に応じて `instructions/` 内のファイルを編集
3. システムを起動して使用開始

## 注意事項

- **このディレクトリはプロジェクト本体とは独立した開発支援ツールです**
- **実際の開発作業は必ずプロジェクトルートで行ってください**
- エージェント間の通信ログは `logs/communication.log` に記録されます
- システムは汎用的に設計されており、任意のプロジェクトで使用可能です

## ライセンス

このシステムは汎用的な開発支援ツールとして設計されており、任意のプロジェクトで自由に使用できます。
