#!/bin/bash

# =============================================================================
# Quick Start Script for AI Agent System
# =============================================================================
# This script sets up the development environment and starts the system.
#
# Usage: ./quick-start.sh
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${BLUE}===================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===================================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# =============================================================================
# Check Prerequisites
# =============================================================================

check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check Python
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
        print_success "Python $PYTHON_VERSION found"
    else
        print_error "Python 3 not found. Please install Python 3.11+"
        exit 1
    fi
    
    # Check Docker
    if command -v docker &> /dev/null; then
        print_success "Docker found"
    else
        print_error "Docker not found. Please install Docker"
        exit 1
    fi
    
    # Check Docker Compose
    if command -v docker-compose &> /dev/null; then
        print_success "Docker Compose found"
    else
        print_warning "Docker Compose not found. Trying 'docker compose'..."
        if docker compose version &> /dev/null; then
            print_success "Docker Compose (plugin) found"
        else
            print_error "Docker Compose not found. Please install Docker Compose"
            exit 1
        fi
    fi
    
    echo ""
}

# =============================================================================
# Setup Virtual Environment
# =============================================================================

setup_venv() {
    print_header "Setting Up Python Virtual Environment"
    
    if [ -d "venv" ]; then
        print_info "Virtual environment already exists"
    else
        print_info "Creating virtual environment..."
        python3 -m venv venv
        print_success "Virtual environment created"
    fi
    
    print_info "Activating virtual environment..."
    source venv/bin/activate
    print_success "Virtual environment activated"
    
    print_info "Upgrading pip..."
    pip install --upgrade pip --quiet
    print_success "Pip upgraded"
    
    echo ""
}

# =============================================================================
# Install Dependencies
# =============================================================================

install_dependencies() {
    print_header "Installing Python Dependencies"
    
    if [ -f "requirements.txt" ]; then
        print_info "Installing packages from requirements.txt..."
        pip install -r requirements.txt --quiet
        print_success "Dependencies installed"
    else
        print_error "requirements.txt not found"
        exit 1
    fi
    
    echo ""
}

# =============================================================================
# Setup Environment Variables
# =============================================================================

setup_env() {
    print_header "Setting Up Environment Variables"
    
    if [ -f ".env" ]; then
        print_info ".env file already exists"
        read -p "Do you want to reconfigure? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Skipping environment setup"
            echo ""
            return
        fi
    fi
    
    if [ ! -f ".env.example" ]; then
        print_error ".env.example not found"
        exit 1
    fi
    
    cp .env.example .env
    print_success "Created .env from .env.example"
    
    print_info "Please configure your environment variables:"
    print_warning "IMPORTANT: You MUST set your API keys in .env file"
    print_info "Opening .env for editing..."
    
    # Try to open with user's default editor
    if [ -n "$EDITOR" ]; then
        $EDITOR .env
    elif command -v nano &> /dev/null; then
        nano .env
    elif command -v vim &> /dev/null; then
        vim .env
    else
        print_warning "No editor found. Please manually edit .env file"
        print_info "Required: Set OPENAI_API_KEY and POSTGRES_PASSWORD"
    fi
    
    echo ""
}

# =============================================================================
# Start Infrastructure
# =============================================================================

start_infrastructure() {
    print_header "Starting Infrastructure (Redis & PostgreSQL)"
    
    print_info "Starting Docker containers..."
    docker-compose up -d redis postgres
    
    print_info "Waiting for services to be ready..."
    sleep 5
    
    # Check if Redis is ready
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        print_success "Redis is ready"
    else
        print_warning "Redis might not be ready yet. Waiting longer..."
        sleep 5
    fi
    
    # Check if PostgreSQL is ready
    if docker-compose exec -T postgres pg_isready -U agent_user > /dev/null 2>&1; then
        print_success "PostgreSQL is ready"
    else
        print_warning "PostgreSQL might not be ready yet. Waiting longer..."
        sleep 5
    fi
    
    echo ""
}

# =============================================================================
# Initialize Database
# =============================================================================

initialize_database() {
    print_header "Initializing Database"
    
    print_info "Running database initialization script..."
    
    if python scripts/init_db.py; then
        print_success "Database initialized successfully"
    else
        print_error "Database initialization failed"
        print_info "Check the logs above for details"
        exit 1
    fi
    
    echo ""
}

# =============================================================================
# Run Tests
# =============================================================================

run_tests() {
    print_header "Running Tests"
    
    read -p "Do you want to run tests? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        print_info "Running test suite..."
        if pytest tests/ -v; then
            print_success "All tests passed!"
        else
            print_warning "Some tests failed. Check the output above."
        fi
    else
        print_info "Skipping tests"
    fi
    
    echo ""
}

# =============================================================================
# Start Application
# =============================================================================

start_application() {
    print_header "Starting Application"
    
    print_info "Starting FastAPI server..."
    print_info "Server will be available at: http://localhost:8000"
    print_info "API docs available at: http://localhost:8000/docs"
    print_info ""
    print_warning "Press Ctrl+C to stop the server"
    print_info ""
    
    # Run the application
    uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
}

# =============================================================================
# Main
# =============================================================================

main() {
    clear
    
    print_header "AI Agent Quick Start Script"
    echo ""
    print_info "This script will:"
    echo "  1. Check prerequisites"
    echo "  2. Setup Python virtual environment"
    echo "  3. Install dependencies"
    echo "  4. Configure environment variables"
    echo "  5. Start infrastructure (Redis & PostgreSQL)"
    echo "  6. Initialize database"
    echo "  7. Run tests (optional)"
    echo "  8. Start the application"
    echo ""
    
    read -p "Continue? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        print_info "Setup cancelled"
        exit 0
    fi
    
    echo ""
    
    # Run setup steps
    check_prerequisites
    setup_venv
    install_dependencies
    setup_env
    start_infrastructure
    initialize_database
    run_tests
    start_application
}

# Run main function
main
