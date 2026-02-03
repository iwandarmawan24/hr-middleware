#!/bin/bash

echo "════════════════════════════════════════════════════════════"
echo "  🚀 HRIS Sync Demo - Talenta → Metadata → SFTP"
echo "════════════════════════════════════════════════════════════"
echo

# Step 1: Check initial state
echo "📊 Step 1: Checking initial state..."
echo "─────────────────────────────────────────────────────────────"
BEFORE_COUNT=$(docker exec hris-postgres-middleware psql -U hris -d hris_metadata -t -c "SELECT COUNT(*) FROM employees;" | xargs)
echo "Employees in DB: $BEFORE_COUNT"
echo

# Step 2: Trigger sync
echo "🔄 Step 2: Triggering employee sync..."
echo "─────────────────────────────────────────────────────────────"
RESPONSE=$(curl -s -X POST http://localhost:3002/api/sync/employees)
echo "API Response: $RESPONSE"
JOB_ID=$(echo $RESPONSE | jq -r '.jobId // empty' 2>/dev/null || echo "")
if [ -n "$JOB_ID" ]; then
  echo "Job ID: $JOB_ID"
else
  echo "⚠️  Could not extract job ID from response"
fi
echo

# Step 3: Wait for processing
echo "⏳ Step 3: Waiting 15 seconds for processing..."
echo "─────────────────────────────────────────────────────────────"
for i in {15..1}; do
  printf "  %2d seconds remaining...\r" $i
  sleep 1
done
echo ""
echo

# Step 4: Check sync job status
echo "📋 Step 4: Checking sync job status..."
echo "─────────────────────────────────────────────────────────────"
docker exec hris-postgres-middleware psql -U hris -d hris_metadata -c \
  "SELECT
     SUBSTRING(id::text, 1, 8) as job_id,
     job_type,
     status,
     records_total,
     records_processed,
     records_failed
   FROM sync_jobs
   ORDER BY created_at DESC
   LIMIT 3;"
echo

# Step 5: Check employees
echo "👥 Step 5: Checking employees in metadata DB..."
echo "─────────────────────────────────────────────────────────────"
AFTER_COUNT=$(docker exec hris-postgres-middleware psql -U hris -d hris_metadata -t -c "SELECT COUNT(*) FROM employees;" | xargs)
NEW_RECORDS=$((AFTER_COUNT - BEFORE_COUNT))
echo "Employees in DB: $AFTER_COUNT (was: $BEFORE_COUNT, new: $NEW_RECORDS)"
echo

if [ $AFTER_COUNT -gt 0 ]; then
  docker exec hris-postgres-middleware psql -U hris -d hris_metadata -c \
    "SELECT
       talenta_user_id,
       full_name,
       email,
       department
     FROM employees
     ORDER BY created_at DESC
     LIMIT 5;"
else
  echo "⚠️  No employees found in database"
fi
echo

# Step 6: Check SFTP files
echo "📁 Step 6: Checking SFTP files..."
echo "─────────────────────────────────────────────────────────────"
FILE_COUNT=$(docker exec hris-sftp find /home/hris/data/inbound -type f 2>/dev/null | wc -l | xargs)
echo "Files in SFTP inbound: $FILE_COUNT"
echo
docker exec hris-sftp ls -lah /home/hris/data/inbound 2>/dev/null || echo "SFTP folder empty or error"
echo

# Step 7: Show file content (if exists)
if [ $FILE_COUNT -gt 0 ]; then
  echo "📄 Step 7: Sample file content..."
  echo "─────────────────────────────────────────────────────────────"
  FIRST_CSV=$(docker exec hris-sftp find /home/hris/data/inbound -type f -name "*.csv" 2>/dev/null | head -1)
  if [ -n "$FIRST_CSV" ]; then
    echo "File: $FIRST_CSV"
    echo "First 10 lines:"
    docker exec hris-sftp head -10 "$FIRST_CSV" 2>/dev/null || echo "Could not read file"
  else
    echo "No CSV files found"
  fi
  echo
fi

# Step 8: Check Mock OIC processing
echo "🔄 Step 8: Checking Mock OIC (if processed)..."
echo "─────────────────────────────────────────────────────────────"
HCM_COUNT=$(docker exec hris-postgres-hcm psql -U hcm -d mock_hcm -t -c "SELECT COUNT(*) FROM persons;" 2>/dev/null | xargs || echo "0")
echo "Persons in Mock HCM DB: $HCM_COUNT"
echo

echo "════════════════════════════════════════════════════════════"
echo "  ✅ Sync Demo Complete!"
echo "════════════════════════════════════════════════════════════"
echo
echo "📊 Summary:"
echo "  • Employees synced: $NEW_RECORDS"
echo "  • Total employees in DB: $AFTER_COUNT"
echo "  • Files in SFTP: $FILE_COUNT"
echo "  • Persons in HCM: $HCM_COUNT"
echo
echo "Next steps:"
echo "  • View in Adminer: http://127.0.0.1:8080"
echo "  • Check logs: docker compose -f docker-compose.integrated.yml logs -f middleware"
echo "  • Run again: ./demo-sync.sh"
echo
