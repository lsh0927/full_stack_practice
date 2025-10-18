#!/bin/bash

# Docker Compose Logs Script
# View logs from all services or a specific service

set -e

if [ -z "$1" ]; then
    echo "📋 Viewing logs from all services..."
    echo "💡 Tip: Use './scripts/docker-logs.sh <service-name>' to view specific service logs"
    echo "   Available services: postgres, redis, mongodb, rabbitmq"
    echo ""
    docker-compose logs -f
else
    echo "📋 Viewing logs from $1..."
    docker-compose logs -f "$1"
fi
