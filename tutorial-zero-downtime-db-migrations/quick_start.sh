#!/bin/bash

# Quick Start Script for Zero-Downtime Database Migrations
# This script sets up the development environment and runs a demo

set -e  # Exit on error

echo "=========================================="
echo "Zero-Downtime Database Migrations"
echo "Quick Start Setup"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d ' ' -f 2)
echo -e "${GREEN}✓${NC} Python $PYTHON_VERSION found"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Warning: Docker is not installed${NC}"
    echo "  You'll need to setup PostgreSQL manually"
    SKIP_DOCKER=true
else
    echo -e "${GREEN}✓${NC} Docker found"
    SKIP_DOCKER=false
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null && [ "$SKIP_DOCKER" = false ]; then
    echo -e "${YELLOW}Warning: docker-compose is not installed${NC}"
    SKIP_DOCKER=true
else
    if [ "$SKIP_DOCKER" = false ]; then
        echo -e "${GREEN}✓${NC} docker-compose found"
    fi
fi

echo ""
echo "Step 1: Creating virtual environment"
echo "--------------------------------------"

if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo -e "${GREEN}✓${NC} Virtual environment created"
else
    echo -e "${YELLOW}✓${NC} Virtual environment already exists"
fi

# Activate virtual environment
source venv/bin/activate
echo -e "${GREEN}✓${NC} Virtual environment activated"

echo ""
echo "Step 2: Installing dependencies"
echo "--------------------------------"

pip install -q --upgrade pip
pip install -q -r requirements.txt
echo -e "${GREEN}✓${NC} Dependencies installed"

echo ""
echo "Step 3: Setting up databases"
echo "----------------------------"

if [ "$SKIP_DOCKER" = false ]; then
    # Stop existing containers
    docker-compose down -v 2>/dev/null || true
    
    # Start new containers
    echo "Starting PostgreSQL containers..."
    docker-compose up -d
    
    # Wait for databases to be ready
    echo "Waiting for databases to initialize..."
    sleep 10
    
    # Check if databases are ready
    if docker-compose exec -T postgres-blue pg_isready -U postgres > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Blue database ready (port 5432)"
    else
        echo -e "${RED}✗${NC} Blue database not ready"
    fi
    
    if docker-compose exec -T postgres-green pg_isready -U postgres > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Green database ready (port 5433)"
    else
        echo -e "${RED}✗${NC} Green database not ready"
    fi
else
    echo -e "${YELLOW}⚠${NC}  Skipping Docker setup"
    echo "  Please ensure PostgreSQL is running on:"
    echo "    Blue:  localhost:5432"
    echo "    Green: localhost:5433"
fi

echo ""
echo "Step 4: Creating logs directory"
echo "--------------------------------"
mkdir -p logs
echo -e "${GREEN}✓${NC} Logs directory created"

echo ""
echo "Step 5: Copying example configuration"
echo "--------------------------------------"
if [ ! -f "config/config.yml" ]; then
    cp config/config.example.yml config/config.yml
    echo -e "${GREEN}✓${NC} Configuration file created"
else
    echo -e "${YELLOW}✓${NC} Configuration file already exists"
fi

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Run the full migration demo:"
echo "   ${GREEN}python examples/full_migration_demo.py${NC}"
echo ""
echo "2. Run tests:"
echo "   ${GREEN}pytest tests/${NC}"
echo ""
echo "3. Read the documentation:"
echo "   - Architecture: docs/ARCHITECTURE.md"
echo "   - Migration Guide: docs/MIGRATION_GUIDE.md"
echo "   - Troubleshooting: docs/TROUBLESHOOTING.md"
echo ""

if [ "$SKIP_DOCKER" = false ]; then
    echo "4. Access pgAdmin (optional):"
    echo "   URL: http://localhost:8080"
    echo "   Email: admin@example.com"
    echo "   Password: admin"
    echo ""
    echo "To stop databases: ${GREEN}docker-compose down${NC}"
fi

echo ""
echo "For more information, visit:"
echo "https://crashbytes.com/articles/tutorial-zero-downtime-database-migrations-enterprise-patterns-2025/"
echo ""
