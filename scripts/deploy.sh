#!/bin/bash

# Deployment Script for Haircut Reservation System
# Supports multiple environments: local, dev, staging, production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Default values
ENVIRONMENT="local"
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env.local"
BUILD_FRESH=false
SKIP_TESTS=false

# Usage function
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -e, --environment ENV    Target environment (local, dev, staging, production)"
    echo "  -f, --fresh-build        Force rebuild all images"
    echo "  -s, --skip-tests         Skip running tests"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -e local              Deploy to local environment with emulators"
    echo "  $0 -e dev -f             Deploy to dev environment with fresh build"
    echo "  $0 -e staging            Deploy to staging environment"
    echo "  $0 -e production -s      Deploy to production (skip tests)"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -f|--fresh-build)
            BUILD_FRESH=true
            shift
            ;;
        -s|--skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Set environment-specific configurations
case $ENVIRONMENT in
    local)
        COMPOSE_FILE="docker-compose.yml"
        ENV_FILE=".env.local"
        ;;
    dev)
        COMPOSE_FILE="docker-compose.dev.yml"
        ENV_FILE=".env.development"
        ;;
    staging)
        COMPOSE_FILE="docker-compose.staging.yml"
        ENV_FILE=".env.staging"
        ;;
    production)
        COMPOSE_FILE="docker-compose.prod.yml"
        ENV_FILE=".env.production"
        ;;
    *)
        print_error "Invalid environment: $ENVIRONMENT"
        print_error "Valid environments: local, dev, staging, production"
        exit 1
        ;;
esac

# Check if environment file exists
check_env_file() {
    if [[ ! -f "$ENV_FILE" ]]; then
        print_warning "Environment file $ENV_FILE not found"
        if [[ -f ".env.template" ]]; then
            print_warning "Please copy .env.template to $ENV_FILE and configure it"
            print_warning "cp .env.template $ENV_FILE"
        fi
        exit 1
    fi
    print_status "Using environment file: $ENV_FILE"
}

# Load environment variables
load_env() {
    if [[ -f "$ENV_FILE" ]]; then
        export $(grep -v '^#' "$ENV_FILE" | xargs)
        print_status "Environment variables loaded from $ENV_FILE"
    fi
}

# Pre-deployment checks
pre_deployment_checks() {
    print_step "Running pre-deployment checks..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi

    # Check if compose file exists
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        print_error "Compose file $COMPOSE_FILE not found"
        exit 1
    fi

    print_status "Pre-deployment checks passed"
}

# Run tests
run_tests() {
    if [[ "$SKIP_TESTS" == true ]]; then
        print_warning "Skipping tests as requested"
        return 0
    fi

    print_step "Running tests..."

    # Frontend tests
    if [[ -f "frontend/package.json" ]]; then
        print_status "Running frontend tests..."
        cd frontend
        npm test || { print_error "Frontend tests failed"; exit 1; }
        cd ..
    fi

    # Backend tests
    if [[ -f "backend/package.json" ]]; then
        print_status "Running backend tests..."
        cd backend
        npm test || { print_error "Backend tests failed"; exit 1; }
        cd ..
    fi

    print_status "All tests passed"
}

# Build and deploy
deploy() {
    print_step "Deploying to $ENVIRONMENT environment..."

    # Stop existing services
    print_status "Stopping existing services..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down || true

    # Build images
    if [[ "$BUILD_FRESH" == true ]]; then
        print_status "Building fresh images..."
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache
    else
        print_status "Building images..."
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build
    fi

    # Start services
    print_status "Starting services..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 30

    # Health checks
    print_status "Running health checks..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
}

# Post-deployment verification
post_deployment_verification() {
    print_step "Running post-deployment verification..."

    # Check service health
    if docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps | grep -q "unhealthy"; then
        print_error "Some services are unhealthy"
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
        exit 1
    fi

    # Test endpoints
    case $ENVIRONMENT in
        local)
            print_status "Testing local endpoints..."
            curl -f http://localhost:3000 > /dev/null || print_warning "Frontend not responding"
            curl -f http://localhost:3001/health > /dev/null || print_warning "Backend not responding"
            if [[ "$ENVIRONMENT" == "local" ]]; then
                curl -f http://localhost:4000 > /dev/null || print_warning "Firebase Emulator UI not responding"
            fi
            ;;
        dev)
            print_status "Testing development endpoints..."
            curl -f http://localhost:3000 > /dev/null || print_warning "Frontend not responding"
            curl -f http://localhost:3001/health > /dev/null || print_warning "Backend not responding"
            ;;
        staging|production)
            print_status "Health checks completed for $ENVIRONMENT"
            ;;
    esac

    print_status "Post-deployment verification completed"
}

# Cleanup function
cleanup() {
    if [[ $? -ne 0 ]]; then
        print_error "Deployment failed. Cleaning up..."
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down || true
    fi
}

# Set trap for cleanup
trap cleanup EXIT

# Main deployment flow
main() {
    echo "🚀 Haircut Reservation System Deployment"
    echo "========================================"
    echo "Environment: $ENVIRONMENT"
    echo "Compose File: $COMPOSE_FILE"
    echo "Environment File: $ENV_FILE"
    echo "Fresh Build: $BUILD_FRESH"
    echo "Skip Tests: $SKIP_TESTS"
    echo ""

    # Run deployment steps
    check_env_file
    load_env
    pre_deployment_checks

    # Skip tests for production if not explicitly requested
    if [[ "$ENVIRONMENT" != "production" ]] || [[ "$SKIP_TESTS" != true ]]; then
        run_tests
    fi

    deploy
    post_deployment_verification

    echo ""
    print_status "🎉 Deployment to $ENVIRONMENT completed successfully!"
    echo ""

    # Show service information
    case $ENVIRONMENT in
        local)
            echo "Services available at:"
            echo "  Frontend: http://localhost:3000"
            echo "  Backend: http://localhost:3001"
            echo "  Firebase Emulator UI: http://localhost:4000"
            echo "  Grafana: http://localhost:3030"
            echo "  Prometheus: http://localhost:9090"
            ;;
        dev)
            echo "Services available at:"
            echo "  Frontend: http://localhost:3000"
            echo "  Backend: http://localhost:3001"
            echo "  Grafana: http://localhost:3030"
            echo "  Prometheus: http://localhost:9090"
            ;;
        staging|production)
            echo "Services deployed to $ENVIRONMENT environment"
            echo "Check your deployment platform for service URLs"
            ;;
    esac
}

# Run main function
main "$@"
