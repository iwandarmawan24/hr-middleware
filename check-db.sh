#!/bin/bash

# Quick Database Check Script
# Usage: ./check-db.sh

echo "═══════════════════════════════════════════════════════════"
echo "  HRIS Metadata Database - Quick Check"
echo "═══════════════════════════════════════════════════════════"
echo

# 1. Sync Jobs
echo "📊 SYNC JOBS (Last 10)"
echo "───────────────────────────────────────────────────────────"
docker exec hris-postgres-middleware psql -U hris -d hris_metadata -c \
  "SELECT
     SUBSTRING(id::text, 1, 8) as job_id,
     job_type,
     status,
     TO_CHAR(started_at, 'YYYY-MM-DD HH24:MI:SS') as started,
     TO_CHAR(completed_at, 'YYYY-MM-DD HH24:MI:SS') as completed,
     records_total,
     records_processed
   FROM sync_jobs
   ORDER BY created_at DESC
   LIMIT 10;"
echo

# 2. Employee Count
echo "👥 EMPLOYEES"
echo "───────────────────────────────────────────────────────────"
docker exec hris-postgres-middleware psql -U hris -d hris_metadata -c \
  "SELECT
     COUNT(*) as total_employees,
     COUNT(CASE WHEN synced_at IS NOT NULL THEN 1 END) as synced,
     COUNT(CASE WHEN synced_at IS NULL THEN 1 END) as not_synced
   FROM employees;"
echo

# 3. Recent Employees
echo "📋 RECENT EMPLOYEES (Last 5)"
echo "───────────────────────────────────────────────────────────"
docker exec hris-postgres-middleware psql -U hris -d hris_metadata -c \
  "SELECT
     talenta_user_id,
     full_name,
     email,
     department,
     TO_CHAR(synced_at, 'YYYY-MM-DD HH24:MI') as last_synced
   FROM employees
   ORDER BY created_at DESC
   LIMIT 5;"
echo

# 4. Documents
echo "📄 DOCUMENTS"
echo "───────────────────────────────────────────────────────────"
docker exec hris-postgres-middleware psql -U hris -d hris_metadata -c \
  "SELECT
     document_type,
     status,
     COUNT(*) as count
   FROM documents
   GROUP BY document_type, status
   ORDER BY document_type, status;"
echo

# 5. Encrypted Files
echo "🔐 ENCRYPTED FILES"
echo "───────────────────────────────────────────────────────────"
docker exec hris-postgres-middleware psql -U hris -d hris_metadata -c \
  "SELECT
     encryption_status,
     COUNT(*) as count,
     pg_size_pretty(SUM(file_size)::bigint) as total_size
   FROM encrypted_files
   GROUP BY encryption_status
   ORDER BY encryption_status;"
echo

# 6. API Logs (Recent)
echo "📡 API LOGS (Last 5)"
echo "───────────────────────────────────────────────────────────"
docker exec hris-postgres-middleware psql -U hris -d hris_metadata -c \
  "SELECT
     endpoint,
     http_method,
     status_code,
     response_time_ms,
     TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as timestamp
   FROM api_logs
   ORDER BY created_at DESC
   LIMIT 5;"
echo

echo "═══════════════════════════════════════════════════════════"
echo "✅ Database check complete!"
echo "═══════════════════════════════════════════════════════════"
