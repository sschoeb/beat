# Table Match Manager - Deployment Guide

## Quick Start

This application uses automated CI/CD with GitHub Actions to build and deploy Docker images.

### 1. Fork/Clone Repository

```bash
git clone https://github.com/yourusername/table-match-manager.git
cd table-match-manager
```

### 2. Set Up GitHub Secrets

Go to Repository Settings → Secrets → Actions and add:

**Required Secrets:**
- `SERVER_HOST` - Your server IP/domain
- `SERVER_USER` - SSH username  
- `SERVER_SSH_KEY` - Private SSH key
- `SERVER_PORT` - SSH port (usually 22)
- `DEPLOY_PATH` - Server deployment path (e.g., `/opt/table-match-manager`)
- `DB_ROOT_PASSWORD` - MySQL root password
- `DB_PASSWORD` - MySQL user password
- `ADMIN_PASSWORD` - Admin panel password
- `CORS_ORIGIN` - Your domain (e.g., `https://yourdomain.com`)

See [GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md) for detailed instructions.

### 3. Prepare Your Server

On your deployment server, run:

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create deployment directory
sudo mkdir -p /opt/table-match-manager
sudo chown $USER:$USER /opt/table-match-manager
```

### 4. Deploy

Push to `main` branch to trigger automatic deployment:

```bash
git push origin main
```

Or manually trigger from GitHub Actions tab.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   GitHub Repo   │────▶│  GitHub Actions  │────▶│   Your Server   │
│                 │     │                  │     │                 │
│  - Source Code  │     │ - Build Docker   │     │ - Pull Image    │
│  - Dockerfile   │     │ - Push to GHCR   │     │ - Run Container │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                              │                          │
                              ▼                          ▼
                    ┌──────────────────┐      ┌──────────────────┐
                    │  GitHub Container│      │   Application    │
                    │     Registry     │      │   ├── Frontend  │
                    │   (ghcr.io)      │      │   ├── Backend   │
                    └──────────────────┘      │   └── MySQL     │
                                              └──────────────────┘
```

## Docker Images

Images are automatically built and stored in GitHub Container Registry:

```
ghcr.io/[your-github-username]/[your-repository-name]:latest
```

## Manual Deployment

If you prefer manual deployment:

### Build Locally

```bash
# Build the application
node build.js

# Build Docker image
docker build -t table-match-manager .

# Run with docker-compose
docker-compose -f docker-compose.deploy.yml up -d
```

### Deploy to Server

```bash
# Save image
docker save table-match-manager | gzip > table-match.tar.gz

# Copy to server
scp table-match.tar.gz user@server:/tmp/

# On server: Load and run
docker load < /tmp/table-match.tar.gz
docker-compose up -d
```

## Environment Variables

Configure these in your deployment:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `DB_HOST` | MySQL host | `mysql` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_NAME` | Database name | `table_match_db` |
| `DB_USER` | Database user | `table_user` |
| `DB_PASSWORD` | Database password | Required |
| `ADMIN_PASSWORD` | Admin password | Required |
| `CORS_ORIGIN` | CORS origin | `http://localhost` |
| `PORT` | Backend port | `3001` |

## Monitoring

### Check Status

```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs -f app
docker-compose logs -f mysql

# Check application health
curl http://localhost/api/health
```

### Backup Database

```bash
# Manual backup
docker-compose exec mysql mysqldump -u root -p table_match_db > backup.sql

# Automated backups are created in /opt/table-match-manager/backups
```

## Rollback

To rollback to a previous version:

```bash
# List available images
docker images | grep table-match

# Run specific version
docker-compose down
export APP_IMAGE=ghcr.io/username/repo:previous-tag
docker-compose up -d
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs app

# Check configuration
docker-compose config

# Rebuild from scratch
docker-compose down -v
docker-compose up -d
```

### Database Connection Issues

```bash
# Check MySQL is running
docker-compose ps mysql

# Test connection
docker-compose exec mysql mysql -u root -p

# Reset database
docker-compose down -v
docker-compose up -d
```

### Permission Issues

```bash
# Fix log directory permissions
sudo chown -R 1000:1000 ./logs

# Fix general permissions
sudo chown -R $USER:$USER /opt/table-match-manager
```

## Security

- All secrets are stored in GitHub Secrets
- Database runs in isolated Docker network
- Frontend served through Nginx
- API runs on separate port with CORS protection
- Regular automated backups
- SSL/TLS should be configured on server (use reverse proxy)

## Support

1. Check [GitHub Actions](../../actions) for build status
2. Review [GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md) for configuration
3. Check server logs: `docker-compose logs`
4. Open an issue for bugs or questions