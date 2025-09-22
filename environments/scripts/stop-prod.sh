#!/bin/bash

# Production Environment Stop Script
# Production Firebase Project の停止

set -e

echo "🛑 Stopping Production Environment"
echo "================================================"

# Navigate to project root
cd ../../

# Stop and remove containers
echo "🔧 Stopping Production Environment..."
docker compose -f environments/base.yml -f environments/prod.yml down

echo ""
echo "✅ Production Environment Stopped!"
echo "================================================"
echo "💡 To start again: ./environments/scripts/start-prod.sh"
echo "🗑️  To remove volumes: docker compose -f environments/base.yml -f environments/prod.yml down -v"
echo "🧹 To clean up images: docker system prune"
