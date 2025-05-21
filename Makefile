# AWS Native Realtime Dashboard - Makefile

.PHONY: help install deploy destroy synth frontend-install frontend-start frontend-build test clean

# Default target
help:
	@echo "AWS Native Realtime Dashboard - Makefile"
	@echo ""
	@echo "Available targets:"
	@echo "  help              - Show this help message"
	@echo "  install           - Install dependencies for infrastructure and frontend"
	@echo "  deploy            - Deploy the AWS infrastructure using CDK"
	@echo "  destroy           - Destroy the AWS infrastructure"
	@echo "  synth             - Synthesize CloudFormation templates"
	@echo "  frontend-install  - Install frontend dependencies"
	@echo "  frontend-start    - Start the frontend development server"
	@echo "  frontend-build    - Build the frontend for production"
	@echo "  test              - Run tests"
	@echo "  clean             - Clean up build artifacts"

# Install all dependencies
install: infrastructure-install frontend-install

# Install infrastructure dependencies
infrastructure-install:
	@echo "Installing infrastructure dependencies..."
	cd infrastructure && npm install

# Deploy infrastructure
deploy:
	@echo "Deploying infrastructure..."
	cd infrastructure && npm run build && cdk deploy

# Destroy infrastructure
destroy:
	@echo "Destroying infrastructure..."
	cd infrastructure && cdk destroy

# Synthesize CloudFormation templates
synth:
	@echo "Synthesizing CloudFormation templates..."
	cd infrastructure && npm run build && cdk synth

# Install frontend dependencies
frontend-install:
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

# Start frontend development server
frontend-start:
	@echo "Starting frontend development server..."
	cd frontend && npm start

# Build frontend for production
frontend-build:
	@echo "Building frontend for production..."
	cd frontend && npm run build

# Run tests
test:
	@echo "Running infrastructure tests..."
	cd infrastructure && npm test
	@echo "Running frontend tests..."
	cd frontend && npm test

clean:
	@echo "Cleaning up build artifacts..."
	rm -rf infrastructure/cdk.out
	rm -rf infrastructure/dist
	rm -rf infrastructure/node_modules
	rm -rf frontend/build
	rm -rf frontend/node_modules
	rm -rf scripts/node_modules


# Setup environment with WebSocket URL
setup-env:
	@echo "Setting up environment variables..."
	@WEBSOCKET_URL=$$(aws cloudformation describe-stacks --stack-name RealtimeDashboardStack --query "Stacks[0].Outputs[?OutputKey=='WebSocketURL'].OutputValue" --output text) && \
	echo "REACT_APP_WEBSOCKET_URL=$$WEBSOCKET_URL" > frontend/.env && \
	echo "Environment variables set in frontend/.env"

# Run data producer for testing
run-producer:
	@echo "Running data producer for testing..."
	cd scripts && ts-node kinesisDataProducer.ts
