# TFCZ Tisch 1 Battle - Production Deployment Guide

## Prerequisites

- Node.js (v18 or higher)
- MySQL 8.0 or higher
- PM2 (for process management): `npm install -g pm2`
- Nginx or Apache (for serving frontend and reverse proxy)

## 1. Database Setup

### Create Database and User
```sql
CREATE DATABASE table_match_db;
CREATE USER 'table_user'@'localhost' IDENTIFIED BY 'your_secure_password_here';
GRANT ALL PRIVILEGES ON table_match_db.* TO 'table_user'@'localhost';
FLUSH PRIVILEGES;
```

### Import Schema
```bash
mysql -u table_user -p table_match_db < database/init/01-schema.sql
```

## 2. Environment Configuration

### Copy and configure environment file
```bash
cp .env.production.example .env.production
```

Edit `.env.production` with your production values:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=table_user
DB_PASSWORD=your_secure_password_here
DB_NAME=table_match_db
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-domain.com
ADMIN_PASSWORD=your_secure_admin_password_here
```

## 3. Build the Application

### Option A: Using the build script (Windows)
```bash
build-production.bat
```

### Option B: Manual build
```bash
# Build backend
cd backend
npm ci
npm run build
cd ..

# Build frontend
cd frontend/table-match-frontend
npm ci
npm run build:prod
cd ../..
```

## 4. Frontend Deployment

### Update API URL in frontend
Edit `frontend/table-match-frontend/src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-domain.com/api'
};
```

Rebuild frontend after updating the API URL.

### Nginx Configuration
Create `/etc/nginx/sites-available/tfcz-battle`:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;
    
    root /var/www/tfcz-battle/frontend;
    index index.html;
    
    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/tfcz-battle /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## 5. Backend Deployment with PM2

### Start the backend
```bash
cd /path/to/table-match-manager
pm2 start ecosystem.config.js --env production
```

### PM2 commands
```bash
pm2 status           # Check status
pm2 logs             # View logs
pm2 restart all      # Restart application
pm2 save             # Save current process list
pm2 startup          # Generate startup script
```

## 6. Directory Structure on Server

```
/var/www/tfcz-battle/
├── backend/
│   ├── dist/           # Compiled backend code
│   ├── node_modules/
│   └── package.json
├── frontend/           # Built frontend files
│   ├── index.html
│   ├── main-*.js
│   └── ...
├── logs/              # Application logs
├── .env.production    # Production environment variables
└── ecosystem.config.js
```

## 7. Security Checklist

- [ ] Change default admin password in `.env.production`
- [ ] Configure firewall (allow ports 80, 443, 22)
- [ ] Set up SSL certificate (Let's Encrypt recommended)
- [ ] Secure MySQL (run `mysql_secure_installation`)
- [ ] Set appropriate file permissions
- [ ] Regular backups configured
- [ ] Monitor logs for errors

## 8. Backup Strategy

### Database Backup Script
Create `/opt/backup/backup-tfcz.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/opt/backup/tfcz"
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u table_user -p'password' table_match_db > $BACKUP_DIR/db_$DATE.sql
find $BACKUP_DIR -name "db_*.sql" -mtime +7 -delete
```

Add to crontab:
```bash
0 2 * * * /opt/backup/backup-tfcz.sh
```

## 9. Monitoring

### Health Check
The application provides a health endpoint:
```bash
curl http://localhost:3001/health
```

### Log Monitoring
```bash
# PM2 logs
pm2 logs tfcz-battle-api

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## 10. Troubleshooting

### Backend not starting
- Check logs: `pm2 logs tfcz-battle-api`
- Verify database connection
- Check port availability: `netstat -tulpn | grep 3001`

### Frontend not loading
- Check nginx error logs
- Verify file permissions
- Check browser console for errors

### Database connection issues
- Verify MySQL is running: `systemctl status mysql`
- Check credentials in `.env.production`
- Test connection: `mysql -u table_user -p table_match_db`

## Support

For issues or questions, please contact the development team or check the project repository.