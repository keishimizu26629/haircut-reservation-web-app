#!/bin/bash

# Development Environment Startup Script
# Remote Firebase Development Project に接続

set -e

echo "🚀 Starting Development Environment (Remote Firebase Dev)"
echo "================================================"

# Check if .env.dev exists
if [ ! -f "environments/.env.dev" ]; then
    echo "❌ Error: environments/.env.dev not found!"
    echo "📝 Creating from template..."
    cp environments/env.template environments/.env.dev
    echo "✅ Please edit environments/.env.dev with your Firebase Dev configuration"
    echo "💡 Use the FIREBASE_DEV_* values from the template"
fi

# Export environment variables
set -a  # Export all variables
source environments/.env.dev
set +a  # Stop exporting

# Validate required environment variables
REQUIRED_VARS=(
    "FIREBASE_DEV_PROJECT_ID"
    "FIREBASE_DEV_API_KEY"
    "FIREBASE_DEV_AUTH_DOMAIN"
    "FIREBASE_DEV_STORAGE_BUCKET"
    "FIREBASE_DEV_MESSAGING_SENDER_ID"
    "FIREBASE_DEV_APP_ID"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: Required environment variable $var is not set"
        exit 1
    fi
done

# Start services
echo "🔧 Starting Development Environment..."
cd environments
docker compose -f base.yml -f dev.yml up --build -d

echo ""
echo "✅ Development Environment Started!"
echo "================================================"
echo "🌐 Frontend:           http://localhost:3000"
echo "🔧 Backend API:        Firebase Cloud Functions"
echo "🔥 Firebase Project:   ${FIREBASE_DEV_PROJECT_ID}"
echo "📊 Prometheus:         http://localhost:9090"
echo "📈 Grafana:            http://localhost:3030"
echo "================================================"
echo "🛑 To stop: cd environments && docker compose -f base.yml -f dev.yml down"
echo "📋 To view logs: cd environments && docker compose -f base.yml -f dev.yml logs -f"
