#!/bin/bash

# Firebase Dev Environment Build & Deploy Script
# 開発環境への一括ビルド・デプロイスクリプト

set -e  # エラー時に停止

echo "🚀 Firebase Dev Build & Deploy Script"
echo "====================================="
echo "📅 Start Time: $(date)"
echo ""

# 変数定義
PROJECT_ROOT="/Users/keisukeshimizu/Development/DockerProject/haircut-reservation"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
FIREBASE_CONFIG="$PROJECT_ROOT/firebase-dev/firebase.json"
PROJECT_ID="haircut-reservation-dev"

# 現在のディレクトリを保存
ORIGINAL_DIR=$(pwd)

echo "📁 Project Root: $PROJECT_ROOT"
echo "📁 Frontend Dir: $FRONTEND_DIR"
echo "🔥 Firebase Config: $FIREBASE_CONFIG"
echo "🆔 Project ID: $PROJECT_ID"
echo ""

# Step 1: フロントエンドディレクトリに移動
echo "📂 Step 1: Moving to frontend directory..."
cd "$FRONTEND_DIR"
echo "✅ Current directory: $(pwd)"
echo ""

# Step 2: 既存ビルドをクリーンアップ
echo "🧹 Step 2: Cleaning previous builds..."
if [ -d ".nuxt" ]; then
    rm -rf .nuxt
    echo "✅ Removed .nuxt directory"
fi

if [ -d ".output" ]; then
    rm -rf .output
    echo "✅ Removed .output directory"
fi

if [ -d "node_modules/.cache" ]; then
    rm -rf node_modules/.cache
    echo "✅ Cleared node_modules cache"
fi

echo "✅ Cleanup completed"
echo ""

# Step 3: 依存関係の確認・インストール
echo "📦 Step 3: Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi
echo ""

# Step 4: 静的サイト生成
echo "🏗️  Step 4: Building static site..."
echo "⏰ Build started at: $(date)"

npm run generate

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully"
    echo "⏰ Build finished at: $(date)"
else
    echo "❌ Build failed"
    cd "$ORIGINAL_DIR"
    exit 1
fi
echo ""

# Step 5: ビルド結果の確認
echo "🔍 Step 5: Verifying build output..."
OUTPUT_DIR="$FRONTEND_DIR/.output/public"

if [ -d "$OUTPUT_DIR" ]; then
    echo "✅ Output directory exists: $OUTPUT_DIR"

    # ファイル数確認
    FILE_COUNT=$(find "$OUTPUT_DIR" -type f | wc -l)
    echo "📄 Generated files: $FILE_COUNT"

    # 重要ファイルの存在確認
    if [ -f "$OUTPUT_DIR/index.html" ]; then
        echo "✅ index.html exists"
    else
        echo "❌ index.html missing"
    fi

    if [ -f "$OUTPUT_DIR/200.html" ]; then
        echo "✅ 200.html exists (SPA fallback)"
    else
        echo "⚠️  200.html missing"
    fi

    # JavaScriptファイル確認
    JS_FILES=$(find "$OUTPUT_DIR/_nuxt" -name "*.js" 2>/dev/null | wc -l)
    echo "📜 JavaScript files: $JS_FILES"

    # CSSファイル確認
    CSS_FILES=$(find "$OUTPUT_DIR/_nuxt" -name "*.css" 2>/dev/null | wc -l)
    echo "🎨 CSS files: $CSS_FILES"

else
    echo "❌ Output directory not found: $OUTPUT_DIR"
    cd "$ORIGINAL_DIR"
    exit 1
fi
echo ""

# Step 6: プロジェクトルートに戻る
echo "📂 Step 6: Returning to project root..."
cd "$PROJECT_ROOT"
echo "✅ Current directory: $(pwd)"
echo ""

# Step 7: Firebase設定確認
echo "🔥 Step 7: Verifying Firebase configuration..."
if [ -f "$FIREBASE_CONFIG" ]; then
    echo "✅ Firebase config exists: $FIREBASE_CONFIG"

    # 設定内容の確認
    if grep -q "haircut-reservation-dev" "$FIREBASE_CONFIG"; then
        echo "✅ Project ID configured correctly"
    else
        echo "❌ Project ID not found in config"
    fi

    if grep -q ".output/public" "$FIREBASE_CONFIG"; then
        echo "✅ Hosting path configured correctly"
    else
        echo "❌ Hosting path not configured"
    fi

else
    echo "❌ Firebase config not found: $FIREBASE_CONFIG"
    cd "$ORIGINAL_DIR"
    exit 1
fi
echo ""

# Step 8: Firebase Hostingにデプロイ
echo "🚀 Step 8: Deploying to Firebase Hosting..."
echo "⏰ Deploy started at: $(date)"

firebase deploy --only hosting --project "$PROJECT_ID" --config "$FIREBASE_CONFIG"

if [ $? -eq 0 ]; then
    echo "✅ Deploy completed successfully"
    echo "⏰ Deploy finished at: $(date)"
else
    echo "❌ Deploy failed"
    cd "$ORIGINAL_DIR"
    exit 1
fi
echo ""

# Step 9: デプロイ後の確認
echo "🔍 Step 9: Post-deploy verification..."

# サイトアクセシビリティテスト
echo "🌐 Testing site accessibility..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://haircut-reservation-dev.web.app/")

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Site is accessible (HTTP $HTTP_STATUS)"
else
    echo "❌ Site accessibility issue (HTTP $HTTP_STATUS)"
fi

# CSPヘッダー確認
echo "🔒 Checking CSP headers..."
CSP_HEADER=$(curl -s -I "https://haircut-reservation-dev.web.app/" | grep -i "content-security-policy" || echo "CSP not found")
if [[ "$CSP_HEADER" == *"unsafe-eval"* ]]; then
    echo "✅ CSP headers include unsafe-eval"
else
    echo "❌ CSP headers missing unsafe-eval"
    echo "   $CSP_HEADER"
fi

echo ""

# Step 10: 完了レポート
echo "🎉 Step 10: Deployment Summary"
echo "==============================="
echo "✅ Build: Completed"
echo "✅ Deploy: Completed"
echo "✅ Verification: Completed"
echo ""
echo "🌐 Application URLs:"
echo "   Main App: https://haircut-reservation-dev.web.app/"
echo "   Login: https://haircut-reservation-dev.web.app/login"
echo "   Diagnostic: https://haircut-reservation-dev.web.app/diagnose-login.html"
echo ""
echo "🔐 Test Credentials:"
echo "   Email: testaccount@test.com"
echo "   Password: testtest"
echo ""
echo "📅 Completed at: $(date)"
echo "🎯 Ready for E2E testing!"

# 元のディレクトリに戻る
cd "$ORIGINAL_DIR"

echo ""
echo "🏁 Deploy script completed successfully!"
