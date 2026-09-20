#!/bin/bash
# ══════════════════════════════════════════════════════════════
# PRODUCTION DEPLOYMENT SCRIPT
# ══════════════════════════════════════════════════════════════
# Usage: ./scripts/deploy.sh
# 
# This script orchestrates a controlled deployment using Docker Compose.
# It ensures minimal downtime by building images first, then recreating
# containers. Flyway migrations run automatically when backend starts.

set -e # Exit immediately if a command exits with a non-zero status

echo "🚀 Starting deployment of Odessi.tfi..."

# 1. Validate Environment
if [ ! -f ".env.production" ]; then
    echo "❌ Error: .env.production file not found!"
    echo "Please create it from .env.production.example"
    exit 1
fi

echo "✅ Environment validated."

# 2. Pull latest approved code (assuming git is configured correctly on VPS)
echo "📥 Pulling latest code..."
git pull origin main || echo "⚠️  Git pull failed or skipped. Continuing with local files..."

# 3. Build Docker Images
echo "🏗️  Building Docker images..."
# We build before stopping containers to minimize downtime
docker compose -f docker-compose.prod.yml build

# 4. Stop and Recreate Containers
echo "🔄 Starting/recreating containers..."
# -d runs in background, --remove-orphans cleans up old stuff
docker compose -f docker-compose.prod.yml up -d --remove-orphans

# 5. Wait and Verify Health
echo "⏳ Waiting for services to become healthy (this may take up to 60s)..."

# Give PostgreSQL and Backend time to start and run migrations
sleep 15

# Check container status
echo "📊 Current container status:"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "🎉 Deployment initiated successfully!"
echo "Flyway migrations will run automatically inside the backend container."
echo ""
echo "To monitor startup and migrations, run:"
echo "  docker compose -f docker-compose.prod.yml logs -f backend"
echo ""
echo "To check system health, ensure all containers show 'Up (healthy)'."
echo "If backend fails to start, inspect logs, restore DB if needed, and rollback code."
