#!/bin/bash

# Affiliate Learning Platform - Docker Test Script

echo \"🚀 Starting Affiliate Learning Platform Docker Test\"
echo \"================================================\"

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
NC='\\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e \"${BLUE}[INFO]${NC} $1\"
}

print_success() {
    echo -e \"${GREEN}[SUCCESS]${NC} $1\"
}

print_warning() {
    echo -e \"${YELLOW}[WARNING]${NC} $1\"
}

print_error() {
    echo -e \"${RED}[ERROR]${NC} $1\"
}

# Check if Docker is running
print_status \"Checking Docker availability...\"
if ! docker info > /dev/null 2>&1; then
    print_error \"Docker is not running. Please start Docker Desktop.\"
    exit 1
fi
print_success \"Docker is running\"

# Check if Docker Compose is available
print_status \"Checking Docker Compose availability...\"
if ! docker compose version > /dev/null 2>&1; then
    print_error \"Docker Compose is not available.\"
    exit 1
fi
print_success \"Docker Compose is available\"

# Stop any existing containers
print_status \"Stopping existing containers...\"
docker compose -f docker-compose.dev.yml down --remove-orphans

# Build and start services
print_status \"Building and starting services...\"
docker compose -f docker-compose.dev.yml up --build -d

# Wait for services to be ready
print_status \"Waiting for services to be ready...\"
sleep 30

# Check service health
print_status \"Checking service health...\"

# Check PostgreSQL
if docker compose -f docker-compose.dev.yml exec postgres pg_isready -U postgres -d affiliate_platform > /dev/null 2>&1; then
    print_success \"PostgreSQL is healthy\"
else
    print_warning \"PostgreSQL health check failed\"
fi

# Check Redis
if docker compose -f docker-compose.dev.yml exec redis redis-cli ping > /dev/null 2>&1; then
    print_success \"Redis is healthy\"
else
    print_warning \"Redis health check failed\"
fi

# Check Next.js app
print_status \"Checking Next.js application...\"
sleep 10
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_success \"Next.js application is responding\"
else
    print_warning \"Next.js application health check failed - may still be starting up\"
fi

# Show running containers
print_status \"Running containers:\"
docker compose -f docker-compose.dev.yml ps

# Show logs
print_status \"Recent application logs:\"
docker compose -f docker-compose.dev.yml logs app --tail=20

echo \"\"
echo \"🎉 Test Setup Complete!\"
echo \"================================================\"
echo \"📱 Application: http://localhost:3000\"
echo \"🗄️  Database Admin: http://localhost:8080\"
echo \"📊 Database: localhost:5432 (postgres/postgres)\"
echo \"🔄 Redis: localhost:6379\"
echo \"\"
echo \"To view logs: docker compose -f docker-compose.dev.yml logs -f\"
echo \"To stop: docker compose -f docker-compose.dev.yml down\"
echo \"================================================\"