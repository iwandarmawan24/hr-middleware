#!/bin/bash

# HRIS Middleware Demo - Quick Start Script
# This script sets up and starts the demo environment

set -e

echo "🚀 HRIS Middleware Demo - Quick Start"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Docker
echo "Checking prerequisites..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose found${NC}"
echo ""

# Check if keys directory exists
if [ ! -d "config/keys" ]; then
    echo "Creating keys directory..."
    mkdir -p config/keys
fi

# Generate PGP keys if they don't exist
if [ ! -f "config/keys/oic_public.asc" ] || [ ! -f "config/keys/oic_private.asc" ]; then
    echo -e "${YELLOW}⚠️  PGP keys not found. Generating demo keys...${NC}"

    if ! command -v gpg &> /dev/null; then
        echo -e "${RED}❌ GPG is not installed. Please install GPG first.${NC}"
        echo "   macOS: brew install gnupg"
        echo "   Ubuntu: sudo apt-get install gnupg"
        exit 1
    fi

    # Generate key
    gpg --batch --gen-key <<EOF
Key-Type: RSA
Key-Length: 2048
Name-Real: HRIS Demo OIC
Name-Email: oic@demo.local
Expire-Date: 0
%no-protection
%commit
EOF

    # Export keys
    gpg --armor --export "HRIS Demo OIC" > config/keys/oic_public.asc
    gpg --armor --export-secret-keys "HRIS Demo OIC" > config/keys/oic_private.asc

    echo -e "${GREEN}✅ PGP keys generated${NC}"
else
    echo -e "${GREEN}✅ PGP keys found${NC}"
fi

echo ""

# Stop existing containers
echo "Stopping existing containers (if any)..."
docker compose -f docker-compose.demo.yml down 2>/dev/null || true
echo ""

# Build and start services
echo "Building and starting services..."
echo -e "${YELLOW}This may take a few minutes on first run...${NC}"
docker compose -f docker-compose.demo.yml up -d --build

echo ""
echo "Waiting for services to be ready..."
sleep 10

# Check service health
echo ""
echo "Checking service health..."

check_service() {
    local name=$1
    local url=$2

    if curl -s "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $name is running${NC}"
        return 0
    else
        echo -e "${RED}❌ $name is not responding${NC}"
        return 1
    fi
}

check_service "Mock Talenta API" "http://localhost:3001/health"
check_service "Middleware" "http://localhost:3002/health"

echo ""
echo "======================================"
echo -e "${GREEN}🎉 Demo environment is ready!${NC}"
echo "======================================"
echo ""
echo "📊 Access Points:"
echo "  - Mock Talenta API:  http://localhost:3001"
echo "  - Middleware API:    http://localhost:3002"
echo "  - Adminer (DB UI):   http://localhost:8080"
echo "  - Vault:             http://localhost:8200"
echo ""
echo "🔧 Database Connections:"
echo "  - Middleware DB: localhost:5432 (user: hris, pass: hrispass, db: hris_metadata)"
echo "  - Mock HCM DB:   localhost:5433 (user: hcm, pass: hcmpass, db: mock_hcm)"
echo ""
echo "🧪 Quick Test:"
echo "  # Check Mock Talenta API"
echo "  curl http://localhost:3001/health | jq '.'"
echo ""
echo "  # Trigger a sync job"
echo "  curl -X POST http://localhost:3002/api/sync/trigger"
echo ""
echo "  # Check job status"
echo "  curl http://localhost:3002/api/jobs | jq '.jobs[0]'"
echo ""
echo "📝 View Logs:"
echo "  docker compose -f docker-compose.demo.yml logs -f"
echo ""
echo "🛑 Stop Demo:"
echo "  docker compose -f docker-compose.demo.yml down"
echo ""
echo "🧹 Clean Up (removes all data):"
echo "  docker compose -f docker-compose.demo.yml down -v"
echo ""
