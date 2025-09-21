# Firestore Rules 同期ガイド

## 概要

開発環境と本番環境の Firestore Rules を一致させるためのガイドラインです。

## 発生した問題

- **問題**: 開発環境では正常に動作するが、本番環境で予約データが表示されない
- **原因**: `hasRequiredUserFields()`関数の`role`フィールド条件の有無
- **解決**: 本番環境のルールを開発環境と同期

## ルール同期プロセス

### 1. 定期的な同期確認

```bash
# 開発環境と本番環境のルールを比較
diff firebase-dev/firestore.rules firebase-prod/firestore.rules
```

### 2. 同期作業手順

1. 開発環境でルールをテスト
2. 本番環境にルールを適用
3. 両環境での動作確認

### 3. 重要な注意点

- **必須**: ルール変更時は両環境で同時にテスト
- **推奨**: CI/CD での自動同期を導入
- **禁止**: 本番環境でのみルール変更

## セキュリティ考慮事項

### role フィールド条件について

```javascript
function hasRequiredUserFields() {
  return (
    request.resource.data.keys().hasAll(['email', 'displayName', 'createdAt']) &&
    request.resource.data.keys().hasAny(['role'])
  ) // roleフィールドを許可
}
```

- **用途**: `users`コレクションでのユーザー登録時の role 設定
- **影響範囲**: 予約データには直接影響なし
- **セキュリティリスク**: 低（適切な使用範囲内）

## 今後の改善案

1. **CI/CD 統合**: GitHub Actions でのルール自動同期
2. **テスト自動化**: ルール変更時の自動テスト実行
3. **監視強化**: 環境間の差異検出アラート

## トラブルシューティング

### 予約データが表示されない場合

1. Firestore Rules の`hasRequiredUserFields()`を確認
2. 開発環境と本番環境のルール比較
3. 必要に応じてルール同期を実行

---

**最終更新**: 2025 年 1 月
**作成者**: AI Assistant
