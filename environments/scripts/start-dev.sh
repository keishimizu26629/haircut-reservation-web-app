#!/bin/bash

# Development Environment Startup Script
# Remote Firebase Development Project に接続

set -e

echo "🚀 Starting Development Environment (Remote Firebase Dev)"
echo "================================================"

# Check if .env.dev exists
if [ ! -f "../.env.dev" ]; then
    echo "❌ Error: .env.dev not found!"
    echo "📝 Please create .env.dev file with Firebase configuration"
    echo "💡 Use standardized variable names: FIREBASE_PROJECT_ID, FIREBASE_API_KEY, etc."
    exit 1
fi

# Export environment variables if file exists
if [ -f "../.env.dev" ]; then
    set -a  # Export all variables
    source ../.env.dev
    set +a  # Stop exporting
    echo "✅ Environment variables loaded from .env.dev"
else
    echo "⚠️  Using fallback environment variables"
fi

# Validate required environment variables
REQUIRED_VARS=(
    "FIREBASE_PROJECT_ID"
    "FIREBASE_API_KEY"
    "FIREBASE_AUTH_DOMAIN"
    "FIREBASE_STORAGE_BUCKET"
    "FIREBASE_MESSAGING_SENDER_ID"
    "FIREBASE_APP_ID"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: Required environment variable $var is not set"
        exit 1
    fi
done

# Stop any running containers first
echo "🛑 Stopping any existing containers..."
cd ../../
docker compose -f environments/base.yml -f environments/dev.yml down 2>/dev/null || true

# Start services
echo "🔧 Starting Development Environment..."
docker compose -f environments/base.yml -f environments/dev.yml up --build -d

echo ""
echo "✅ Development Environment Started!"
echo "================================================"
echo "🌐 Frontend:           http://localhost:3000"
echo "🔧 Backend API:        Firebase Cloud Functions"
echo "🔥 Firebase Project:   ${FIREBASE_PROJECT_ID}"
echo "📊 Prometheus:         http://localhost:9090"
echo "📈 Grafana:            http://localhost:3030"
echo "================================================"
echo "🛑 To stop: docker compose -f environments/base.yml -f environments/dev.yml down"
echo "📋 To view logs: docker compose -f environments/base.yml -f environments/dev.yml logs -f"
