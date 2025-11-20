#!/bin/bash

# Docker deployment script for Directory Listing Application

echo "🐳 Starting Directory Listing Application with Docker..."

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Docker is not running. Please start Docker and try again."
        exit 1
    fi
    echo "✅ Docker is running"
}

# Function to stop and remove existing containers
cleanup() {
    echo "🧹 Cleaning up existing containers..."
    docker-compose down --remove-orphans
}

# Function to build and start services
start_production() {
    echo "🚀 Starting production services..."
    docker-compose up --build -d
    echo "✅ Production services started!"
    echo "🌐 Frontend: http://localhost"
    echo "📡 API: http://localhost/api"
}

# Function to start development services
start_development() {
    echo "🛠️  Starting development services..."
    docker-compose --profile dev up --build -d
    echo "✅ Development services started!"
    echo "🌐 Frontend: http://localhost:4200"
    echo "📡 API: http://localhost:3000"
}

# Function to show logs
show_logs() {
    echo "📋 Showing logs..."
    docker-compose logs -f
}

# Function to show status
show_status() {
    echo "📊 Container status:"
    docker-compose ps
}

# Main script
case "$1" in
    "prod"|"production")
        check_docker
        cleanup
        start_production
        ;;
    "dev"|"development")
        check_docker
        cleanup
        start_development
        ;;
    "logs")
        show_logs
        ;;
    "status")
        show_status
        ;;
    "stop")
        echo "🛑 Stopping all services..."
        docker-compose down
        echo "✅ All services stopped"
        ;;
    "clean")
        echo "🧹 Cleaning up containers, images, and volumes..."
        docker-compose down --volumes --remove-orphans
        docker system prune -f
        echo "✅ Cleanup complete"
        ;;
    *)
        echo "📖 Usage: $0 {prod|dev|logs|status|stop|clean}"
        echo ""
        echo "Commands:"
        echo "  prod        - Start production services (Frontend + API)"
        echo "  dev         - Start development services with hot reload"
        echo "  logs        - Show container logs"
        echo "  status      - Show container status"
        echo "  stop        - Stop all services"
        echo "  clean       - Stop services and clean up containers/images"
        echo ""
        echo "Production URL: http://localhost"
        echo "Development URLs: Frontend http://localhost:4200, API http://localhost:3000"
        exit 1
        ;;
esac