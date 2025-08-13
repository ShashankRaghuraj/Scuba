# Scuba Browser - SearXNG Startup Script (PowerShell)

Write-Host "🐧 Starting SearXNG for Scuba Browser..." -ForegroundColor Cyan

# Security: Check for environment file
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  No .env file found. Creating from template..." -ForegroundColor Yellow
    if (Test-Path "env.example") {
        Copy-Item "env.example" ".env"
        Write-Host "📄 Created .env file from template" -ForegroundColor Green
        Write-Host "🔑 IMPORTANT: Edit .env and change SEARXNG_SECRET_KEY to a secure value!" -ForegroundColor Red
        Write-Host "💡 Generate a secure key with: node -e `"console.log(require('crypto').randomBytes(32).toString('base64'))`"" -ForegroundColor Blue
    } else {
        Write-Host "❌ No env.example template found" -ForegroundColor Red
    }
}

# Load environment variables
if (Test-Path ".env") {
    Write-Host "🔧 Loading environment variables..." -ForegroundColor Green
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.+)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
}

# Security: Validate secret key
$secretKey = [Environment]::GetEnvironmentVariable("SEARXNG_SECRET_KEY")
if (-not $secretKey -or $secretKey -eq "your-secure-random-secret-key-here-change-this") {
    Write-Host "🚨 WARNING: Using default or empty SEARXNG_SECRET_KEY!" -ForegroundColor Red
    Write-Host "🔐 Please set a secure secret key in .env file" -ForegroundColor Yellow
    Write-Host "💡 Generate one with: node -e `"console.log(require('crypto').randomBytes(32).toString('base64'))`"" -ForegroundColor Blue
}

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if containers are already running
$existingContainers = docker ps -q --filter "name=searxng"
if ($existingContainers) {
    Write-Host "🔄 SearXNG containers are already running. Stopping them first..." -ForegroundColor Yellow
    docker-compose -f searxng/docker-compose.yml down
    Start-Sleep -Seconds 2
}

# Start SearXNG
Write-Host "🚀 Starting SearXNG containers..." -ForegroundColor Green
Set-Location searxng
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ SearXNG is now running!" -ForegroundColor Green
    Write-Host "🌐 Web interface: http://localhost:8080" -ForegroundColor Cyan
    Write-Host "📡 JSON API: http://localhost:8080/search?q=YOUR_QUERY&format=json" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🧪 Test the API with:" -ForegroundColor Blue
    Write-Host "Invoke-RestMethod 'http://localhost:8080/search?q=test&format=json'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🐧 Ready for Scuba Browser!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to start SearXNG containers" -ForegroundColor Red
    exit 1
}

Set-Location ..
