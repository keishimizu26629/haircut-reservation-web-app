# Frontend Implementation Guidelines for Claude

## 実装専用ガイドライン

このドキュメントはコード実装時の指針を定義します。

## 実装時の必須事項

### 1. ファイル構造
新しいコンポーネント作成時は以下の構造に従う：
```
components/
├── Button/
│   ├── Button.tsx          # メインコンポーネント
│   ├── Button.test.tsx     # テストファイル（必須）
│   ├── Button.stories.tsx  # Storybook（推奨）
│   └── index.ts           # エクスポート
```

### 2. コンポーネントテンプレート
```typescript
import React, { FC } from 'react';

interface Props {
  // Props定義
}

export const ComponentName: FC<Props> = ({
  // Props destructuring
}) => {
  // Hooks

  // Event handlers

  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

### 3. テスト実装
- 必ず対応するテストファイルを作成
- React Testing Libraryを使用
- ユーザーインタラクションをテスト

### 4. State管理
- ローカルstate: useState
- 複雑なstate: useReducer
- グローバルstate: Context API または Redux Toolkit

### 5. スタイリング
- CSS Modules を使用
- BEMネーミング規則に従う
- レスポンシブデザイン必須

## 実装チェックリスト
- [ ] TypeScript型定義完備
- [ ] テストファイル作成
- [ ] エラーハンドリング実装
- [ ] ローディング状態の考慮
- [ ] アクセシビリティ対応
- [ ] レスポンシブ対応