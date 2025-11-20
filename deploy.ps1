# PowerShell deployment script for Directory Listing Application

function Check-Docker {
    try {
        docker info | Out-Null
        Write-Host "✅ Docker is running" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Docker is not running. Please start Docker and try again." -ForegroundColor Red
        return $false
    }
}

function Cleanup {
    Write-Host "🧹 Cleaning up existing containers..." -ForegroundColor Yellow
    docker-compose down --remove-orphans
}

function Start-Production {
    Write-Host "🚀 Starting production services..." -ForegroundColor Green
    docker-compose up --build -d
    Write-Host "✅ Production services started!" -ForegroundColor Green
    Write-Host "🌐 Frontend: http://localhost" -ForegroundColor Cyan
    Write-Host "📡 API: http://localhost/api" -ForegroundColor Cyan
}

function Start-Development {
    Write-Host "🛠️  Starting development services..." -ForegroundColor Green
    docker-compose --profile dev up --build -d
    Write-Host "✅ Development services started!" -ForegroundColor Green
    Write-Host "🌐 Frontend: http://localhost:4200" -ForegroundColor Cyan
    Write-Host "📡 API: http://localhost:3000" -ForegroundColor Cyan
}

function Show-Logs {
    Write-Host "📋 Showing logs..." -ForegroundColor Yellow
    docker-compose logs -f
}

function Show-Status {
    Write-Host "📊 Container status:" -ForegroundColor Yellow
    docker-compose ps
}

function Stop-Services {
    Write-Host "🛑 Stopping all services..." -ForegroundColor Yellow
    docker-compose down
    Write-Host "✅ All services stopped" -ForegroundColor Green
}

function Clean-All {
    Write-Host "🧹 Cleaning up containers, images, and volumes..." -ForegroundColor Yellow
    docker-compose down --volumes --remove-orphans
    docker system prune -f
    Write-Host "✅ Cleanup complete" -ForegroundColor Green
}

# Main script
param(
    [Parameter(Position=0)]
    [string]$Command
)

Write-Host "🐳 Directory Listing Application Docker Manager" -ForegroundColor Blue

switch ($Command.ToLower()) {
    { $_ -in @("prod", "production") } {
        if (Check-Docker) {
            Cleanup
            Start-Production
        }
    }
    { $_ -in @("dev", "development") } {
        if (Check-Docker) {
            Cleanup
            Start-Development
        }
    }
    "logs" {
        Show-Logs
    }
    "status" {
        Show-Status
    }
    "stop" {
        Stop-Services
    }
    "clean" {
        Clean-All
    }
    default {
        Write-Host "📖 Usage: .\deploy.ps1 {prod|dev|logs|status|stop|clean}" -ForegroundColor White
        Write-Host ""
        Write-Host "Commands:" -ForegroundColor White
        Write-Host "  prod        - Start production services (Frontend + API)" -ForegroundColor Gray
        Write-Host "  dev         - Start development services with hot reload" -ForegroundColor Gray
        Write-Host "  logs        - Show container logs" -ForegroundColor Gray
        Write-Host "  status      - Show container status" -ForegroundColor Gray
        Write-Host "  stop        - Stop all services" -ForegroundColor Gray
        Write-Host "  clean       - Stop services and clean up containers/images" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Production URL: http://localhost" -ForegroundColor Cyan
        Write-Host "Development URLs: Frontend http://localhost:4200, API http://localhost:3000" -ForegroundColor Cyan
    }
}