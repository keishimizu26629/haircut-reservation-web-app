# Tests Directory

このディレクトリには、プロジェクトのテスト関連ファイルが統合されています。

## 📁 ディレクトリ構成

```
tests/
├── specs/              # 現行のPlaywrightテストケース
│   ├── auth-flow.spec.ts
│   ├── basic-e2e.spec.ts
│   ├── calendar-integration.spec.ts
│   └── ...
├── integration/        # 統合テスト
├── legacy/             # 旧テストファイル（参考用）
│   ├── browser-test.js
│   ├── e2e-login-test.js
│   └── ...
├── utils/              # テスト用ユーティリティ
│   ├── firebase-test-helpers.ts
│   ├── performance-test.js
│   └── scripts/
└── test-results/       # テスト実行結果
```

## 🧪 テストの種類

### 1. E2E テスト (specs/)

- **Playwright**を使用したエンドツーエンドテスト
- 実際のブラウザでのユーザー操作をシミュレート

### 2. 統合テスト (integration/)

- API 統合テスト
- Firebase 接続テスト

### 3. レガシーテスト (legacy/)

- 過去のテストファイル（参考用）
- 削除予定だが、参考のために残している

### 4. ユーティリティ (utils/)

- テスト用のヘルパー関数
- パフォーマンステスト
- Firebase 接続テスト

## 🚀 テスト実行

```bash
# 全テストの実行
npm run test

# E2Eテストの実行
npm run test:e2e

# 特定のテストファイル実行
npx playwright test specs/auth-flow.spec.ts

# テスト結果の確認
npx playwright show-report
```

## 📊 テスト結果

- `test-results/`: テスト実行結果が保存されます
- `playwright-report/`: Playwright の詳細レポート

## ⚠️ 注意事項

- `legacy/`フォルダのファイルは参考用です。新しいテストは`specs/`に作成してください
- Firebase 関連のテストは適切な環境設定が必要です
- テスト実行前に必要な環境変数が設定されていることを確認してください
