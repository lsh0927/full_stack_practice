#!/bin/bash

# Docker Compose Start Script
# Starts all infrastructure services defined in docker-compose.yml

set -e

echo "🚀 Starting Board Project Infrastructure..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Start all services
echo "📦 Starting services: PostgreSQL, Redis, MongoDB, RabbitMQ..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Check service health
echo ""
echo "🔍 Checking service status..."
docker-compose ps

echo ""
echo "✅ Infrastructure services started successfully!"
echo ""
echo "📊 Service URLs:"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"
echo "  - MongoDB: localhost:27017"
echo "  - RabbitMQ AMQP: localhost:5672"
echo "  - RabbitMQ Management: http://localhost:15672"
echo "    (username: rabbitmq_user, password: rabbitmq_password)"
echo ""
echo "💡 To view logs: docker-compose logs -f"
echo "💡 To stop services: ./scripts/docker-stop.sh"
