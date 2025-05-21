# Makefile for Kinesis Data Producer

# Variables
BINARY_NAME=data-producer
GO=go
GOFLAGS=-ldflags="-s -w" # Strip debug information to reduce binary size

# Default target
.PHONY: all
all: build

# Build the application
.PHONY: build
build:
	@echo "Building $(BINARY_NAME)..."
	@$(GO) build $(GOFLAGS) -o build/$(BINARY_NAME) .

# Run the application
.PHONY: run
run: build
	@echo "Running $(BINARY_NAME)..."
	@./$(BINARY_NAME)

# Clean build artifacts
.PHONY: clean
clean:
	@echo "Cleaning..."
	@rm -f $(BINARY_NAME)
	@rm -rf build/
	@go clean

# Install dependencies
.PHONY: deps
deps:
	@echo "Installing dependencies..."
	@$(GO) mod tidy

# Run tests
.PHONY: test
test:
	@echo "Running tests..."
	@$(GO) test -v ./...

# Build for multiple platforms
.PHONY: build-all
build-all: clean
	@echo "Building for multiple platforms..."
	@GOOS=linux GOARCH=amd64 $(GO) build $(GOFLAGS) -o build/$(BINARY_NAME)-linux-amd64 .
	@GOOS=linux GOARCH=arm64 $(GO) build $(GOFLAGS) -o build/$(BINARY_NAME)-linux-arm64 .
	@GOOS=darwin GOARCH=amd64 $(GO) build $(GOFLAGS) -o build/$(BINARY_NAME)-darwin-amd64 .
	@GOOS=darwin GOARCH=arm64 $(GO) build $(GOFLAGS) -o build/$(BINARY_NAME)-darwin-arm64 .
	@GOOS=windows GOARCH=amd64 $(GO) build $(GOFLAGS) -o build/$(BINARY_NAME)-windows-amd64.exe .

# Build Docker image
.PHONY: docker-build
docker-build:
	@echo "Building Docker image..."
	@docker build -t realtime-dashboard/$(BINARY_NAME) .

# Run in Docker
.PHONY: docker-run
docker-run: docker-build
	@echo "Running in Docker..."
	@docker run --env-file .env realtime-dashboard/$(BINARY_NAME)

# Help target
.PHONY: help
help:
	@echo "Available targets:"
	@echo "  all          : Build the application (default)"
	@echo "  build        : Build the application"
	@echo "  run          : Build and run the application"
	@echo "  clean        : Remove build artifacts"
	@echo "  deps         : Install dependencies"
	@echo "  test         : Run tests"
	@echo "  build-all    : Build for multiple platforms"
	@echo "  docker-build : Build Docker image"
	@echo "  docker-run   : Build and run in Docker"
	@echo "  help         : Show this help message"
