#!/bin/bash

# =====================================================
# HRIS Middleware - Integration Test Script
# =====================================================
# This script tests the integrated environment to
# verify that consume-endpoint and middleware are
# properly communicating
# =====================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

echo ""
echo "=========================================="
echo "Integration Test Suite"
echo "=========================================="
echo ""

PASS_COUNT=0
FAIL_COUNT=0
TEST_COUNT=0

# Helper function to run test
run_test() {
    TEST_COUNT=$((TEST_COUNT + 1))
    TEST_NAME=$1
    TEST_COMMAND=$2
    EXPECTED=$3

    print_test "$TEST_NAME"

    if eval "$TEST_COMMAND" > /dev/null 2>&1; then
        print_pass "$TEST_NAME"
        PASS_COUNT=$((PASS_COUNT + 1))
        return 0
    else
        print_fail "$TEST_NAME"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        return 1
    fi
}

# =====================================================
# Test 1: Service Health Checks
# =====================================================

echo "--- Service Health Checks ---"
echo ""

run_test "Talenta API Client is responding" \
    "curl -sf http://localhost:3000/health"

run_test "Middleware is responding" \
    "curl -sf http://localhost:3002/health"

run_test "PostgreSQL Middleware is ready" \
    "docker compose -f docker-compose.integrated.yml exec -T postgres-middleware pg_isready -U hris"

run_test "PostgreSQL HCM is ready" \
    "docker compose -f docker-compose.integrated.yml exec -T postgres-hcm pg_isready -U hcm"

run_test "Redis is responding" \
    "docker compose -f docker-compose.integrated.yml exec -T redis redis-cli ping"

echo ""

# =====================================================
# Test 2: Talenta API Client Endpoints
# =====================================================

echo "--- Talenta API Client Tests ---"
echo ""

print_test "Testing Talenta API Client root endpoint"
if curl -sf http://localhost:3000/ | grep -q "Talenta"; then
    print_pass "Talenta API Client root endpoint"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    print_fail "Talenta API Client root endpoint"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
TEST_COUNT=$((TEST_COUNT + 1))

print_test "Testing Talenta API Swagger docs"
if curl -sf http://localhost:3000/api-docs | grep -q "swagger"; then
    print_pass "Swagger documentation is available"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    print_fail "Swagger documentation not available"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
TEST_COUNT=$((TEST_COUNT + 1))

echo ""

# =====================================================
# Test 3: Middleware API Endpoints
# =====================================================

echo "--- Middleware API Tests ---"
echo ""

print_test "Testing Middleware health endpoint"
if curl -sf http://localhost:3002/health | grep -q "ok"; then
    print_pass "Middleware health check passed"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    print_fail "Middleware health check failed"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
TEST_COUNT=$((TEST_COUNT + 1))

print_test "Testing Middleware jobs endpoint"
if curl -sf http://localhost:3002/api/jobs >/dev/null 2>&1; then
    print_pass "Middleware jobs endpoint accessible"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    print_fail "Middleware jobs endpoint not accessible"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
TEST_COUNT=$((TEST_COUNT + 1))

echo ""

# =====================================================
# Test 4: Integration Test
# =====================================================

echo "--- Integration Tests ---"
echo ""

print_test "Testing end-to-end communication"
print_info "This will trigger a sync job to test Middleware -> Talenta API communication"

# Trigger a sync job
SYNC_RESPONSE=$(curl -sf -X POST http://localhost:3002/api/sync/employees 2>&1 || echo "FAILED")

if [[ "$SYNC_RESPONSE" != "FAILED" ]] && [[ "$SYNC_RESPONSE" != "" ]]; then
    print_pass "Sync job triggered successfully"
    PASS_COUNT=$((PASS_COUNT + 1))

    print_info "Waiting 5 seconds for job to process..."
    sleep 5

    # Check job status
    print_test "Checking sync job status"
    JOB_STATUS=$(curl -sf http://localhost:3002/api/jobs | grep -o '"status":"[^"]*"' | head -1 || echo "")

    if [[ "$JOB_STATUS" != "" ]]; then
        print_pass "Job status retrieved: $JOB_STATUS"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        print_fail "Could not retrieve job status"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
    TEST_COUNT=$((TEST_COUNT + 2))
else
    print_fail "Failed to trigger sync job"
    print_info "This may be expected if Mekari credentials are not configured"
    FAIL_COUNT=$((FAIL_COUNT + 1))
    TEST_COUNT=$((TEST_COUNT + 1))
fi

echo ""

# =====================================================
# Test 5: Database Connectivity
# =====================================================

echo "--- Database Connectivity Tests ---"
echo ""

print_test "Testing Middleware database tables"
TABLE_COUNT=$(docker compose -f docker-compose.integrated.yml exec -T postgres-middleware \
    psql -U hris -d hris_metadata -t -c \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | tr -d ' ' || echo "0")

if [[ "$TABLE_COUNT" -gt 0 ]]; then
    print_pass "Middleware database has $TABLE_COUNT tables"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    print_fail "Middleware database has no tables"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
TEST_COUNT=$((TEST_COUNT + 1))

print_test "Testing HCM database tables"
HCM_TABLE_COUNT=$(docker compose -f docker-compose.integrated.yml exec -T postgres-hcm \
    psql -U hcm -d mock_hcm -t -c \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | tr -d ' ' || echo "0")

if [[ "$HCM_TABLE_COUNT" -gt 0 ]]; then
    print_pass "HCM database has $HCM_TABLE_COUNT tables"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    print_fail "HCM database has no tables"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
TEST_COUNT=$((TEST_COUNT + 1))

echo ""

# =====================================================
# Test 6: SFTP Server
# =====================================================

echo "--- SFTP Server Tests ---"
echo ""

print_test "Testing SFTP server connectivity"
if docker compose -f docker-compose.integrated.yml exec -T sftp-server ls /home/hris/data >/dev/null 2>&1; then
    print_pass "SFTP server is accessible"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    print_fail "SFTP server not accessible"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
TEST_COUNT=$((TEST_COUNT + 1))

print_test "Testing SFTP inbound directory"
if docker compose -f docker-compose.integrated.yml exec -T sftp-server ls /home/hris/data/inbound >/dev/null 2>&1; then
    print_pass "SFTP inbound directory exists"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    print_fail "SFTP inbound directory not found"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
TEST_COUNT=$((TEST_COUNT + 1))

echo ""

# =====================================================
# Summary
# =====================================================

echo "=========================================="
echo "Test Results"
echo "=========================================="
echo ""
echo "Total Tests:  $TEST_COUNT"
echo -e "${GREEN}Passed:       $PASS_COUNT${NC}"
echo -e "${RED}Failed:       $FAIL_COUNT${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "Your integrated environment is working correctly!"
    echo ""
    echo "Next steps:"
    echo "  1. Configure your Mekari credentials in .env (if not done)"
    echo "  2. Trigger a full sync: curl -X POST http://localhost:3002/api/sync/trigger"
    echo "  3. Monitor logs: docker compose -f docker-compose.integrated.yml logs -f"
    exit 0
else
    echo -e "${YELLOW}⚠ Some tests failed${NC}"
    echo ""
    echo "Common issues:"
    echo "  - Mekari credentials not configured (expected for initial setup)"
    echo "  - Services still starting up (wait 30-60 seconds)"
    echo "  - Port conflicts with other services"
    echo ""
    echo "Check logs with:"
    echo "  docker compose -f docker-compose.integrated.yml logs"
    exit 1
fi
