# Affiliate Learning Platform - Docker Test Script (PowerShell)

Write-Host "🚀 Starting Affiliate Learning Platform Docker Test" -ForegroundColor Blue
Write-Host "================================================" -ForegroundColor Blue

function Write-Status($message) {
    Write-Host "[INFO] $message" -ForegroundColor Cyan
}

function Write-Success($message) {
    Write-Host "[SUCCESS] $message" -ForegroundColor Green
}

function Write-Warning($message) {
    Write-Host "[WARNING] $message" -ForegroundColor Yellow
}

function Write-Error($message) {
    Write-Host "[ERROR] $message" -ForegroundColor Red
}

# Check if Docker is running
Write-Status "Checking Docker availability..."
try {
    docker info | Out-Null
    Write-Success "Docker is running"
} catch {
    Write-Error "Docker is not running. Please start Docker Desktop."
    exit 1
}

# Check if Docker Compose is available
Write-Status "Checking Docker Compose availability..."
try {
    docker compose version | Out-Null
    Write-Success "Docker Compose is available"
} catch {
    Write-Error "Docker Compose is not available."
    exit 1
}

# Stop any existing containers
Write-Status "Stopping existing containers..."
docker compose -f docker-compose.dev.yml down --remove-orphans

# Build and start services
Write-Status "Building and starting services..."
docker compose -f docker-compose.dev.yml up --build -d

# Wait for services to be ready
Write-Status "Waiting for services to be ready..."
Start-Sleep -Seconds 30

# Check service health
Write-Status "Checking service health..."

# Check PostgreSQL
try {
    docker compose -f docker-compose.dev.yml exec postgres pg_isready -U postgres -d affiliate_platform | Out-Null
    Write-Success "PostgreSQL is healthy"
} catch {
    Write-Warning "PostgreSQL health check failed"
}

# Check Redis
try {
    docker compose -f docker-compose.dev.yml exec redis redis-cli ping | Out-Null
    Write-Success "Redis is healthy"
} catch {
    Write-Warning "Redis health check failed"
}

# Check Next.js app
Write-Status "Checking Next.js application..."
Start-Sleep -Seconds 10
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Success "Next.js application is responding"
    }
} catch {
    Write-Warning "Next.js application health check failed - may still be starting up"
}

# Show running containers
Write-Status "Running containers:"
docker compose -f docker-compose.dev.yml ps

# Show logs
Write-Status "Recent application logs:"
docker compose -f docker-compose.dev.yml logs app --tail=20

Write-Host ""
Write-Host "Test Setup Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Blue
Write-Host "Application: http://localhost:3000" -ForegroundColor Yellow
Write-Host "Database Admin: http://localhost:8080" -ForegroundColor Yellow
Write-Host "Database: localhost:5432 (postgres/postgres)" -ForegroundColor Yellow
Write-Host "Redis: localhost:6379" -ForegroundColor Yellow
Write-Host ""
Write-Host "To view logs: docker compose -f docker-compose.dev.yml logs -f" -ForegroundColor Cyan
Write-Host "To stop: docker compose -f docker-compose.dev.yml down" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Blue