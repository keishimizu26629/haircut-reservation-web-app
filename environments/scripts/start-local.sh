#!/bin/bash

# Local Development Environment Startup Script
# Firebase Emulator を使用した完全ローカル環境

set -e

echo "🚀 Starting Local Development Environment (Firebase Emulator)"
echo "================================================"

# Check if .env.local exists
if [ ! -f "environments/.env.local" ]; then
    echo "⚠️  Warning: environments/.env.local not found!"
    echo "📝 Creating from template..."
    cp environments/.env.example environments/.env.local
    echo "✅ Please edit environments/.env.local with your configuration"
fi

# Export environment variables
set -a  # Export all variables
source environments/.env.local
set +a  # Stop exporting

# Start services
echo "🔧 Starting Local Development Environment..."
cd environments
docker compose -f base.yml -f local.yml up --build -d

echo ""
echo "✅ Local Development Environment Started!"
echo "================================================"
echo "🌐 Frontend:           http://localhost:3000"
echo "🔧 Backend API:        Firebase Functions (Emulator)"
echo "🔥 Firebase Emulator:  http://localhost:4000"
echo "📊 Prometheus:         http://localhost:9090"
echo "📈 Grafana:            http://localhost:3030"
echo "================================================"
echo "🛑 To stop: cd environments && docker compose -f base.yml -f local.yml down"
echo "📋 To view logs: cd environments && docker compose -f base.yml -f local.yml logs -f"
