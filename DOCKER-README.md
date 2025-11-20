# 🐳 Directory Listing Application - Docker Setup

This document provides comprehensive instructions for running the Directory Listing Application using Docker containers.

## 📋 Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v3.8 or higher
- 4GB+ available RAM
- 2GB+ available disk space

## 🚀 Quick Start

### Production Deployment (Recommended)

Run the complete application with frontend and backend:

```bash
# Using PowerShell script (Windows)
.\deploy.ps1 prod

# Using Bash script (Linux/Mac)
./deploy.sh prod

# Or manually with Docker Compose
docker-compose up --build -d
```

**Access the application:**
- Frontend: http://localhost
- API (via proxy): http://localhost/api

### Development Mode

Run with hot reload for development:

```bash
# Using PowerShell script (Windows)
.\deploy.ps1 dev

# Using Bash script (Linux/Mac)
./deploy.sh dev

# Or manually with Docker Compose
docker-compose --profile dev up --build -d
```

**Access the application:**
- Frontend: http://localhost:4200
- API: http://localhost:3000

## 🏗️ Architecture

### Production Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Browser  │    │  Angular Frontend │    │   Node.js API   │
│                 │◄──►│   (Nginx:80)     │◄──►│   (Express:3000)│
│   Port 80       │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Development Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Browser  │    │  Angular Dev     │    │   Node.js Dev   │
│                 │◄──►│   Server:4200    │◄──►│   Server:3000   │
│   Ports 4200    │    │   (Hot Reload)   │    │   (Nodemon)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📁 Container Structure

### Frontend Container
- **Base Image:** `nginx:alpine`
- **Build Process:** Multi-stage (Node.js build → Nginx serve)
- **Features:** Gzip compression, API proxying, SPA routing support

### Backend Container
- **Base Image:** `node:18-alpine`
- **Build Process:** TypeScript compilation → Optimized production build
- **Features:** Health checks, logging, security hardening

## 🛠️ Available Commands

### Using Deploy Scripts

#### PowerShell (Windows)
```powershell
# Production deployment
.\deploy.ps1 prod

# Development mode
.\deploy.ps1 dev

# View logs
.\deploy.ps1 logs

# Check status
.\deploy.ps1 status

# Stop services
.\deploy.ps1 stop

# Clean everything
.\deploy.ps1 clean
```

#### Bash (Linux/Mac)
```bash
# Production deployment
./deploy.sh prod

# Development mode
./deploy.sh dev

# View logs
./deploy.sh logs

# Check status
./deploy.sh status

# Stop services
./deploy.sh stop

# Clean everything
./deploy.sh clean
```

### Manual Docker Compose

```bash
# Production
docker-compose up --build -d
docker-compose down

# Development
docker-compose --profile dev up --build -d
docker-compose --profile dev down

# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Rebuild specific service
docker-compose build directory-frontend
docker-compose up -d directory-frontend
```

## ⚙️ Configuration

### Environment Variables

The API supports the following environment variables:

```bash
NODE_ENV=production          # Environment mode
PORT=3000                   # API port
LOG_LEVEL=info             # Logging level (debug, info, warn, error)
```

### Volume Mounts

#### Production
- `./logs:/app/logs` - Persistent logging
- `/:/host:ro` - Read-only host filesystem access (Linux/Mac)
- `C:\:/host:ro` - Read-only host filesystem access (Windows)

#### Development
- `./src:/app/src` - Live source code sync
- `./frontend/directory-listing-ui:/app` - Frontend source sync

### Security Considerations

⚠️ **IMPORTANT SECURITY NOTES:**

1. **Filesystem Access:** The container mounts the host filesystem for directory browsing
2. **Production Use:** Only deploy in trusted environments
3. **Access Control:** Consider implementing authentication for production
4. **Network Security:** Use proper firewall rules and reverse proxy

## 🔧 Troubleshooting

### Common Issues

#### Port Conflicts
If ports 80, 3000, or 4200 are in use:
```bash
# Check what's using the port
netstat -ano | findstr :80    # Windows
lsof -i :80                   # Linux/Mac

# Stop conflicting services or modify docker-compose.yml ports
```

#### Build Failures
```bash
# Clear Docker cache
docker system prune -f

# Rebuild without cache
docker-compose build --no-cache

# Check Docker resources
docker system df
```

#### Frontend Not Loading
```bash
# Check if API is accessible
curl http://localhost:3000/health    # Development
curl http://localhost/api/health     # Production

# Check nginx configuration
docker exec directory-listing-frontend nginx -t
```

#### API Connection Issues
```bash
# Check API logs
docker-compose logs directory-api

# Verify API is running
docker-compose ps directory-api

# Test API endpoint
curl http://localhost:3000/health
```

### Performance Optimization

#### For Production
```bash
# Limit container resources
docker-compose up --compatibility

# Enable Docker BuildKit
export DOCKER_BUILDKIT=1

# Use multi-core builds
docker-compose build --parallel
```

#### For Development
```bash
# Reduce build context
# Add more items to .dockerignore

# Use cached layers
docker-compose build --build-arg BUILDKIT_INLINE_CACHE=1
```

## 📊 Monitoring

### Health Checks
Both containers include health checks:
- **API:** HTTP GET `/health` endpoint
- **Frontend:** wget check on nginx

### Viewing Health Status
```bash
# Check all services
docker-compose ps

# Detailed health info
docker inspect --format='{{.State.Health.Status}}' directory-listing-api
docker inspect --format='{{.State.Health.Status}}' directory-listing-frontend
```

### Logs Management
```bash
# Follow all logs
docker-compose logs -f

# Follow specific service
docker-compose logs -f directory-api

# Last N lines
docker-compose logs --tail=100 directory-frontend

# Logs with timestamps
docker-compose logs -t
```

## 🔄 Updates and Maintenance

### Updating the Application
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up --build -d

# Or use the deploy script
.\deploy.ps1 prod    # Windows
./deploy.sh prod     # Linux/Mac
```

### Backup and Restore
```bash
# Backup logs
docker cp directory-listing-api:/app/logs ./backup-logs

# Backup volumes
docker volume ls
docker run --rm -v directory_logs:/data -v $(pwd):/backup busybox tar czf /backup/logs-backup.tar.gz -C /data .
```

## 📝 Development Workflow

1. **Start development containers:**
   ```bash
   .\deploy.ps1 dev
   ```

2. **Make changes** to source code (auto-reload enabled)

3. **Test changes** at http://localhost:4200 (frontend) and http://localhost:3000 (API)

4. **View logs** for debugging:
   ```bash
   .\deploy.ps1 logs
   ```

5. **Stop when done:**
   ```bash
   .\deploy.ps1 stop
   ```

## 🌐 Production Deployment

For production deployment:

1. **Update configuration** for your environment
2. **Set proper volume mounts** for your filesystem
3. **Configure SSL/TLS** if needed
4. **Set up monitoring** and log aggregation
5. **Implement backup strategies**
6. **Consider security hardening**

## 🆘 Support

If you encounter issues:

1. Check this troubleshooting guide
2. Review container logs: `.\deploy.ps1 logs`
3. Verify Docker installation and resources
4. Check the GitHub repository issues

## 📄 License

This project is licensed under the MIT License.