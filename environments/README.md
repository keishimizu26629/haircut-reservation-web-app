# Docker Environment Management

環境別の Docker Compose 設定とスタートアップスクリプト

## 📁 Directory Structure

```
environments/
├── base.yml              # 共通設定（すべての環境で共有）
├── local.yml             # ローカル環境（Firebase Emulator使用）
├── dev.yml               # 開発環境（Remote Firebase Dev）
├── prod.yml              # 本番環境（Remote Firebase Prod）
├── .env.example          # 環境変数テンプレート
├── scripts/
│   ├── start-local.sh    # ローカル環境起動スクリプト
│   ├── start-dev.sh      # Dev環境起動スクリプト
│   └── start-prod.sh     # Prod環境起動スクリプト
└── README.md             # このファイル
```

## 🚀 Quick Start

### 1. Local Environment (Firebase Emulator)

```bash
./environments/scripts/start-local.sh
```

### 2. Development Environment (Remote Firebase Dev)

```bash
# 起動（初回は自動で環境変数ファイルが作成されます）
./environments/scripts/start-dev.sh

# 環境変数を手動で設定する場合
cp environments/env.template environments/.env.dev
vim environments/.env.dev  # FIREBASE_DEV_* 値を設定
```

### 3. Production Environment (Remote Firebase Prod)

```bash
# 起動（初回は自動で環境変数ファイルが作成されます）
./environments/scripts/start-prod.sh

# 環境変数を手動で設定する場合
cp environments/env.template environments/.env.prod
vim environments/.env.prod  # FIREBASE_PROD_* 値とセキュアなパスワードを設定
```

## 🔧 Manual Operation

### 各環境を個別に操作する場合

```bash
cd environments

# Local環境
docker compose -f local.yml up -d
docker compose -f local.yml down
docker compose -f local.yml logs -f

# Dev環境
docker compose -f dev.yml up -d
docker compose -f dev.yml down
docker compose -f dev.yml logs -f

# Prod環境
docker compose -f prod.yml up -d
docker compose -f prod.yml down
docker compose -f prod.yml logs -f
```

## 🌐 Access URLs

| Service     | Local                 | Dev/Prod                 |
| ----------- | --------------------- | ------------------------ |
| Frontend    | http://localhost:3000 | http://localhost:3000    |
| Backend API | Firebase Functions    | Firebase Cloud Functions |
| Firebase UI | http://localhost:4000 | N/A (Remote)             |
| Prometheus  | http://localhost:9090 | http://localhost:9090    |
| Grafana     | http://localhost:3030 | http://localhost:3030    |

## ⚙️ Environment Configuration

### Local Environment

- **Firebase**: Emulator Suite（完全ローカル）
- **Database**: PostgreSQL ローカルコンテナ
- **Monitoring**: Prometheus + Grafana

### Dev Environment

- **Firebase**: Remote Firebase Development Project
- **Database**: PostgreSQL 開発用データベース
- **Monitoring**: Prometheus + Grafana

### Prod Environment

- **Firebase**: Remote Firebase Production Project
- **Database**: PostgreSQL 本番データベース
- **Monitoring**: Prometheus + Grafana
- **Safety**: 起動時確認プロンプト

## 🔒 Security Notes

1. **環境変数ファイルは Git にコミットしない**

   ```bash
   # .gitignore に追加済み
   environments/.env.*
   ```

2. **本番環境の認証情報は厳重に管理**

   - JWT Secret、Database パスワードは強力なものを使用
   - Firebase Service Account は適切に設定

3. **本番環境起動時の確認**
   - `start-prod.sh` は確認プロンプトあり
   - 誤って本番環境を起動することを防止

## 🔧 Troubleshooting

### Port conflicts

```bash
# 使用中のポートを確認
lsof -i :3000
lsof -i :3001

# Docker コンテナを完全停止
docker compose -f environments/local.yml down
docker compose -f environments/dev.yml down
docker compose -f environments/prod.yml down
```

### Volume issues

```bash
# ボリュームをクリーンアップ
docker compose -f environments/local.yml down -v
docker volume prune
```

### Firebase Emulator issues

```bash
# Firebase Emulatorのデータをリセット
docker compose -f environments/local.yml down
docker volume rm haircut-reservation_firebase-data
```
