<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project: Directory Listing API

This is a Node.js REST API that provides file system directory listing functionality with the following features:
- Full directory listing with file metadata (name, path, size, extension, created date, permissions)
- Support for large directories (100,000+ files) with pagination
- Directory navigation and selection
- Containerized deployment with Docker
- Cross-platform compatibility

## Development Guidelines

- Use Express.js for REST API framework
- Implement proper error handling and validation
- Use streaming for large directory operations
- Follow RESTful API conventions
- Include comprehensive API documentation
- Ensure security best practices for file system access
- Use TypeScript for better code quality and maintability

## API Endpoints Design
- GET /api/directory?path=/some/path&page=1&limit=100 - List directory contents
- GET /api/directory/metadata?path=/some/path - Get directory metadata
- Support for filtering and sorting parameters

## Security Considerations
- Path traversal protection
- Access control for restricted directories
- Input validation and sanitization
- Rate limiting for API endpoints