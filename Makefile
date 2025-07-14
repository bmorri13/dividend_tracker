# Dividend Tracker - Docker Management

.PHONY: help build up down dev logs clean restart health

# Default target
help:
	@echo "Dividend Tracker Docker Commands:"
	@echo "  make build     - Build all Docker images"
	@echo "  make up        - Start all services (production)"
	@echo "  make dev       - Start all services (development mode)"
	@echo "  make down      - Stop all services"
	@echo "  make logs      - View logs from all services"
	@echo "  make logs-be   - View backend logs"
	@echo "  make logs-fe   - View frontend logs"
	@echo "  make restart   - Restart all services"
	@echo "  make health    - Check service health"
	@echo "  make clean     - Clean up containers and images"
	@echo "  make shell-be  - Open shell in backend container"
	@echo "  make shell-fe  - Open shell in frontend container"

# Build all images
build:
	docker-compose build

# Start production services
up:
	docker-compose up -d --build
	@echo "Services started! Frontend: http://localhost:3000, Backend: http://localhost:8080"

# Start development services with hot reloading
dev:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
	@echo "Development mode started with hot reloading!"

# Stop all services
down:
	docker-compose down

# View logs
logs:
	docker-compose logs -f

# View backend logs
logs-be:
	docker-compose logs -f backend

# View frontend logs  
logs-fe:
	docker-compose logs -f frontend

# Restart services
restart:
	docker-compose restart

# Check service health
health:
	docker-compose ps
	@echo "\nBackend health:"
	@curl -s http://localhost:8080/ || echo "Backend not responding"
	@echo "\nFrontend health:"
	@curl -s http://localhost:3000/ > /dev/null && echo "Frontend OK" || echo "Frontend not responding"

# Clean up
clean:
	docker-compose down --volumes --rmi all
	docker system prune -f

# Open shell in backend container
shell-be:
	docker-compose exec backend sh

# Open shell in frontend container
shell-fe:
	docker-compose exec frontend sh

# Quick development workflow
dev-quick:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
	@echo "Development services started in background"
	make logs

# Production build and test
prod-test: build up health