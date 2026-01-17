# Makefile for Portal da Lembrança
# Provides convenient commands for development, testing, and Docker operations

.PHONY: help debug run stop utest mtest build clean

# Default target - show help
help:
	@echo "Portal da Lembrança - Available Commands:"
	@echo ""
	@echo "Development:"
	@echo "  make debug       - Start app locally with hot reload (Next.js dev server)"
	@echo ""
	@echo "Docker:"
	@echo "  make build       - Build Docker image"
	@echo "  make run         - Start app in Docker container"
	@echo "  make stop        - Stop Docker container"
	@echo ""
	@echo "Testing:"
	@echo "  make utest       - Run Vitest unit tests with output"
	@echo "  make mtest       - Run Stryker mutation tests with score"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean       - Clean build artifacts and containers"
	@echo "  make logs        - Show Docker container logs"

# Docker configuration
IMAGE_NAME = portaldalembranca-next
CONTAINER_NAME = portaldalembranca-app
PORT = 3000

# Start app locally with hot reload (Turbopack)
debug:
	@echo "Starting development server with hot reload..."
	pnpm dev

# Build Docker image
build:
	@echo "Building Docker image..."
	docker build -t $(IMAGE_NAME) .
	@echo "Docker image built successfully: $(IMAGE_NAME)"

# Start app in Docker container
run: build
	@echo "Stopping any existing container..."
	@$(MAKE) stop 2>/dev/null || true
	@echo "Starting Docker container..."
	docker run -d \
		--name $(CONTAINER_NAME) \
		-p $(PORT):$(PORT) \
		--env-file .env \
		$(IMAGE_NAME)
	@echo "Container started successfully!"
	@echo "Application available at http://localhost:$(PORT)"
	@echo "Use 'make logs' to view logs or 'make stop' to stop the container"

# Stop Docker container
stop:
	@echo "Stopping Docker container..."
	@docker stop $(CONTAINER_NAME) 2>/dev/null || echo "Container not running"
	@docker rm $(CONTAINER_NAME) 2>/dev/null || echo "Container not found"
	@echo "Container stopped and removed"

# Run Vitest unit tests
utest:
	@echo "Running Vitest unit tests..."
	@echo "================================"
	pnpm test:run
	@echo "================================"
	@echo "Unit tests completed!"

# Run Stryker mutation tests
mtest:
	@echo "Running Stryker mutation tests..."
	@echo "This may take several minutes..."
	@echo "================================"
	pnpm test:mutate
	@echo "================================"
	@echo "Mutation testing completed!"
	@echo "View detailed report in reports/mutation/html/index.html"

# Show Docker container logs
logs:
	@docker logs -f $(CONTAINER_NAME)

# Clean up build artifacts and Docker resources
clean:
	@echo "Cleaning up..."
	@$(MAKE) stop 2>/dev/null || true
	@docker rmi $(IMAGE_NAME) 2>/dev/null || echo "Image not found"
	@rm -rf .next out node_modules/.cache coverage reports
	@echo "Cleanup completed!"

# Install dependencies
install:
	@echo "Installing dependencies..."
	pnpm install
	@echo "Dependencies installed!"

# Run database migrations
migrate:
	@echo "Running database migrations..."
	pnpm db:migrate
	@echo "Migrations completed!"

# Type check
typecheck:
	@echo "Running TypeScript type check..."
	pnpm typecheck
	@echo "Type check completed!"

# Build for production (local)
prod-build:
	@echo "Building for production..."
	pnpm build
	@echo "Production build completed!"
