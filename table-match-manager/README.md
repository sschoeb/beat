# Table Match Manager

A web application for managing table tennis matches with Angular frontend and Node.js backend.

## Quick Start with Docker

### Prerequisites
- Docker and Docker Compose
- Node.js (v20.18+)

### 1. Start the Database
```bash
# Windows
scripts\start-dev.bat

# Linux/Mac
chmod +x scripts/start-dev.sh
./scripts/start-dev.sh
```

Or manually:
```bash
docker-compose up -d mysql
```

### 2. Start the Backend
```bash
cd backend
npm install
npm run dev
```

### 3. Start the Frontend
```bash
cd frontend/table-match-frontend
npm install
ng serve
```

### 4. Access the Application
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:3000
- **phpMyAdmin**: http://localhost:8080

## Docker Services

The `docker-compose.yml` provides:

### MySQL Database
- **Port**: 3306
- **Database**: `table_match_db`
- **User**: `table_user`
- **Password**: `table_password`
- **Root Password**: `rootpassword`

### phpMyAdmin (Optional)
- **URL**: http://localhost:8080
- **User**: root
- **Password**: rootpassword

## Project Structure

```
table-match-manager/
├── docker-compose.yml           # Docker services
├── database/
│   └── init/                    # MySQL initialization scripts
│       ├── 01-schema.sql        # Database schema
│       └── 02-data.sql          # Sample data
├── backend/                     # Node.js/Express API
│   ├── .env                     # Environment variables
│   └── src/                     # Source code
├── frontend/
│   └── table-match-frontend/    # Angular application
└── scripts/                     # Setup scripts
    ├── start-dev.sh             # Linux/Mac setup
    └── start-dev.bat            # Windows setup
```

## Features

- **Player Management**: Fixed list of players from database
- **Match System**: Support for 1v1 and 2v2 matches
- **Queue System**: Teams can challenge winners
- **Automatic Match Progression**: Winners play next team in queue
- **Strict TypeScript**: No `any` types used
- **Docker Development**: Easy local setup

## API Endpoints

### Persons
- `GET /api/persons` - Get all persons
- `POST /api/persons` - Create a new person

### Matches
- `GET /api/matches/current` - Get current active match
- `POST /api/matches/start` - Start a new match
- `POST /api/matches/end` - End a match with winner

### Queue
- `GET /api/queue` - Get challenge queue
- `POST /api/queue` - Add team to queue
- `GET /api/queue/next` - Get and remove next team from queue
- `DELETE /api/queue/:id` - Remove specific team from queue

## Development Commands

```bash
# Start MySQL only
docker-compose up -d mysql

# Start all services (MySQL + phpMyAdmin)
docker-compose up -d

# View logs
docker-compose logs mysql

# Stop services
docker-compose down

# Remove volumes (reset database)
docker-compose down -v

# Backend commands
cd backend
npm run dev      # Development server
npm run build    # Build TypeScript
npm start        # Production server

# Frontend commands
cd frontend/table-match-frontend
ng serve         # Development server
ng build         # Build for production
ng test          # Run tests
```

## Environment Variables

Backend `.env` file:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=table_user
DB_PASSWORD=table_password
DB_NAME=table_match_db
PORT=3000
```

## Database Schema

### Tables
- **persons**: Player information
- **matches**: Match data with team compositions and results
- **queue**: Teams waiting to challenge

### Sample Data
The database is automatically populated with 10 sample players:
- Alice Johnson, Bob Smith, Charlie Brown, Diana Prince, Eva Martinez
- Frank Wilson, Grace Lee, Henry Davis, Ivy Chen, Jack Thompson

## Troubleshooting

### MySQL Connection Issues
1. Ensure Docker is running
2. Check if port 3306 is available
3. Wait for MySQL health check to pass
4. Verify environment variables in `.env`

### Frontend Build Issues
1. Ensure Node.js v20.18+ is installed
2. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
3. Check Angular CLI version: `ng version`

### Docker Issues
1. Check Docker daemon is running
2. Check available disk space
3. Reset Docker if needed: `docker system prune -a`