#!/bin/bash

# Production Environment Startup Script
# Remote Firebase Production Project に接続

set -e

echo "🚀 Starting Production Environment (Remote Firebase Prod)"
echo "================================================"

# Check if .env.prod exists
if [ ! -f "../.env.prod" ]; then
    echo "❌ Error: .env.prod not found!"
    echo "📝 Creating from template..."
    cp ../env.template ../.env.prod
    echo "✅ Please edit .env.prod with your Firebase Production configuration"
    echo "💡 Use the FIREBASE_PROD_* values from the template and set secure passwords"
fi

# Export environment variables
set -a  # Export all variables
source ../.env.prod
set +a  # Stop exporting

# Validate required environment variables
REQUIRED_VARS=(
    "FIREBASE_PROD_PROJECT_ID"
    "FIREBASE_PROD_API_KEY"
    "FIREBASE_PROD_AUTH_DOMAIN"
    "FIREBASE_PROD_STORAGE_BUCKET"
    "FIREBASE_PROD_MESSAGING_SENDER_ID"
    "FIREBASE_PROD_APP_ID"
    "GRAFANA_ADMIN_PASSWORD_PROD"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: Required environment variable $var is not set"
        exit 1
    fi
done

# Production safety check
echo "⚠️  WARNING: Starting PRODUCTION environment!"
echo "🔐 This will connect to LIVE Firebase Production services"
echo "💾 This will use PRODUCTION database"
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Production startup cancelled"
    exit 1
fi

# Start services
echo "🔧 Starting Production Environment..."
cd ..
docker compose -f base.yml -f prod.yml up --build -d

echo ""
echo "✅ Production Environment Started!"
echo "================================================"
echo "🌐 Frontend:           http://localhost:3000"
echo "🔧 Backend API:        Firebase Cloud Functions"
echo "🔥 Firebase Project:   ${FIREBASE_PROD_PROJECT_ID}"
echo "📊 Prometheus:         http://localhost:9090"
echo "📈 Grafana:            http://localhost:3030"
echo "================================================"
echo "🛑 To stop: cd environments && docker compose -f base.yml -f prod.yml down"
echo "📋 To view logs: cd environments && docker compose -f base.yml -f prod.yml logs -f"
