# Testing Docker Setup

## Step 1: Start Database
```bash
docker-compose up -d mysql
```

## Step 2: Wait for MySQL to be ready
```bash
# Wait for health check
docker-compose logs -f mysql

# Or test connection
docker-compose exec mysql mysqladmin ping -h localhost
```

## Step 3: Verify Database Setup
```bash
# Check tables exist
docker-compose exec mysql mysql -u table_user -ptable_password -D table_match_db -e "SHOW TABLES;"

# Check sample data
docker-compose exec mysql mysql -u table_user -ptable_password -D table_match_db -e "SELECT COUNT(*) as player_count FROM persons;"
```

## Step 4: Test Backend Connection
```bash
cd backend
npm run dev
```

Should show:
- Database connected successfully
- Database initialized successfully
- Server is running on port 3000

## Step 5: Test API Endpoints
```bash
# Health check
curl http://localhost:3000/health

# Get persons
curl http://localhost:3000/api/persons
```

## Step 6: Start Frontend
```bash
cd frontend/table-match-frontend
ng serve
```

## Step 7: Access Application
- Frontend: http://localhost:4200
- Backend API: http://localhost:3000
- phpMyAdmin: http://localhost:8080 (if started)