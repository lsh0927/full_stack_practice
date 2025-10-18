#!/bin/bash

# Docker Compose Restart Script
# Restarts all infrastructure services

set -e

echo "🔄 Restarting Board Project Infrastructure..."

./scripts/docker-stop.sh
sleep 2
./scripts/docker-start.sh
