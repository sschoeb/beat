#!/bin/bash

# Deploy script for table-match-manager
# This script should be placed on the server and executed by the CI/CD pipeline

set -e

# Configuration
DEPLOY_PATH="${DEPLOY_PATH:-/opt/table-match-manager}"
BACKUP_PATH="${BACKUP_PATH:-/opt/table-match-manager/backups}"
LOG_FILE="${LOG_FILE:-/var/log/table-match-deploy.log}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as root or with sudo
if [[ $EUID -ne 0 ]]; then
   error "This script must be run as root or with sudo"
fi

log "Starting deployment process..."

# Navigate to deployment directory
if [ ! -d "$DEPLOY_PATH" ]; then
    log "Creating deployment directory: $DEPLOY_PATH"
    mkdir -p "$DEPLOY_PATH"
fi

cd "$DEPLOY_PATH" || error "Failed to navigate to deployment directory"

# Create backup directory if it doesn't exist
if [ ! -d "$BACKUP_PATH" ]; then
    log "Creating backup directory: $BACKUP_PATH"
    mkdir -p "$BACKUP_PATH"
fi

# Backup current database if containers are running
if docker-compose ps | grep -q "mysql"; then
    log "Backing up current database..."
    docker-compose exec -T mysql mysqldump -u root -p"${DB_ROOT_PASSWORD}" "${DB_NAME:-table_match_db}" > \
        "$BACKUP_PATH/backup_pre_deploy_$(date +%Y%m%d_%H%M%S).sql" 2>/dev/null || \
        warning "Database backup failed, continuing deployment..."
fi

# Pull the latest image
log "Pulling latest Docker image: ${APP_IMAGE}"
docker pull "${APP_IMAGE}" || error "Failed to pull Docker image"

# Stop existing containers
log "Stopping existing containers..."
docker-compose down --remove-orphans || warning "No existing containers to stop"

# Copy the deployment docker-compose file if it exists
if [ -f "docker-compose.deploy.yml" ]; then
    log "Using deployment-specific docker-compose file"
    cp docker-compose.deploy.yml docker-compose.yml
fi

# Start new containers
log "Starting new containers..."
docker-compose up -d || error "Failed to start containers"

# Wait for services to be healthy
log "Waiting for services to be healthy..."
sleep 10

# Check container status
log "Checking container status..."
docker-compose ps

# Verify application is running
log "Verifying application health..."
if curl -f -s -o /dev/null -w "%{http_code}" http://localhost/api/health | grep -q "200"; then
    log "Application is healthy and responding"
else
    warning "Application health check failed, but deployment continues"
fi

# Clean up old images
log "Cleaning up old Docker images..."
docker image prune -af --filter "until=72h" || warning "Failed to clean up old images"

# Clean up old backups (keep last 30 days)
log "Cleaning up old backups..."
find "$BACKUP_PATH" -name "*.sql" -mtime +30 -delete || warning "Failed to clean up old backups"

# Set proper permissions
log "Setting proper permissions..."
chown -R www-data:www-data "$DEPLOY_PATH/logs" 2>/dev/null || true

log "Deployment completed successfully!"

# Send notification (optional)
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"✅ Deployment successful for table-match-manager\"}" \
        "$SLACK_WEBHOOK_URL" 2>/dev/null || true
fi

exit 0