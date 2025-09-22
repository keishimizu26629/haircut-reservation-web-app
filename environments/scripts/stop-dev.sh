#!/bin/bash

# Development Environment Stop Script
# Remote Firebase Development Project の停止

set -e

echo "🛑 Stopping Development Environment (Remote Firebase Dev)"
echo "================================================"

# Navigate to project root
cd ../../

# Stop and remove containers
echo "🔧 Stopping Development Environment..."
docker compose -f environments/base.yml -f environments/dev.yml down

echo ""
echo "✅ Development Environment Stopped!"
echo "================================================"
echo "💡 To start again: ./environments/scripts/start-dev.sh"
echo "🗑️  To remove volumes: docker compose -f environments/base.yml -f environments/dev.yml down -v"
echo "🧹 To clean up images: docker system prune"
