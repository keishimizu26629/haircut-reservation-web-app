#!/bin/bash

# Development Environment Startup Script
# Remote Firebase Development Project に接続

set -e

echo "🚀 Starting Development Environment (Remote Firebase Dev)"
echo "================================================"

# Check if .env.dev exists
if [ ! -f "../.env.dev" ]; then
    echo "❌ Error: .env.dev not found!"
    echo "📝 Creating from template..."
    if [ -f "../env.template" ]; then
        cp ../env.template ../.env.dev
        echo "✅ Created .env.dev from template"
    else
        echo "⚠️  Template not found, using fallback configuration"
    fi
    echo "💡 Using FIREBASE_DEV_* values from template"
    echo ""
    echo "⚠️  Using fallback Firebase configuration for now..."
    echo "🔧 Firebase Project: haircut-reservation-dev (fallback)"
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
echo "🔥 Firebase Project:   ${FIREBASE_DEV_PROJECT_ID}"
echo "📊 Prometheus:         http://localhost:9090"
echo "📈 Grafana:            http://localhost:3030"
echo "================================================"
echo "🛑 To stop: docker compose -f environments/base.yml -f environments/dev.yml down"
echo "📋 To view logs: docker compose -f environments/base.yml -f environments/dev.yml logs -f"
