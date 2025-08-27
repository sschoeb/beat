# GitHub Secrets Setup for CI/CD Pipeline

This document describes how to set up the required GitHub secrets for the automated deployment pipeline.

## Overview

The CI/CD pipeline automatically:
1. Builds a Docker image from your code
2. Pushes it to GitHub Container Registry (ghcr.io)
3. Deploys it to your server via SSH

## Required GitHub Secrets

Navigate to your GitHub repository → Settings → Secrets and variables → Actions, then add these secrets:

### 1. Server Connection Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SERVER_HOST` | Your server's IP address or domain | `192.168.1.100` or `myserver.com` |
| `SERVER_USER` | SSH username for deployment | `deploy` or `ubuntu` |
| `SERVER_PORT` | SSH port (default: 22) | `22` |
| `SERVER_SSH_KEY` | Private SSH key for authentication | See SSH key setup below |
| `DEPLOY_PATH` | Path on server where app will be deployed | `/opt/table-match-manager` |

### 2. Database Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `DB_ROOT_PASSWORD` | MySQL root password | `SecureRootPass123!` |
| `DB_PASSWORD` | MySQL user password | `SecureUserPass456!` |
| `DB_NAME` | Database name (optional) | `table_match_db` |
| `DB_USER` | Database username (optional) | `table_user` |

### 3. Application Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `ADMIN_PASSWORD` | Admin panel password | `AdminSecurePass789!` |
| `CORS_ORIGIN` | Allowed CORS origin | `https://yourdomain.com` |

## SSH Key Setup

### Step 1: Generate SSH Key Pair (on your local machine)

```bash
# Generate a new SSH key pair
ssh-keygen -t ed25519 -C "github-actions@table-match" -f table-match-deploy

# This creates two files:
# - table-match-deploy (private key)
# - table-match-deploy.pub (public key)
```

### Step 2: Add Public Key to Server

```bash
# Copy the public key to your server
ssh-copy-id -i table-match-deploy.pub username@your-server.com

# Or manually add it to ~/.ssh/authorized_keys on the server:
cat table-match-deploy.pub | ssh username@server 'cat >> ~/.ssh/authorized_keys'
```

### Step 3: Add Private Key to GitHub Secrets

1. Copy the content of the private key:
   ```bash
   cat table-match-deploy
   ```

2. Go to GitHub repository → Settings → Secrets → Actions
3. Click "New repository secret"
4. Name: `SERVER_SSH_KEY`
5. Value: Paste the entire private key content (including BEGIN and END lines)
6. Click "Add secret"

## Server Preparation

### Prerequisites on Server

1. **Docker and Docker Compose installed:**
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh

   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **Create deployment directory:**
   ```bash
   sudo mkdir -p /opt/table-match-manager
   sudo chown $USER:$USER /opt/table-match-manager
   ```

3. **Copy initial files to server:**
   ```bash
   # Copy docker-compose.deploy.yml to server
   scp docker-compose.deploy.yml user@server:/opt/table-match-manager/docker-compose.yml

   # Copy database initialization files
   scp -r table-match-manager/database/init user@server:/opt/table-match-manager/db/
   ```

## GitHub Container Registry Setup

The workflow uses GitHub Container Registry (ghcr.io) which is automatically available for your repository. The images will be stored at:

```
ghcr.io/[your-github-username]/[your-repository-name]
```

### Making Images Public (Optional)

If you want the images to be publicly accessible:

1. Go to your GitHub profile → Packages
2. Find your package
3. Click on Package settings
4. Change visibility to Public

## Testing the Pipeline

### Manual Trigger

You can manually trigger the deployment:

1. Go to Actions tab in your repository
2. Select "Build and Deploy" workflow
3. Click "Run workflow"
4. Select branch and click "Run workflow"

### Automatic Triggers

The pipeline automatically runs on:
- Push to `main` or `master` branch
- Pull requests to `main` or `master` branch

## Monitoring Deployment

### Check GitHub Actions

1. Go to Actions tab in your repository
2. Click on the running workflow
3. View logs for each step

### Check Server Logs

On your server:

```bash
# Check running containers
docker-compose ps

# View application logs
docker-compose logs -f app

# View database logs
docker-compose logs -f mysql

# Check supervisor logs (inside container)
docker exec table-match-app tail -f /var/log/supervisor/backend.log
```

## Troubleshooting

### SSH Connection Issues

If the SSH connection fails:

1. Verify SSH key is correctly added to GitHub secrets
2. Check if the public key is in server's `~/.ssh/authorized_keys`
3. Ensure SSH port is correct and accessible
4. Check server firewall settings

### Docker Issues

If Docker commands fail on server:

1. Ensure user has docker permissions:
   ```bash
   sudo usermod -aG docker $USER
   # Log out and back in
   ```

2. Check Docker service is running:
   ```bash
   sudo systemctl status docker
   ```

### Image Pull Issues

If image pull fails:

1. The image is private by default in ghcr.io
2. The GitHub Actions token has permissions to pull during deployment
3. For manual pulls, you need to authenticate:
   ```bash
   echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
   ```

## Security Best Practices

1. **Use strong passwords** for all secrets
2. **Rotate SSH keys** periodically
3. **Limit SSH access** to deployment user only
4. **Use firewall rules** to restrict access
5. **Regular backups** of database
6. **Monitor logs** for suspicious activity
7. **Keep Docker and dependencies updated**

## Alternative Container Registries

Instead of GitHub Container Registry, you can use:

1. **Docker Hub** (free for public images)
   - Update `REGISTRY` in workflow to `docker.io`
   - Add `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` secrets

2. **Self-hosted Registry**
   - Deploy your own registry
   - Update workflow with registry URL and credentials

3. **Cloud Registries**
   - AWS ECR, Google Container Registry, Azure Container Registry
   - Add appropriate authentication in workflow

## Support

For issues or questions:
1. Check GitHub Actions logs
2. Review server logs
3. Verify all secrets are correctly set
4. Ensure server meets all prerequisites