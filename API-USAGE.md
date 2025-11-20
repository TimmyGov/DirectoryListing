# Directory Listing API - Usage Guide

## Overview
A comprehensive Node.js REST API that provides file system directory listing functionality with metadata, permissions, pagination, and containerized deployment.

## Features
- ✅ Full directory listing with file metadata
- ✅ File permissions and attributes (cross-platform)
- ✅ Support for large directories (100,000+ files) with pagination
- ✅ Directory navigation and selection
- ✅ Sorting by name, size, modified date, or type
- ✅ Security protection against path traversal
- ✅ Containerized with Docker
- ✅ Rate limiting and comprehensive error handling
- ✅ Cross-platform compatibility (Windows, Linux, macOS)

## Quick Start

### Running Locally
```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

### Running with Docker
```bash
# Build the Docker image
docker build -t directory-listing-api .

# Run the container
docker run -d -p 3000:3000 --name directory-api directory-listing-api

# Or use Docker Compose
docker-compose up -d
```

## API Endpoints

### Base URL
- Local: `http://localhost:3000`
- Container: `http://localhost:3000` (mapped from container)

### 1. API Information
```http
GET /api/v1/directory
```

**Response:**
```json
{
  "name": "Directory Listing API",
  "version": "1.0.0",
  "description": "REST API for file system directory listing with metadata and permissions",
  "endpoints": {
    "GET /": "API information",
    "GET /list": "List directory contents with pagination",
    "GET /metadata": "Get directory metadata"
  }
}
```

### 2. List Directory Contents
```http
GET /api/v1/directory/list?path={directory_path}&page={page}&limit={limit}
```

**Query Parameters:**
- `path` (required): Directory path to list
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page, max 1000 (default: 100)
- `includeHidden` (optional): Include hidden files (default: false)
- `sortBy` (optional): Sort by name, size, modified, or type (default: name)
- `sortOrder` (optional): asc or desc (default: asc)

**Example Request:**
```bash
curl "http://localhost:3000/api/v1/directory/list?path=/home/user&page=1&limit=10&sortBy=size&sortOrder=desc"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "path": "/home/user",
    "items": [
      {
        "name": "document.pdf",
        "path": "/home/user/document.pdf",
        "size": 2048576,
        "extension": ".pdf",
        "type": "file",
        "createdDate": "2023-01-01T12:00:00.000Z",
        "modifiedDate": "2023-01-02T12:00:00.000Z",
        "permissions": {
          "readable": true,
          "writable": true,
          "executable": false,
          "owner": "user",
          "group": "users",
          "mode": "100644"
        },
        "isHidden": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3,
      "hasNext": true,
      "hasPrevious": false
    },
    "metadata": {
      "totalFiles": 20,
      "totalDirectories": 5,
      "totalSize": 1048576000,
      "scannedAt": "2023-01-01T12:00:00.000Z"
    }
  }
}
```

### 3. Get Directory Metadata
```http
GET /api/v1/directory/metadata?path={directory_path}
```

**Query Parameters:**
- `path` (required): Directory path

**Example Request:**
```bash
curl "http://localhost:3000/api/v1/directory/metadata?path=/home/user"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "path": "/home/user",
    "exists": true,
    "isDirectory": true,
    "permissions": {
      "readable": true,
      "writable": true,
      "executable": true
    },
    "totalItems": 25,
    "totalSize": 1048576000,
    "lastAccessed": "2023-01-01T12:00:00.000Z",
    "lastModified": "2023-01-01T11:30:00.000Z",
    "created": "2022-12-01T10:00:00.000Z"
  }
}
```

### 4. Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2023-01-01T12:00:00.000Z",
  "uptime": 3600.123
}
```

## Error Responses

All error responses follow this format:
```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "statusCode": 400
}
```

Common error codes:
- `400` - Bad Request (invalid parameters)
- `403` - Forbidden (path traversal, restricted access)
- `404` - Not Found (path doesn't exist)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Security Features

- **Path Traversal Protection**: Prevents `../` attacks
- **Restricted Path Access**: Blocks access to system directories
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: All parameters are validated
- **CORS Protection**: Configurable origins
- **Security Headers**: Helmet.js integration

## Environment Configuration

Create a `.env` file for custom configuration:
```env
PORT=3000
NODE_ENV=production
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Testing Examples

### PowerShell (Windows)
```powershell
# Get API info
Invoke-WebRequest -Uri "http://localhost:3000/api/v1/directory" | Select-Object -ExpandProperty Content

# List current directory
Invoke-WebRequest -Uri "http://localhost:3000/api/v1/directory/list?path=C:\Windows&limit=5" | Select-Object -ExpandProperty Content

# Get directory metadata
Invoke-WebRequest -Uri "http://localhost:3000/api/v1/directory/metadata?path=C:\Windows" | Select-Object -ExpandProperty Content
```

### Bash (Linux/macOS)
```bash
# Get API info
curl "http://localhost:3000/api/v1/directory"

# List home directory
curl "http://localhost:3000/api/v1/directory/list?path=/home&limit=10&sortBy=size"

# Get directory metadata
curl "http://localhost:3000/api/v1/directory/metadata?path=/home"
```

## Performance Notes

- **Large Directories**: Uses pagination to handle directories with 100,000+ files efficiently
- **Memory Usage**: Processes files in batches to avoid memory issues
- **Permissions**: Uses async file system calls for better performance
- **Caching**: Consider implementing caching for frequently accessed directories in production

## Production Deployment

The API is production-ready with:
- Multi-stage Docker builds for optimized images
- Non-root user execution
- Health checks and graceful shutdown
- Comprehensive logging with Winston
- Security hardening
- Environment-based configuration