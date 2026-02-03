#!/bin/bash

# =====================================================
# HRIS Middleware - Integrated Environment Startup
# =====================================================
# This script starts the integrated environment with
# real Talenta API connection (via consume-endpoint)
# =====================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print with color
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo ""
    echo "=========================================="
    echo "$1"
    echo "=========================================="
    echo ""
}

# =====================================================
# Pre-flight Checks
# =====================================================

print_header "HRIS Middleware - Integrated Environment"

print_info "Starting pre-flight checks..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi
print_success "Docker is running"

# Check if docker compose is available
if ! docker compose version > /dev/null 2>&1; then
    print_error "Docker Compose v2 is not available. Please install it."
    exit 1
fi
print_success "Docker Compose is available"

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from .env.integrated template..."
    cp .env.integrated .env
    print_info "Please edit .env and add your Mekari credentials:"
    print_info "  - MEKARI_API_CLIENT_ID"
    print_info "  - MEKARI_API_CLIENT_SECRET"
    echo ""
    read -p "Press Enter after you've configured .env, or Ctrl+C to cancel..."
fi

# Check if Mekari credentials are set
if ! grep -q "your_client_id_here" .env 2>/dev/null && \
   ! grep -q "your_client_secret_here" .env 2>/dev/null; then
    print_success "Mekari credentials are configured"
else
    print_warning "Mekari credentials not configured in .env"
    print_info "The system will start but Talenta API calls may fail."
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Cancelled. Please configure .env and try again."
        exit 1
    fi
fi

# Check if PGP keys exist
if [ ! -f config/keys/oic_public.asc ] || [ ! -f config/keys/oic_private.asc ]; then
    print_warning "PGP keys not found. Generating demo keys..."

    mkdir -p config/keys

    # Generate PGP keys
    gpg --batch --gen-key <<EOF
Key-Type: RSA
Key-Length: 2048
Name-Real: HRIS Integrated OIC
Name-Email: oic@integrated.local
Expire-Date: 0
%no-protection
%commit
EOF

    # Export keys
    gpg --armor --export "HRIS Integrated OIC" > config/keys/oic_public.asc 2>/dev/null
    gpg --armor --export-secret-keys "HRIS Integrated OIC" > config/keys/oic_private.asc 2>/dev/null

    print_success "PGP keys generated"
else
    print_success "PGP keys found"
fi

# Check if consume-endpoint exists
CONSUME_ENDPOINT_PATH="../consume-endpoint"
if [ ! -d "$CONSUME_ENDPOINT_PATH" ]; then
    print_error "consume-endpoint project not found at: $CONSUME_ENDPOINT_PATH"
    print_info "Expected location: /Users/yayasandarmawan/Documents/wan-lab/consume-endpoint"
    exit 1
fi
print_success "consume-endpoint project found"

# Check available ports
print_info "Checking required ports..."
PORTS=(3000 3002 5432 5433 6379 8080 2222)
PORTS_IN_USE=()

for port in "${PORTS[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        PORTS_IN_USE+=($port)
    fi
done

if [ ${#PORTS_IN_USE[@]} -gt 0 ]; then
    print_warning "The following ports are already in use: ${PORTS_IN_USE[*]}"
    print_info "These services may fail to start. Consider stopping conflicting services."
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Cancelled. Please free up the ports and try again."
        exit 1
    fi
else
    print_success "All required ports are available"
fi

# =====================================================
# Start Services
# =====================================================

print_header "Starting Services"

# Pull latest images
print_info "Pulling Docker images..."
docker compose -f docker-compose.integrated.yml pull

# Build services
print_info "Building services..."
docker compose -f docker-compose.integrated.yml build

# Start services
print_info "Starting all services..."
docker compose -f docker-compose.integrated.yml up -d

# =====================================================
# Health Checks
# =====================================================

print_header "Running Health Checks"

# Wait for services to be healthy
print_info "Waiting for services to be healthy (this may take 30-60 seconds)..."
sleep 10

# Check Talenta API
print_info "Checking Talenta API Client (port 3000)..."
for i in {1..30}; do
    if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
        print_success "Talenta API Client is healthy"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Talenta API Client failed to start"
        docker compose -f docker-compose.integrated.yml logs --tail=20 talenta-api
    fi
    sleep 2
done

# Check Middleware
print_info "Checking Middleware (port 3002)..."
for i in {1..30}; do
    if curl -sf http://localhost:3002/health > /dev/null 2>&1; then
        print_success "Middleware is healthy"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Middleware failed to start"
        docker compose -f docker-compose.integrated.yml logs --tail=20 middleware
    fi
    sleep 2
done

# Check PostgreSQL
print_info "Checking PostgreSQL databases..."
if docker compose -f docker-compose.integrated.yml exec -T postgres-middleware pg_isready -U hris > /dev/null 2>&1; then
    print_success "Middleware database is ready"
else
    print_warning "Middleware database not ready"
fi

if docker compose -f docker-compose.integrated.yml exec -T postgres-hcm pg_isready -U hcm > /dev/null 2>&1; then
    print_success "HCM database is ready"
else
    print_warning "HCM database not ready"
fi

# Check Redis
print_info "Checking Redis..."
if docker compose -f docker-compose.integrated.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
    print_success "Redis is ready"
else
    print_warning "Redis not ready"
fi

# =====================================================
# Summary
# =====================================================

print_header "Startup Complete"

echo ""
echo "Services are running! Access points:"
echo ""
echo "  📡 Talenta API Client (Swagger):    http://localhost:3000"
echo "  🔧 Middleware API:                  http://localhost:3002"
echo "  💾 Database Admin (Adminer):        http://localhost:8080"
echo "  🔐 Vault:                            http://localhost:8200"
echo ""
echo "Quick commands:"
echo ""
echo "  # View all logs"
echo "  docker compose -f docker-compose.integrated.yml logs -f"
echo ""
echo "  # View middleware logs only"
echo "  docker compose -f docker-compose.integrated.yml logs -f middleware"
echo ""
echo "  # Trigger employee sync"
echo "  curl -X POST http://localhost:3002/api/sync/employees"
echo ""
echo "  # Check sync status"
echo "  curl http://localhost:3002/api/jobs | jq '.'"
echo ""
echo "  # Stop all services"
echo "  docker compose -f docker-compose.integrated.yml down"
echo ""

print_info "For detailed documentation, see: INTEGRATION_GUIDE.md"

# Check if running in interactive mode
if [ -t 0 ]; then
    echo ""
    read -p "Show logs now? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker compose -f docker-compose.integrated.yml logs -f
    fi
fi
