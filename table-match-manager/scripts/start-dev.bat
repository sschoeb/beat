@echo off
REM Table Match Manager - Development Setup Script (Windows)

echo 🏓 Table Match Manager - Development Setup
echo =========================================

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker first.
    exit /b 1
)

echo 🐳 Starting MySQL database with Docker...
docker-compose up -d mysql

echo ⏳ Waiting for MySQL to be ready...
timeout /t 10 >nul

echo 🔍 Checking MySQL health...
set timeout=30
set counter=0

:wait_loop
docker-compose exec mysql mysqladmin ping -h localhost --silent >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ MySQL is ready!
    goto mysql_ready
)

echo    Waiting for MySQL... (%counter%/%timeout%)
timeout /t 2 >nul
set /a counter+=1

if %counter% lss %timeout% goto wait_loop

echo ❌ MySQL failed to start within %timeout% seconds
exit /b 1

:mysql_ready
echo 📊 Starting phpMyAdmin (optional)...
docker-compose up -d phpmyadmin

echo.
echo ✅ Development environment is ready!
echo.
echo 🔗 Services:
echo    MySQL:      localhost:3306
echo    phpMyAdmin: http://localhost:8080
echo.
echo 📝 Database credentials:
echo    Host: localhost
echo    Port: 3306
echo    Database: table_match_db
echo    User: table_user
echo    Password: table_password
echo.
echo 🚀 To start the backend:
echo    cd backend
echo    npm run dev
echo.
echo 🎯 To start the frontend:
echo    cd frontend/table-match-frontend
echo    ng serve
echo.
echo 🛑 To stop services:
echo    docker-compose down

pause