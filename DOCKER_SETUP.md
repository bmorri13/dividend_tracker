# Docker Setup Guide - Dividend Tracker

## Overview
This guide explains how to run the Dividend Tracker application using Docker and Docker Compose.

## Prerequisites
- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)

## Quick Start

### Production Mode
```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Development Mode
```bash
# Start in development mode with hot reloading
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Run in background
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

## Services

### Backend (Go API)
- **Port**: 8080
- **Health Check**: `http://localhost:8080/`
- **Environment**: Uses `./backend/.env` file
- **Authentication**: JWT with Supabase

### Frontend (Next.js)
- **Port**: 3000
- **Health Check**: `http://localhost:3000/`
- **API Connection**: Connects to backend service
- **Authentication**: Supabase Auth with Google OAuth

## Environment Configuration

### Required Environment Variables (backend/.env)
```bash
FMP_API_KEY=your-financial-modeling-prep-api-key
DATABASE_URL=your-supabase-database-url
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
```

### Network Configuration
- **Internal Communication**: Services communicate via Docker network
- **External Access**: 
  - Frontend: http://localhost:3000
  - Backend API: http://localhost:8080

## Docker Architecture

### Networks
- **dividend-tracker-network**: Bridge network for service communication
- **Internal DNS**: Services can reach each other by service name

### Volumes
- **Production**: No persistent volumes (stateless services)
- **Development**: Source code mounted for hot reloading

### Health Checks
- **Backend**: Checks `/` endpoint every 30s
- **Frontend**: Checks homepage every 30s
- **Dependencies**: Frontend waits for backend to be healthy

## Useful Commands

### Development Workflow
```bash
# Rebuild specific service
docker-compose build backend
docker-compose build frontend

# View service logs
docker-compose logs backend
docker-compose logs frontend

# Execute command in running container
docker-compose exec backend sh
docker-compose exec frontend sh

# Restart specific service
docker-compose restart backend
docker-compose restart frontend
```

### Debugging
```bash
# Check service status
docker-compose ps

# View detailed logs
docker-compose logs --tail=100 -f backend

# Check network connectivity
docker-compose exec frontend wget -qO- http://backend:8080/

# Inspect network
docker network inspect dividend-tracker-network
```

### Cleanup
```bash
# Stop and remove containers
docker-compose down

# Remove containers and networks
docker-compose down --volumes

# Remove everything including images
docker-compose down --volumes --rmi all

# Clean up unused Docker resources
docker system prune -a
```

## Production Deployment

### Security Considerations
- **Environment Variables**: Use Docker secrets in production
- **HTTPS**: Enable HTTPS with reverse proxy (nginx/traefik)
- **Secrets Management**: Don't include .env files in images
- **Network**: Use custom networks with restricted access

### Performance Optimization
- **Multi-stage Builds**: Already implemented in Dockerfiles
- **Layer Caching**: Optimized COPY commands
- **Resource Limits**: Add memory/CPU limits in production

### Example Production Override
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
    environment:
      - GIN_MODE=release
  
  frontend:
    deploy:
      resources:
        limits:
          memory: 256M
        reservations:
          memory: 128M
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   lsof -i :3000
   lsof -i :8080
   
   # Change ports in docker-compose.yml if needed
   ```

2. **Backend Health Check Failing**
   ```bash
   # Check backend logs
   docker-compose logs backend
   
   # Verify environment variables
   docker-compose exec backend env | grep -E "(FMP_API_KEY|DATABASE_URL|SUPABASE_JWT_SECRET)"
   ```

3. **Frontend Can't Connect to Backend**
   ```bash
   # Check network connectivity
   docker-compose exec frontend wget -qO- http://backend:8080/
   
   # Verify NEXT_PUBLIC_API_URL
   docker-compose exec frontend env | grep NEXT_PUBLIC_API_URL
   ```

4. **Authentication Issues**
   ```bash
   # Check Supabase JWT secret is set
   docker-compose exec backend env | grep SUPABASE_JWT_SECRET
   
   # Verify database connectivity
   docker-compose logs backend | grep -i database
   ```

### Health Check Status
```bash
# Check health status
docker-compose ps

# Manual health check
curl http://localhost:8080/
curl http://localhost:3000/
```

## File Structure
```
dividend_tracker/
├── docker-compose.yml          # Main compose file
├── docker-compose.dev.yml      # Development overrides
├── backend/
│   ├── Dockerfile              # Go backend image
│   ├── .dockerignore           # Docker ignore rules
│   └── .env                    # Environment variables
├── frontend/
│   ├── Dockerfile              # Next.js frontend image
│   └── .dockerignore           # Docker ignore rules
└── DOCKER_SETUP.md            # This guide
```

## Next Steps
1. Start services: `docker-compose up --build`
2. Open http://localhost:3000
3. Test authentication with Google OAuth
4. Add stocks to your portfolio
5. Monitor logs for any issues

For production deployment, consider using orchestration platforms like Docker Swarm or Kubernetes.