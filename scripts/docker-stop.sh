#!/bin/bash

# Docker Compose Stop Script
# Stops all infrastructure services

set -e

echo "🛑 Stopping Board Project Infrastructure..."

docker-compose down

echo ""
echo "✅ All services stopped successfully!"
echo ""
echo "💡 To remove volumes (WARNING: This will delete all data):"
echo "   docker-compose down -v"
