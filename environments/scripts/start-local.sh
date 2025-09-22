#!/bin/bash

# Local Development Environment Startup Script
# Firebase Emulator を使用した完全ローカル環境

set -e

echo "🚀 Starting Local Development Environment (Firebase Emulator)"
echo "================================================"

# Check if .env.local exists
if [ ! -f "../.env.local" ]; then
    echo "⚠️  Warning: .env.local not found!"
    echo "📝 Creating from template..."
    cp ../env.template ../.env.local
    echo "✅ Please edit .env.local with your configuration"
fi

# Export environment variables
set -a  # Export all variables
source ../.env.local
set +a  # Stop exporting

# Stop any running containers first
echo "🛑 Stopping any existing containers..."
cd ..
docker compose -f environments/base.yml -f environments/local.yml down 2>/dev/null || true

# Start services
echo "🔧 Starting Local Development Environment..."
docker compose -f environments/base.yml -f environments/local.yml up --build -d

echo ""
echo "✅ Local Development Environment Started!"
echo "================================================"
echo "🌐 Frontend:           http://localhost:13000"
echo "🔧 Backend API:        Firebase Functions (Emulator)"
echo "🔥 Firebase Emulator:  http://localhost:18040"
echo "📊 Prometheus:         http://localhost:9090"
echo "📈 Grafana:            http://localhost:3030"
echo "================================================"
echo "🛑 To stop: docker compose -f environments/base.yml -f environments/local.yml down"
echo "📋 To view logs: docker compose -f environments/base.yml -f environments/local.yml logs -f"
