#!/bin/bash

# Docker Compose Clean Script
# Removes all containers, volumes, and networks (WARNING: Deletes all data!)

set -e

echo "⚠️  WARNING: This will remove all containers, volumes, and networks!"
echo "⚠️  All database data will be permanently deleted!"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Aborted."
    exit 0
fi

echo ""
echo "🧹 Cleaning up Docker resources..."

# Stop and remove containers, volumes, and networks
docker-compose down -v --remove-orphans

echo ""
echo "✅ Cleanup completed!"
echo ""
echo "💡 To start fresh: ./scripts/docker-start.sh"
