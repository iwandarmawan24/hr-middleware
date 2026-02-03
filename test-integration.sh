#!/bin/bash

# HRIS Middleware - Integration Test Script
# Tests the complete flow from Talenta to Mock HCM

set -e

echo "🧪 HRIS Middleware Integration Test"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if services are running
echo "Checking if services are running..."
if ! curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${RED}❌ Mock Talenta API is not running${NC}"
    echo "Run './start-demo.sh' first"
    exit 1
fi

if ! curl -s http://localhost:3002/health > /dev/null 2>&1; then
    echo -e "${RED}❌ Middleware is not running${NC}"
    echo "Run './start-demo.sh' first"
    exit 1
fi

echo -e "${GREEN}✅ All services are running${NC}"
echo ""

# Test 1: Check Mock Talenta API
echo -e "${BLUE}Test 1: Checking Mock Talenta API${NC}"
EMPLOYEE_COUNT=$(curl -s http://localhost:3001/health | jq -r '.data_loaded.employees')
echo "  - Employees in Mock API: $EMPLOYEE_COUNT"
if [ "$EMPLOYEE_COUNT" -gt 0 ]; then
    echo -e "${GREEN}  ✅ Pass${NC}"
else
    echo -e "${RED}  ❌ Fail - No employees found${NC}"
    exit 1
fi
echo ""

# Test 2: Sync Employees
echo -e "${BLUE}Test 2: Syncing Employees${NC}"
curl -s -X POST http://localhost:3002/api/sync/employees > /dev/null
echo "  - Sync triggered, waiting 5 seconds..."
sleep 5

SYNCED_EMPLOYEES=$(docker exec hris-postgres-middleware psql -U hris -d hris_metadata -t -c "SELECT COUNT(*) FROM employees;" | xargs)
echo "  - Employees synced to middleware DB: $SYNCED_EMPLOYEES"

if [ "$SYNCED_EMPLOYEES" -gt 0 ]; then
    echo -e "${GREEN}  ✅ Pass${NC}"
else
    echo -e "${RED}  ❌ Fail - No employees synced${NC}"
    exit 1
fi
echo ""

# Test 3: Process Payroll
echo -e "${BLUE}Test 3: Processing Payroll${NC}"
YEAR=$(date +%Y)
MONTH=$(date +%-m)
echo "  - Processing payroll for $YEAR-$MONTH"

RESPONSE=$(curl -s -X POST http://localhost:3002/api/sync/payroll \
  -H "Content-Type: application/json" \
  -d "{\"year\": $YEAR, \"month\": $MONTH}")

echo "  - Waiting 10 seconds for processing..."
sleep 10

DOCUMENTS=$(docker exec hris-postgres-middleware psql -U hris -d hris_metadata -t -c "SELECT COUNT(*) FROM documents;" | xargs)
echo "  - Documents generated: $DOCUMENTS"

if [ "$DOCUMENTS" -gt 0 ]; then
    echo -e "${GREEN}  ✅ Pass${NC}"
else
    echo -e "${YELLOW}  ⚠️  Warning - No documents generated (might be expected if no payroll data)${NC}"
fi
echo ""

# Test 4: Check SFTP Files
echo -e "${BLUE}Test 4: Checking SFTP Files${NC}"
FILES=$(docker exec hris-sftp ls /home/hris/data/inbound 2>/dev/null | wc -l | xargs)
echo "  - Files in SFTP inbound: $FILES"

if [ "$FILES" -gt 0 ]; then
    echo -e "${GREEN}  ✅ Pass${NC}"
    docker exec hris-sftp ls -lh /home/hris/data/inbound
else
    echo -e "${YELLOW}  ⚠️  Warning - No files in SFTP inbound${NC}"
fi
echo ""

# Test 5: Check Mock OIC Processing
echo -e "${BLUE}Test 5: Checking Mock OIC Processing${NC}"
echo "  - Waiting 15 seconds for Mock OIC to process files..."
sleep 15

IMPORTS=$(docker exec hris-postgres-hcm psql -U hcm -d mock_hcm -t -c "SELECT COUNT(*) FROM hdl_import_log;" | xargs)
echo "  - Import log entries: $IMPORTS"

if [ "$IMPORTS" -gt 0 ]; then
    echo -e "${GREEN}  ✅ Pass${NC}"

    # Show import details
    echo "  - Recent imports:"
    docker exec hris-postgres-hcm psql -U hcm -d mock_hcm -c \
      "SELECT file_name, hdl_object, status, records_success, records_failed FROM hdl_import_log ORDER BY created_at DESC LIMIT 5;"
else
    echo -e "${YELLOW}  ⚠️  Warning - No import logs found${NC}"
fi
echo ""

# Test 6: Verify Data in Mock HCM
echo -e "${BLUE}Test 6: Verifying Data in Mock HCM${NC}"

PERSONS=$(docker exec hris-postgres-hcm psql -U hcm -d mock_hcm -t -c "SELECT COUNT(*) FROM persons;" | xargs)
echo "  - Persons in Mock HCM: $PERSONS"

DOCUMENTS_HCM=$(docker exec hris-postgres-hcm psql -U hcm -d mock_hcm -t -c "SELECT COUNT(*) FROM documents_of_record;" | xargs)
echo "  - Documents in Mock HCM: $DOCUMENTS_HCM"

if [ "$PERSONS" -gt 0 ]; then
    echo -e "${GREEN}  ✅ Pass - Data successfully loaded to Mock HCM${NC}"

    # Show sample data
    echo "  - Sample persons:"
    docker exec hris-postgres-hcm psql -U hcm -d mock_hcm -c \
      "SELECT person_number, full_name, department FROM persons LIMIT 5;"
else
    echo -e "${RED}  ❌ Fail - No data in Mock HCM${NC}"
fi
echo ""

# Summary
echo "===================================="
echo -e "${GREEN}✅ Integration Test Complete${NC}"
echo "===================================="
echo ""
echo "Summary:"
echo "  - Mock Talenta Employees: $EMPLOYEE_COUNT"
echo "  - Synced to Middleware: $SYNCED_EMPLOYEES"
echo "  - Documents Generated: $DOCUMENTS"
echo "  - SFTP Files: $FILES"
echo "  - Import Logs: $IMPORTS"
echo "  - Persons in Mock HCM: $PERSONS"
echo "  - Documents in Mock HCM: $DOCUMENTS_HCM"
echo ""
echo "📊 View detailed results:"
echo "  docker compose -f docker-compose.demo.yml logs mock-oic"
echo ""
