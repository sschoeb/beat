#!/bin/bash

# Simple deployment script for server
# This script is executed by GitHub Actions via SSH

set -e

# Configuration from environment variables
DEPLOY_PATH="${DEPLOY_PATH:-/opt/table-match-manager}"
APP_IMAGE="${APP_IMAGE}"

echo "=== Table Match Manager Deployment ==="
echo "Deploy path: $DEPLOY_PATH"
echo "Image: $APP_IMAGE"

# Navigate to deployment directory
cd "$DEPLOY_PATH" || { echo "Failed to navigate to deploy path"; exit 1; }

# Create .env file with secrets
cat > .env << EOF
DB_ROOT_PASSWORD=${DB_ROOT_PASSWORD}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME:-table_match_db}
DB_USER=${DB_USER:-table_user}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
CORS_ORIGIN=${CORS_ORIGIN}
APP_IMAGE=${APP_IMAGE}
EOF

# Download the deployment docker-compose file if not exists
if [ ! -f "docker-compose.yml" ]; then
    echo "Downloading docker-compose.yml..."
    curl -o docker-compose.yml https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/main/docker-compose.deploy.yml
fi

# Pull the latest image
echo "Pulling Docker image..."
docker pull "$APP_IMAGE"

# Stop and remove existing containers
echo "Stopping existing containers..."
docker-compose down || true

# Start the services
echo "Starting services..."
docker-compose up -d

# Wait for services to start
sleep 5

# Check status
echo "Checking service status..."
docker-compose ps

# Clean up old images
echo "Cleaning up old images..."
docker image prune -af --filter "until=24h"

echo "Deployment completed successfully!"