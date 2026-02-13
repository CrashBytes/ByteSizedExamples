#!/bin/bash

# White Label App - Version 1.0.0 Deployment Script
# Usage: ./scripts/deploy-v1.0.0.sh [client-name] [platform]
# Example: ./scripts/deploy-v1.0.0.sh acme ios

set -e  # Exit on error

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}======================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}======================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Parse arguments
CLIENT=${1:-"all"}
PLATFORM=${2:-"all"}

print_header "White Label App v1.0.0 Deployment"

echo "Client: $CLIENT"
echo "Platform: $PLATFORM"
echo ""

# Available clients
CLIENTS=("acme" "fitzone" "tastybites" "shopsmart" "homefinder" "medicare" "techstartup")

# Determine which clients to deploy
if [ "$CLIENT" = "all" ]; then
    DEPLOY_CLIENTS=("${CLIENTS[@]}")
else
    DEPLOY_CLIENTS=("$CLIENT")
fi

# Pre-deployment validation
print_header "Pre-Deployment Validation"

for client in "${DEPLOY_CLIENTS[@]}"; do
    echo ""
    echo "Validating $client..."
    
    # Validate configuration
    if npm run validate "$client" > /dev/null 2>&1; then
        print_success "Configuration validated for $client"
    else
        print_error "Configuration validation failed for $client"
        exit 1
    fi
    
    # Check if assets exist
    if [ -d "assets/$client" ]; then
        print_success "Assets exist for $client"
    else
        print_warning "Assets missing for $client - generating..."
        npm run generate-assets "$client"
    fi
done

print_success "All validations passed!"

# Confirm deployment
echo ""
print_warning "You are about to deploy the following:"
echo "  Clients: ${DEPLOY_CLIENTS[*]}"
echo "  Platform: $PLATFORM"
echo "  Version: 1.0.0"
echo ""
read -p "Continue with deployment? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Deployment cancelled"
    exit 1
fi

# Deployment
print_header "Starting Deployment"

for client in "${DEPLOY_CLIENTS[@]}"; do
    echo ""
    print_header "Deploying $client"
    
    # iOS deployment
    if [ "$PLATFORM" = "all" ] || [ "$PLATFORM" = "ios" ]; then
        echo ""
        echo "Building iOS for $client..."
        if CLIENT="$client" eas build --platform ios --profile production --non-interactive; then
            print_success "iOS build queued for $client"
        else
            print_error "iOS build failed for $client"
        fi
    fi
    
    # Android deployment
    if [ "$PLATFORM" = "all" ] || [ "$PLATFORM" = "android" ]; then
        echo ""
        echo "Building Android for $client..."
        if CLIENT="$client" eas build --platform android --profile production --non-interactive; then
            print_success "Android build queued for $client"
        else
            print_error "Android build failed for $client"
        fi
    fi
done

# Post-deployment instructions
print_header "Deployment Complete"

print_success "All builds have been queued!"

echo ""
echo "Next steps:"
echo "1. Monitor builds at: https://expo.dev"
echo "2. Once builds complete, submit to stores:"
echo "   eas submit --platform ios --latest"
echo "   eas submit --platform android --latest"
echo ""
echo "3. Tag the release:"
echo "   git tag -a v1.0.0 -m \"Version 1.0.0 Release\""
echo "   git push origin v1.0.0"
echo ""
echo "4. Create GitHub release with CHANGELOG notes"
echo ""

print_success "Deployment script finished!"
