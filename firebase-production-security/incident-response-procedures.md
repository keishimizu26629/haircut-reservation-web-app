# 🚨 Firebase本番環境 インシデント対応手順書

**プロジェクト**: haircut-reservation-prod  
**最終更新**: 2025年7月30日  
**緊急連絡先**: tech-lead@your-domain.com

---

## 📋 概要

本書は、Firebase本番環境でインシデントが発生した場合の対応手順を定めたものです。

### 🎯 インシデント対応目標

- **初期対応時間**: 15分以内
- **状況把握完了**: 30分以内
- **復旧開始**: 1時間以内
- **完全復旧**: 4時間以内

---

## 🚨 インシデント分類

### P0 - 最高優先度（Critical）
- **影響**: サービス完全停止
- **例**: 全ユーザーアクセス不可、データ損失
- **対応**: 即座に全チーム召集

### P1 - 高優先度（High）
- **影響**: 主要機能停止
- **例**: 予約機能停止、認証障害
- **対応**: 1時間以内に対応開始

### P2 - 中優先度（Medium）
- **影響**: 一部機能に影響
- **例**: 一部ページ表示不具合、軽微な性能問題
- **対応**: 4時間以内に対応開始

### P3 - 低優先度（Low）
- **影響**: 軽微な問題
- **例**: 表示の乱れ、非重要機能の問題
- **対応**: 営業時間内に対応

---

## 📞 エスカレーション体制

### L1 - 監視チーム（初期対応）
- **役割**: インシデント検知・初期トリアージ
- **連絡先**: monitoring-team@your-domain.com
- **Slack**: #production-alerts
- **対応時間**: 24/7
- **応答時間**: 15分以内

### L2 - エンジニアチーム（技術対応）
- **役割**: 技術的な問題解決・復旧作業
- **連絡先**: engineering-oncall@your-domain.com
- **対応時間**: 平日 9:00-18:00 / 緊急時24/7
- **応答時間**: 30分以内

### L3 - シニアエンジニア（上級対応）
- **役割**: 複雑な技術問題・アーキテクチャ判断
- **連絡先**: senior-engineer@your-domain.com
- **応答時間**: 1時間以内

### L4 - 管理層（意思決定）
- **役割**: 事業判断・外部コミュニケーション
- **連絡先**: tech-lead@your-domain.com, cto@your-domain.com
- **応答時間**: 2時間以内

---

## 🔄 インシデント対応プロセス

## フェーズ1: 検知・通知 (0-15分)

### 1.1 インシデント検知
- **監視システム**: 自動アラート
- **ユーザー報告**: サポート経由
- **内部発見**: チーム報告

### 1.2 初期対応
```bash
# インシデント確認スクリプト実行
./monitoring-scripts.sh health

# 緊急時状況確認
curl -I https://haircut-reservation-prod.web.app/health
```

### 1.3 インシデント宣言
- **インシデント管理者**: L1チームリーダーが指名
- **War Room**: Slack #incident-response チャンネル作成
- **初期通知**: 関係者への第一報

---

## フェーズ2: 評価・分類 (15-30分)

### 2.1 影響範囲調査
```bash
# システム全体ステータス確認
./monitoring-scripts.sh full

# 詳細ログ確認
gcloud logging read "severity>=ERROR" --project=haircut-reservation-prod --limit=50
```

### 2.2 優先度決定
- **P0/P1**: 即座にL2チームにエスカレーション
- **P2/P3**: 営業時間内対応にスケジュール

### 2.3 対応チーム編成
- **インシデント指揮官**: L2リーダー
- **技術対応**: L2エンジニア
- **コミュニケーション**: L1担当
- **記録係**: 自動ログ + 手動記録

---

## フェーズ3: 復旧作業 (30分-4時間)

### 3.1 緊急対応
```bash
# メンテナンスモード有効化（必要時）
firebase hosting:disable --project haircut-reservation-prod

# トラフィック制限（必要時）
# Load Balancer設定変更など
```

### 3.2 根本原因調査
- **ログ分析**: エラーログ・アクセスログ
- **メトリクス確認**: パフォーマンス・使用量
- **インフラ確認**: Firebase サービス状況

### 3.3 修正実装
- **コード修正**: バグ修正・設定変更
- **データ修正**: データ不整合修正
- **インフラ修正**: 設定変更・スケール調整

### 3.4 復旧手順実行
```bash
# 修正版デプロイ
firebase deploy --project haircut-reservation-prod

# データベース修正（必要時）
# 災害復旧手順参照

# サービス復旧確認
./monitoring-scripts.sh health
```

---

## フェーズ4: 確認・終了 (復旧後30分-1時間)

### 4.1 動作確認
- **機能テスト**: 主要機能の動作確認
- **パフォーマンステスト**: 応答時間・スループット
- **セキュリティ確認**: 認証・認可の動作

### 4.2 監視強化
- **メトリクス監視**: 通常レベルへの回復確認
- **エラーログ監視**: 異常なエラーが発生していないか
- **ユーザー影響確認**: 実際のユーザー体験

### 4.3 インシデント終了宣言
- **復旧完了通知**: 全関係者への通知
- **メンテナンスモード解除**: 通常運用に復帰
- **War Room解散**: インシデント対応チーム解散

---

## 📊 インシデント種別対応手順

## 🔥 Firebase サービス障害

### Firestore 接続不可
```bash
# 1. 状況確認
gcloud firestore databases describe --database="(default)" --project=haircut-reservation-prod

# 2. Firebase Status確認
curl -s https://status.firebase.google.com/

# 3. 代替手段（必要時）
# - 読み取り専用モードに切り替え
# - キャッシュデータの活用
```

### Authentication 障害
```bash
# 1. 認証状況確認
firebase auth:export auth-status.json --project haircut-reservation-prod

# 2. プロバイダー確認
# Firebase Console > Authentication > Sign-in method

# 3. 復旧手順
# - 認証プロバイダー設定確認
# - カスタムトークン発行（緊急時）
```

### Functions 実行エラー
```bash
# 1. Functions状況確認
gcloud functions list --project haircut-reservation-prod

# 2. ログ確認
firebase functions:log --project haircut-reservation-prod --limit=100

# 3. 復旧手順
firebase deploy --only functions --project haircut-reservation-prod
```

---

## 🌐 ネットワーク・パフォーマンス問題

### 応答速度低下
```bash
# 1. パフォーマンス測定
./monitoring-scripts.sh performance

# 2. リソース使用量確認
./monitoring-scripts.sh usage

# 3. 対応手順
# - CDN設定確認
# - 画像最適化
# - キャッシュ設定調整
```

### 大量トラフィック対応
```bash
# 1. トラフィック状況確認
gcloud monitoring metrics list --project=haircut-reservation-prod

# 2. 緊急対応
# - レート制限強化
# - 非重要機能の一時停止
# - スケールアップ
```

---

## 🔒 セキュリティインシデント

### 不正アクセス検知
```bash
# 1. アクセスログ分析
./monitoring-scripts.sh security

# 2. 緊急対応
# - 不審なIPのブロック
# - 影響を受けたアカウントの無効化
# - セキュリティルールの強化
```

### データ漏洩疑い
```bash
# 1. 緊急対応
# - 該当サービスの即座停止
# - ログの保全
# - 関係者への緊急通知

# 2. 調査・対応
# - アクセスログの詳細分析
# - 影響範囲の特定
# - 法的要件の確認
```

---

## 💾 データ関連インシデント

### データ損失・破損
```bash
# 1. 即座の対応
# - 書き込み操作の停止
# - 現在の状態の保存

# 2. 復旧作業
# 災害復旧手順書参照
./backup-system.sh verify
```

### データ不整合
```bash
# 1. 不整合範囲の特定
# データ整合性チェックスクリプト実行

# 2. 修正手順
# - バックアップからの部分復旧
# - データ同期スクリプト実行
```

---

## 📋 インシデント記録テンプレート

### インシデント情報
```
インシデントID: INC-YYYY-MM-DD-NNN
発生日時: YYYY-MM-DD HH:MM:SS JST
検知方法: [監視システム/ユーザー報告/内部発見]
優先度: [P0/P1/P2/P3]
影響範囲: [全サービス/特定機能/一部ユーザー]
```

### タイムライン
```
HH:MM - インシデント検知
HH:MM - 初期対応開始
HH:MM - エスカレーション
HH:MM - 根本原因特定
HH:MM - 修正実装開始
HH:MM - 復旧完了
HH:MM - インシデント終了宣言
```

### 影響・損失
```
影響ユーザー数: N人
サービス停止時間: N時間N分
売上影響: N円
```

### 根本原因
```
技術的原因:
プロセス的原因:
人的原因:
```

### 対応内容
```
即座対応:
根本修正:
再発防止策:
```

---

## 🛠️ 事後対応（Post-Incident）

### 1. インシデントレポート作成 (24時間以内)
- **概要**: インシデントの全体像
- **タイムライン**: 詳細な対応経過
- **根本原因分析**: 5 Why分析
- **影響評価**: ビジネス・技術への影響
- **学んだ教訓**: 改善点・良かった点

### 2. 改善アクション計画 (1週間以内)
- **技術的改善**: システム改善・監視強化
- **プロセス改善**: 手順書更新・訓練計画
- **予防策**: 再発防止・類似問題対策

### 3. ステークホルダー報告
- **経営陣**: 事業への影響・改善計画
- **顧客**: 障害説明・再発防止宣言
- **チーム**: 学んだ教訳・改善計画

### 4. フォローアップ
- **改善実装**: アクション計画の実行
- **効果測定**: 改善効果の確認
- **手順書更新**: 今回の経験を反映

---

## 📞 緊急連絡先一覧

### 内部連絡先
- **L1監視チーム**: monitoring-team@your-domain.com
- **L2エンジニア**: engineering-oncall@your-domain.com  
- **L3シニア**: senior-engineer@your-domain.com
- **L4管理層**: tech-lead@your-domain.com

### 外部連絡先
- **Google Cloud Support**: [サポート番号]
- **Firebase Support**: [Firebase Community]
- **CDN Provider**: [プロバイダー連絡先]
- **Payment Service**: [決済サービス連絡先]

### Slack チャンネル
- **#production-alerts**: 自動アラート
- **#incident-response**: インシデント対応専用
- **#general**: 一般通知

---

## 🔧 対応ツール・リソース

### 監視・ログツール
- **Firebase Console**: https://console.firebase.google.com
- **Google Cloud Console**: https://console.cloud.google.com
- **監視スクリプト**: `./monitoring-scripts.sh`

### 復旧ツール
- **バックアップスクリプト**: `./backup-system.sh`
- **災害復旧手順**: `disaster-recovery-procedures.md`
- **デプロイスクリプト**: `./deploy-production.sh`

### コミュニケーションツール
- **Slack**: チーム内コミュニケーション
- **メール**: 正式通知
- **ステータスページ**: ユーザー向け状況報告

---

**🚨 インシデント発生時は冷静に、この手順に従って対応してください**

**最終更新者**: dev2 (セキュリティルール・監視システム担当)  
**承認者**: Manager, CEO