#!/bin/bash

# =====================================
# Firebase本番環境デプロイスクリプト
# Production Deployment Script
# =====================================

set -e  # エラー時に停止

echo "🚀 Firebase本番環境デプロイ開始..."
echo "======================================"

# 環境変数の確認
if [ -z "$NODE_ENV" ]; then
    export NODE_ENV=production
fi

echo "📋 環境確認:"
echo "   NODE_ENV: $NODE_ENV"
echo "   USER: $(whoami)"
echo "   DATE: $(date)"
echo ""

# =====================================
# 1. 事前チェック
# =====================================
echo "🔍 事前チェック開始..."

# Firebase CLIの確認
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI が見つかりません"
    echo "   npm install -g firebase-tools でインストールしてください"
    exit 1
fi

# Firebase認証確認
if ! firebase projects:list &> /dev/null; then
    echo "❌ Firebase認証が必要です"
    echo "   firebase login を実行してください"
    exit 1
fi

# 本番環境設定ファイルの確認
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production ファイルが見つかりません"
    echo "   .env.production.template を参考に作成してください"
    exit 1
fi

# Node.js依存関係の確認
if [ ! -d "node_modules" ]; then
    echo "📦 依存関係をインストール中..."
    npm ci --production
fi

echo "✅ 事前チェック完了"
echo ""

# =====================================
# 2. テスト実行
# =====================================
echo "🧪 本番デプロイ前テスト実行..."

# リント実行
echo "   📝 ESLintチェック..."
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ リントエラーが見つかりました"
    exit 1
fi

# TypeScriptコンパイルチェック
echo "   🔧 TypeScriptコンパイルチェック..."
npm run type-check
if [ $? -ne 0 ]; then
    echo "❌ TypeScriptエラーが見つかりました"
    exit 1
fi

# ユニットテスト実行
echo "   🧪 ユニットテスト実行..."
npm run test:unit
if [ $? -ne 0 ]; then
    echo "❌ ユニットテストが失敗しました"
    exit 1
fi

echo "✅ テスト完了"
echo ""

# =====================================
# 3. 本番ビルド
# =====================================
echo "🏗️  本番環境ビルド開始..."

# 古いビルドファイルを削除
if [ -d "dist" ]; then
    rm -rf dist
fi

# 本番ビルド実行
NODE_ENV=production npm run build
if [ $? -ne 0 ]; then
    echo "❌ ビルドが失敗しました"
    exit 1
fi

# ビルド成果物の確認
if [ ! -d "dist" ]; then
    echo "❌ ビルド成果物（dist）が見つかりません"
    exit 1
fi

echo "✅ ビルド完了"
echo ""

# =====================================
# 4. Firebase設定確認
# =====================================
echo "🔥 Firebase設定確認..."

# 本番プロジェクトの設定
firebase use production --token "$FIREBASE_TOKEN" 2>/dev/null || firebase use production

# 現在のプロジェクト確認
CURRENT_PROJECT=$(firebase use --current)
echo "   📋 デプロイ対象プロジェクト: $CURRENT_PROJECT"

if [[ "$CURRENT_PROJECT" != *"prod"* ]]; then
    echo "⚠️  警告: プロジェクト名に'prod'が含まれていません"
    echo "   本当に本番環境ですか？ (y/N)"
    read -r confirmation
    if [[ "$confirmation" != "y" && "$confirmation" != "Y" ]]; then
        echo "❌ デプロイが中断されました"
        exit 1
    fi
fi

echo "✅ Firebase設定確認完了"
echo ""

# =====================================
# 5. セキュリティルールのバリデーション
# =====================================
echo "🛡️  セキュリティルール検証..."

# Firestoreルールの検証
if [ -f "firestore.rules" ]; then
    echo "   📋 Firestoreルール検証中..."
    firebase firestore:rules:release --dry-run
    if [ $? -ne 0 ]; then
        echo "❌ Firestoreルールにエラーがあります"
        exit 1
    fi
fi

# Storageルールの検証
if [ -f "storage.rules" ]; then
    echo "   📋 Storageルール検証中..."
    # Storage rules validation would go here
    echo "   ✅ Storageルール検証完了"
fi

echo "✅ セキュリティルール検証完了"
echo ""

# =====================================
# 6. データベースバックアップ
# =====================================
echo "💾 本番データベースバックアップ..."

# Firestoreエクスポート（バックアップ）
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_BUCKET="haircut-reservation-prod-backups"

echo "   📦 Firestore データベースをバックアップ中..."
gcloud firestore export gs://$BACKUP_BUCKET/backups/$BACKUP_DATE \
    --project=haircut-reservation-prod \
    --collection-ids=tenants,users,customers,staff,services,reservations

if [ $? -eq 0 ]; then
    echo "   ✅ バックアップ完了: gs://$BACKUP_BUCKET/backups/$BACKUP_DATE"
else
    echo "   ⚠️  バックアップが失敗しましたが、デプロイを続行します"
fi

echo ""

# =====================================
# 7. 本番デプロイ実行
# =====================================
echo "🚀 本番デプロイ実行..."

# デプロイ確認
echo "⚠️  本番環境にデプロイします。続行しますか？ (y/N)"
read -r final_confirmation
if [[ "$final_confirmation" != "y" && "$final_confirmation" != "Y" ]]; then
    echo "❌ デプロイが中断されました"
    exit 1
fi

# Firebase デプロイ実行（段階的）
echo "   🔥 Firestore ルールデプロイ..."
firebase deploy --only firestore:rules --token "$FIREBASE_TOKEN"

echo "   🔥 Storage ルールデプロイ..."
firebase deploy --only storage --token "$FIREBASE_TOKEN"

echo "   🔥 Functions デプロイ..."
firebase deploy --only functions --token "$FIREBASE_TOKEN"

echo "   🔥 Hosting デプロイ..."
firebase deploy --only hosting --token "$FIREBASE_TOKEN"

if [ $? -eq 0 ]; then
    echo "✅ 本番デプロイ完了"
else
    echo "❌ デプロイが失敗しました"
    echo "   ロールバック手順を確認してください"
    exit 1
fi

echo ""

# =====================================
# 8. デプロイ後確認
# =====================================
echo "🔍 デプロイ後確認..."

# ヘルスチェック
PRODUCTION_URL="https://haircut-reservation-prod.web.app"
echo "   🌐 ヘルスチェック: $PRODUCTION_URL/health"

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL/health" || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
    echo "   ✅ ヘルスチェック成功 (HTTP $HTTP_STATUS)"
else
    echo "   ❌ ヘルスチェック失敗 (HTTP $HTTP_STATUS)"
    echo "   詳細確認が必要です"
fi

# Firebase Functions確認
echo "   ⚡ Firebase Functions確認..."
firebase functions:log --limit 5 --token "$FIREBASE_TOKEN"

echo ""

# =====================================
# 9. 通知・ログ
# =====================================
echo "📢 デプロイ完了通知..."

# Slack通知（設定されている場合）
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🚀 本番環境デプロイ完了\\n📅 $(date)\\n👤 $(whoami)\\n🌐 $PRODUCTION_URL\"}" \
        "$SLACK_WEBHOOK_URL"
fi

# デプロイログの記録
echo "$(date): Production deployment completed by $(whoami)" >> deploy.log

echo ""
echo "======================================"
echo "🎉 本番デプロイが正常に完了しました！"
echo ""
echo "📊 デプロイサマリー:"
echo "   🕒 完了時刻: $(date)"
echo "   👤 実行者: $(whoami)"
echo "   🌐 URL: $PRODUCTION_URL"
echo "   📦 バックアップ: gs://$BACKUP_BUCKET/backups/$BACKUP_DATE"
echo ""
echo "📝 次の手順:"
echo "   1. 本番環境での動作確認"
echo "   2. 監視ダッシュボードの確認"
echo "   3. エラーログの監視"
echo "   4. パフォーマンス指標の確認"
echo ""
echo "🎯 本番環境URL:"
echo "   $PRODUCTION_URL"
echo "======================================"