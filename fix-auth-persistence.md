# Firebase Authentication セッション永続化修正レポート

## 問題の概要

Docker 環境で Firebase Authentication のセッションが再起動時に切れる問題を修正しました。

## 実施した修正内容

### 1. Firebase 初期化時の永続化設定強化

- `frontend/app/plugins/firebase.client.ts`
  - `setPersistence(auth, browserLocalPersistence)`を明示的に設定
  - Docker 環境での認証永続化を確実にする

### 2. ログイン時の永続化確認

- `frontend/app/pages/login.vue`
  - ログイン処理時に永続化設定を再確認
  - セッション情報の確実な保存を保証

### 3. AuthStore の永続化強化

- `frontend/app/stores/auth.ts`
  - 認証状態確認時の永続化設定追加
  - セッション活動記録の自動更新

### 4. Docker Compose 設定改善

- `docker-compose.yml`
  - ブラウザデータ永続化用ボリューム追加
  - `browser-data`ボリュームで localStorage データを保持

### 5. 認証永続化専用プラグイン追加

- `frontend/app/plugins/auth-persistence.client.ts`
  - 認証状態の変更監視と永続化
  - セッション情報の localStorage 管理

## 修正のポイント

### Firebase Auth 永続化の仕組み

1. **browserLocalPersistence**: ブラウザの localStorage に認証情報を永続化
2. **明示的設定**: Docker 環境では自動設定が不安定なため明示的に設定
3. **複数箇所での確認**: 初期化、ログイン、状態確認の各段階で永続化を確認

### Docker 環境対応

1. **ボリュームマウント**: ブラウザデータの永続化
2. **環境変数**: エミュレータ環境では永続化設定をスキップ
3. **タイミング調整**: 初期化完了を待ってから永続化設定

## 期待される効果

- Docker 再起動後もログイン状態が維持される
- セッション情報が確実に localStorage に保存される
- 認証状態の復元が確実に行われる

## 適用方法

1. `docker compose down`でコンテナを停止
2. `docker compose up -d`で再起動
3. ログイン後、コンテナ再起動でセッション維持を確認

## テスト手順

1. アプリケーションにログイン
2. `docker compose restart app`でアプリコンテナのみ再起動
3. ブラウザをリロードしてログイン状態が維持されることを確認
