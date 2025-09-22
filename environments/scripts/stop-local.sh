#!/bin/bash

# Local Environment Stop Script
# Local Firebase Emulator の停止

set -e

echo "🛑 Stopping Local Environment (Firebase Emulator)"
echo "================================================"

# Navigate to project root
cd ../../

# Stop and remove containers
echo "🔧 Stopping Local Environment..."
docker compose -f environments/base.yml -f environments/local.yml down

echo ""
echo "✅ Local Environment Stopped!"
echo "================================================"
echo "💡 To start again: ./environments/scripts/start-local.sh"
echo "🗑️  To remove volumes: docker compose -f environments/base.yml -f environments/local.yml down -v"
echo "🧹 To clean up images: docker system prune"
