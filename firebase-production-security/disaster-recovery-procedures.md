# 🆘 Firebase本番環境 災害復旧手順書

**プロジェクト**: haircut-reservation-prod  
**最終更新**: 2025年7月30日  
**緊急連絡先**: tech-lead@your-domain.com, admin@your-domain.com

---

## 📋 概要

本書は、Firebase本番環境において災害やシステム障害が発生した場合の復旧手順を定めたものです。

### 🎯 復旧目標

- **RTO (Recovery Time Objective)**: 4時間以内
- **RPO (Recovery Point Objective)**: 1時間以内  
- **サービス可用性目標**: 99.9%

---

## 🚨 緊急時連絡体制

### L1 - 監視チーム（初期対応）
- **対応時間**: 24/7
- **連絡先**: monitoring-team@your-domain.com
- **Slack**: #production-alerts
- **応答時間**: 15分以内

### L2 - エンジニアチーム（技術対応）
- **対応時間**: 平日 9:00-18:00 / 緊急時24/7
- **連絡先**: engineering-oncall@your-domain.com
- **応答時間**: 30分以内

### L3 - シニアエンジニア（エスカレーション）
- **連絡先**: senior-engineer@your-domain.com
- **応答時間**: 1時間以内

### L4 - 管理層（意思決定）
- **連絡先**: tech-lead@your-domain.com, cto@your-domain.com
- **応答時間**: 2時間以内

---

## 🔍 災害レベル分類

### レベル1: 軽微な問題
- **影響**: 一部機能の軽微な問題
- **例**: 一部ページの表示遅延、軽微なエラー
- **対応**: L1チームで対応

### レベル2: 中程度の問題  
- **影響**: 主要機能の一部影響
- **例**: 予約機能の一時的な問題、認証遅延
- **対応**: L2チームにエスカレーション

### レベル3: 重大な問題
- **影響**: サービス全体の深刻な影響
- **例**: データベース接続不可、大規模なエラー
- **対応**: L3チームにエスカレーション、緊急対応チーム召集

### レベル4: 完全停止
- **影響**: サービス完全停止、データ損失の可能性
- **例**: Firebase プロジェクト削除、大規模データ損失
- **対応**: 全チームエスカレーション、災害復旧プロトコル実行

---

## 🛠️ 復旧手順

## 1. Firestoreデータベース復旧

### 1.1 データ損失・破損からの復旧

#### **状況確認**
```bash
# 現在のFirestoreステータス確認
gcloud firestore operations list --project=haircut-reservation-prod

# データベース内容確認
firebase firestore:delete --project haircut-reservation-prod --shallow --confirm
```

#### **バックアップからの復旧**

1. **最新バックアップ確認**
```bash
# 利用可能なバックアップ一覧
gsutil ls gs://haircut-reservation-prod-backups/firestore/

# 最新バックアップの詳細確認
gsutil ls -l gs://haircut-reservation-prod-backups/firestore/[最新日付]/full/
```

2. **復旧実行**
```bash
# Firestoreインポート実行
gcloud firestore import gs://haircut-reservation-prod-backups/firestore/[バックアップ日付]/full \
    --project=haircut-reservation-prod
```

3. **復旧確認** 
```bash
# データ整合性確認
firebase firestore:rules:test --project haircut-reservation-prod
```

#### **推定復旧時間**: 30分-2時間（データ量による）

### 1.2 部分的データ復旧

#### **特定コレクションのみ復旧**
```bash
# 重要コレクション個別復旧
gcloud firestore import gs://haircut-reservation-prod-backups/firestore/[日付]/critical/tenants \
    --project=haircut-reservation-prod \
    --collection-ids=tenants

gcloud firestore import gs://haircut-reservation-prod-backups/firestore/[日付]/critical/users \
    --project=haircut-reservation-prod \
    --collection-ids=users

gcloud firestore import gs://haircut-reservation-prod-backups/firestore/[日付]/critical/reservations \
    --project=haircut-reservation-prod \
    --collection-ids=reservations
```

---

## 2. Cloud Storage復旧

### 2.1 ストレージバケット復旧

#### **状況確認**
```bash
# バケット状態確認
gsutil ls -L gs://haircut-reservation-prod.appspot.com

# バケット内容確認
gsutil ls -r gs://haircut-reservation-prod.appspot.com
```

#### **バックアップからの復旧**
```bash
# バックアップ一覧確認
gsutil ls gs://haircut-reservation-prod-backups/storage/

# ストレージ復旧実行
gsutil -m cp -r gs://haircut-reservation-prod-backups/storage/[最新日付]/* \
    gs://haircut-reservation-prod.appspot.com/
```

#### **推定復旧時間**: 15分-1時間（データ量による）

---

## 3. Firebase Authentication復旧

### 3.1 認証設定復旧

#### **設定確認**
```bash
# 現在の認証設定確認
firebase auth:export users.json --project haircut-reservation-prod
```

#### **認証プロバイダー再設定**
1. Firebase Console → Authentication → Sign-in method
2. Email/Password、Google OAuth2.0 を再有効化
3. 設定値を設定バックアップから復元

#### **ユーザーデータ復旧**
```bash
# ユーザーデータインポート（バックアップから）
firebase auth:import users-backup.json --project haircut-reservation-prod
```

---

## 4. Firebase Functions復旧

### 4.1 Functions再デプロイ

#### **ソースコード確認**
```bash
# 最新のソースコードを取得
git clone https://github.com/your-repo/haircut-reservation.git
cd haircut-reservation/backend
```

#### **Functions復旧**
```bash
# 依存関係インストール
npm ci

# 本番環境にデプロイ
firebase deploy --only functions --project haircut-reservation-prod
```

#### **推定復旧時間**: 10-30分

---

## 5. Firebase Hosting復旧

### 5.1 ホスティング復旧

#### **フロントエンド再デプロイ**
```bash
# フロントエンドビルド
cd frontend
npm ci
npm run build

# 本番環境にデプロイ
firebase deploy --only hosting --project haircut-reservation-prod
```

#### **カスタムドメイン確認**
1. Firebase Console → Hosting → カスタムドメイン
2. DNS設定確認
3. SSL証明書ステータス確認

#### **推定復旧時間**: 10-20分

---

## 6. セキュリティルール復旧

### 6.1 Firestoreルール復旧

```bash
# ルールファイル確認
cat firestore.rules

# ルールデプロイ
firebase deploy --only firestore:rules --project haircut-reservation-prod
```

### 6.2 Storageルール復旧

```bash
# ルールファイル確認
cat storage.rules

# ルールデプロイ
firebase deploy --only storage --project haircut-reservation-prod
```

---

## 🔧 完全復旧プロセス

### ステップ1: 緊急事態宣言
1. **インシデント管理者指名**
2. **緊急対応チーム召集**
3. **ステークホルダー通知**
4. **メンテナンスモード有効化**

### ステップ2: 状況評価
1. **被害範囲特定**
2. **原因分析**
3. **復旧戦略決定**
4. **復旧優先順位設定**

### ステップ3: 復旧実行
1. **インフラストラクチャ復旧**
2. **データベース復旧**
3. **アプリケーション復旧**
4. **セキュリティ設定復旧**

### ステップ4: 動作確認
1. **機能テスト実行**
2. **パフォーマンステスト**
3. **セキュリティ確認**
4. **統合テスト**

### ステップ5: サービス再開
1. **段階的トラフィック復旧**
2. **監視強化**
3. **ユーザー通知**
4. **正常稼働確認**

### ステップ6: 事後処理
1. **インシデントレポート作成**
2. **原因分析・改善策策定**
3. **手順書更新**
4. **再発防止策実装**

---

## 📊 復旧確認チェックリスト

### □ データベース復旧確認
- [ ] 全コレクションのデータ確認
- [ ] データ整合性チェック
- [ ] インデックス再構築確認
- [ ] セキュリティルール動作確認

### □ ストレージ復旧確認  
- [ ] ファイルアクセス確認
- [ ] アップロード機能テスト
- [ ] アクセス権限確認
- [ ] CDN配信確認

### □ 認証復旧確認
- [ ] ユーザーログイン機能
- [ ] 新規ユーザー登録
- [ ] パスワードリセット
- [ ] OAuth認証

### □ Functions復旧確認
- [ ] 全Functions動作確認
- [ ] APIエンドポイント確認
- [ ] 処理パフォーマンス確認
- [ ] エラーハンドリング確認

### □ ホスティング復旧確認
- [ ] ウェブサイト表示確認
- [ ] 各ページアクセス確認
- [ ] モバイル表示確認
- [ ] SSL証明書確認

### □ 総合動作確認
- [ ] エンドツーエンドテスト
- [ ] 予約フロー完全テスト
- [ ] 管理機能テスト
- [ ] パフォーマンステスト

---

## 🚨 緊急時コマンド集

### 緊急停止
```bash
# メンテナンスモード有効化
firebase hosting:disable --project haircut-reservation-prod
```

### 緊急バックアップ
```bash
# 緊急バックアップ実行
./backup-system.sh full
```

### 状態確認
```bash
# プロジェクト全体状態確認
gcloud projects describe haircut-reservation-prod
firebase projects:list | grep haircut-reservation-prod
```

### ログ確認
```bash
# エラーログ確認
gcloud logging read "resource.type=cloud_function" --project haircut-reservation-prod --limit=50
```

---

## 📞 外部サービス連絡先

### Google Cloud Support
- **電話**: [Google Cloud サポート番号]
- **サポートケース**: [Google Cloud Console]

### Firebase Support  
- **ドキュメント**: https://firebase.google.com/support
- **コミュニティ**: Firebase Community

### 第三者サービス
- **CDN**: CloudFlare サポート
- **メール**: SendGrid サポート
- **決済**: Stripe サポート

---

## 📝 復旧後の事後対応

### 1. インシデントレポート作成
- 発生時刻・期間
- 原因分析
- 影響範囲
- 対応経過
- 学んだ教訓

### 2. 改善策の実装
- 技術的改善
- プロセス改善  
- 監視強化
- 訓練計画

### 3. ステークホルダー報告
- 経営陣報告
- 顧客説明
- 再発防止宣言

---

## 🔄 定期訓練スケジュール

### 月次訓練
- **バックアップ復旧テスト**
- **部分復旧シミュレーション**

### 四半期訓練
- **完全復旧シミュレーション**
- **チーム対応訓練**

### 年次訓練
- **災害復旧総合演習**
- **手順書見直し**

---

## 📚 参考資料

### Firebase公式ドキュメント
- [Firebase バックアップ・復元](https://firebase.google.com/docs/firestore/manage-data/export-import)
- [Firebase セキュリティ](https://firebase.google.com/docs/rules)

### 社内ドキュメント
- `firebase-production-setup.md`
- `production-monitoring.json`
- `backup-system.sh`

---

**🚨 緊急時はこの手順書に従って迅速に対応してください**

**最終更新者**: dev2 (Firebase本番環境構築担当)  
**承認者**: Manager, CEO