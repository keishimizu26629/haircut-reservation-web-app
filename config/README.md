# Config Directory

このディレクトリには、プロジェクトの設定ファイルとテンプレートファイルが格納されています。

## 📁 ディレクトリ構成

```
config/
├── firebase/           # Firebase設定ファイル
│   ├── firebase-dev-config.json    # 開発環境設定
│   └── firebase-prod-config.json   # 本番環境設定
└── templates/          # テンプレートファイル
    ├── env.template                        # 環境変数テンプレート
    └── firebase-dev-config.template.json   # Firebase設定テンプレート
```

## 🔧 使用方法

### 環境変数ファイルの作成

```bash
# テンプレートから環境変数ファイルを作成
cp config/templates/env.template .env.dev
cp config/templates/env.template .env.prod

# 各環境に応じて設定値を編集
```

### Firebase 設定ファイル

- `firebase/firebase-dev-config.json`: 開発環境の Firebase 設定
- `firebase/firebase-prod-config.json`: 本番環境の Firebase 設定

これらのファイルは、Firebase プロジェクトの設定情報を含んでおり、各環境で適切な設定が適用されます。

## ⚠️ 注意事項

- 設定ファイルには機密情報が含まれる場合があります
- 本番環境の設定ファイルは特に注意深く管理してください
- テンプレートファイルを参考に、適切な値を設定してください
