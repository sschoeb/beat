#!/bin/bash

# Table Match Manager - Development Setup Script

echo "🏓 Table Match Manager - Development Setup"
echo "========================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "🐳 Starting MySQL database with Docker..."
docker-compose up -d mysql

echo "⏳ Waiting for MySQL to be ready..."
sleep 10

# Wait for MySQL to be healthy
echo "🔍 Checking MySQL health..."
timeout=30
counter=0
while [ $counter -lt $timeout ]; do
    if docker-compose exec mysql mysqladmin ping -h localhost --silent; then
        echo "✅ MySQL is ready!"
        break
    fi
    echo "   Waiting for MySQL... ($counter/$timeout)"
    sleep 2
    counter=$((counter + 1))
done

if [ $counter -eq $timeout ]; then
    echo "❌ MySQL failed to start within $timeout seconds"
    exit 1
fi

echo "📊 Starting phpMyAdmin (optional)..."
docker-compose up -d phpmyadmin

echo ""
echo "✅ Development environment is ready!"
echo ""
echo "🔗 Services:"
echo "   MySQL:      localhost:3306"
echo "   phpMyAdmin: http://localhost:8080"
echo ""
echo "📝 Database credentials:"
echo "   Host: localhost"
echo "   Port: 3306"
echo "   Database: table_match_db"
echo "   User: table_user"
echo "   Password: table_password"
echo ""
echo "🚀 To start the backend:"
echo "   cd backend"
echo "   npm run dev"
echo ""
echo "🎯 To start the frontend:"
echo "   cd frontend/table-match-frontend"
echo "   ng serve"
echo ""
echo "🛑 To stop services:"
echo "   docker-compose down"