# Quick Sync Guide - Trigger & Monitor

## 🎯 Overview

Panduan cepat untuk trigger sync job dan melihat hasilnya di metadata database dan SFTP filesystem.

---

## 1️⃣ Trigger Employee Sync

### Via API

```bash
# Trigger employee sync
curl -X POST http://localhost:3002/api/sync/employees

# Expected response:
# {"status":"success","message":"Employee sync job started","jobId":"..."}
```

### Monitor Progress

```bash
# Check job status
curl http://localhost:3002/api/jobs | jq '.jobs[0]'

# Follow middleware logs
docker compose -f docker-compose.integrated.yml logs -f middleware
```

---

## 2️⃣ Trigger Payroll Sync

### Via API

```bash
# Sync payroll for January 2026
curl -X POST http://localhost:3002/api/sync/payroll \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2026,
    "month": 1
  }'

# Expected response:
# {"status":"success","message":"Payroll sync job started","jobId":"..."}
```

---

## 3️⃣ Full Sync (Everything)

```bash
# Trigger complete sync (employees + payroll)
curl -X POST http://localhost:3002/api/sync/trigger

# Expected response:
# {"status":"success","message":"Full sync job started","jobId":"..."}
```

---

## 📊 Check Metadata Database

### Quick Check via Docker

```bash
# Check sync jobs
docker exec -it hris-postgres-middleware psql -U hris -d hris_metadata -c \
  "SELECT job_id, job_type, status, started_at, completed_at
   FROM sync_jobs
   ORDER BY created_at DESC
   LIMIT 10;"

# Check employees count
docker exec -it hris-postgres-middleware psql -U hris -d hris_metadata -c \
  "SELECT COUNT(*) as total_employees FROM employees;"

# Check employees details
docker exec -it hris-postgres-middleware psql -U hris -d hris_metadata -c \
  "SELECT talenta_user_id, full_name, email, department, sync_status
   FROM employees
   LIMIT 10;"

# Check documents
docker exec -it hris-postgres-middleware psql -U hris -d hris_metadata -c \
  "SELECT document_type, status, COUNT(*) as count
   FROM documents
   GROUP BY document_type, status;"
```

### Interactive Database Session

```bash
# Connect to database
docker exec -it hris-postgres-middleware psql -U hris -d hris_metadata

# Then run queries interactively:
hris_metadata=# \dt                    -- List all tables
hris_metadata=# SELECT COUNT(*) FROM employees;
hris_metadata=# SELECT * FROM sync_jobs ORDER BY created_at DESC LIMIT 5;
hris_metadata=# \q                     -- Exit
```

### Via Adminer Web UI

```bash
# Open Adminer in browser
open http://localhost:8080

# Login credentials:
# System: PostgreSQL
# Server: postgres-middleware
# Username: hris
# Password: hrispass (or check your .env)
# Database: hris_metadata
```

---

## 📁 Check SFTP Filesystem

### List Files in SFTP

```bash
# List inbound folder (files uploaded by middleware)
docker exec hris-sftp ls -lah /home/hris/data/inbound

# Expected output:
# drwxr-xr-x  employees_20260203.csv
# -rw-r--r--  employees_20260203.csv.pgp
# -rw-r--r--  employees_20260203.ok
# drwxr-xr-x  payroll_202601.csv
# etc...

# List archive folder (processed files)
docker exec hris-sftp ls -lah /home/hris/data/archive

# List all data
docker exec hris-sftp find /home/hris/data -type f -ls
```

### View File Contents

```bash
# View a CSV file (if not encrypted)
docker exec hris-sftp cat /home/hris/data/inbound/employees_20260203.csv

# View first 10 lines
docker exec hris-sftp head -10 /home/hris/data/inbound/employees_20260203.csv

# Count files
docker exec hris-sftp find /home/hris/data/inbound -type f | wc -l
```

### Download Files from SFTP

```bash
# Using sftp command
sftp -P 2222 hris@localhost

# In SFTP session:
sftp> cd data/inbound
sftp> ls
sftp> get employees_20260203.csv
sftp> exit

# Password: hrispass (or check your .env)
```

### Alternative: Copy files directly

```bash
# Copy files from container to local machine
docker cp hris-sftp:/home/hris/data/inbound ./local-sftp-backup

# View locally
ls -lah ./local-sftp-backup
```

---

## 🔍 Complete Monitoring Example

### Step-by-Step Workflow

```bash
# 1. Trigger sync
echo "=== Triggering sync ==="
curl -X POST http://localhost:3002/api/sync/employees

# 2. Wait a few seconds
sleep 5

# 3. Check job status
echo "=== Checking job status ==="
curl http://localhost:3002/api/jobs | jq '.jobs[0]'

# 4. Check metadata database
echo "=== Checking metadata database ==="
docker exec -it hris-postgres-middleware psql -U hris -d hris_metadata -c \
  "SELECT COUNT(*) as total FROM employees;"

# 5. Check SFTP files
echo "=== Checking SFTP files ==="
docker exec hris-sftp ls -lah /home/hris/data/inbound

# 6. Check mock HCM database (if mock-oic processed files)
echo "=== Checking mock HCM ==="
docker exec -it hris-postgres-hcm psql -U hcm -d mock_hcm -c \
  "SELECT COUNT(*) as imported_employees FROM persons;"
```

---

## 📋 Useful Database Queries

### Sync Jobs

```sql
-- Recent jobs
SELECT job_id, job_type, status,
       started_at, completed_at,
       error_message
FROM sync_jobs
ORDER BY created_at DESC
LIMIT 20;

-- Failed jobs
SELECT * FROM sync_jobs
WHERE status = 'failed'
ORDER BY created_at DESC;

-- Job statistics
SELECT job_type, status, COUNT(*) as count
FROM sync_jobs
GROUP BY job_type, status;
```

### Employees

```sql
-- Total employees
SELECT COUNT(*) as total FROM employees;

-- Employees by department
SELECT department, COUNT(*) as count
FROM employees
GROUP BY department;

-- Recently synced
SELECT talenta_user_id, full_name,
       sync_status, last_sync_at
FROM employees
ORDER BY last_sync_at DESC NULLS LAST
LIMIT 10;

-- Employees with errors
SELECT * FROM employees
WHERE sync_status = 'error';
```

### Documents

```sql
-- Document summary
SELECT document_type, status, COUNT(*) as count
FROM documents
GROUP BY document_type, status;

-- Recent documents
SELECT employee_id, document_type,
       file_path, status, created_at
FROM documents
ORDER BY created_at DESC
LIMIT 20;

-- Failed uploads
SELECT * FROM documents
WHERE status = 'upload_failed';
```

### File Uploads

```sql
-- Recent uploads
SELECT upload_id, file_path, file_size,
       upload_status, uploaded_at
FROM file_uploads
ORDER BY uploaded_at DESC
LIMIT 10;

-- Upload statistics
SELECT upload_status, COUNT(*) as count,
       SUM(file_size) as total_size
FROM file_uploads
GROUP BY upload_status;
```

---

## 🎬 Quick Demo Script

Save as `test-sync.sh`:

```bash
#!/bin/bash

echo "🚀 Starting HRIS Sync Demo..."
echo

# 1. Trigger employee sync
echo "1️⃣ Triggering employee sync..."
RESPONSE=$(curl -s -X POST http://localhost:3002/api/sync/employees)
echo "Response: $RESPONSE"
JOB_ID=$(echo $RESPONSE | jq -r '.jobId')
echo "Job ID: $JOB_ID"
echo

# 2. Wait for processing
echo "2️⃣ Waiting 10 seconds for processing..."
sleep 10
echo

# 3. Check job status
echo "3️⃣ Checking job status..."
curl -s http://localhost:3002/api/jobs | jq '.jobs[0]'
echo

# 4. Check employees in database
echo "4️⃣ Checking employees in metadata DB..."
docker exec -it hris-postgres-middleware psql -U hris -d hris_metadata -c \
  "SELECT COUNT(*) as total_employees FROM employees;"
echo

# 5. Show recent employees
echo "5️⃣ Recent employees:"
docker exec -it hris-postgres-middleware psql -U hris -d hris_metadata -c \
  "SELECT talenta_user_id, full_name, email, department
   FROM employees
   ORDER BY created_at DESC
   LIMIT 5;"
echo

# 6. Check SFTP files
echo "6️⃣ Files in SFTP inbound:"
docker exec hris-sftp ls -lah /home/hris/data/inbound
echo

# 7. Check if files processed by mock-oic
echo "7️⃣ Checking mock HCM database..."
docker exec -it hris-postgres-hcm psql -U hcm -d mock_hcm -c \
  "SELECT COUNT(*) as imported_persons FROM persons;"
echo

echo "✅ Demo complete!"
```

Make it executable:

```bash
chmod +x test-sync.sh
./test-sync.sh
```

---

## 🔧 Troubleshooting

### No files in SFTP

**Problem**: SFTP folder is empty after sync

**Check**:
```bash
# Check middleware logs
docker compose -f docker-compose.integrated.yml logs middleware | grep -i sftp

# Check if SKIP_UPLOAD is set
docker compose -f docker-compose.integrated.yml exec middleware env | grep SKIP
```

### No data in database

**Problem**: Database is empty after sync

**Check**:
```bash
# Check if sync job completed
docker exec -it hris-postgres-middleware psql -U hris -d hris_metadata -c \
  "SELECT * FROM sync_jobs ORDER BY created_at DESC LIMIT 1;"

# Check middleware logs for errors
docker compose -f docker-compose.integrated.yml logs middleware | grep -i error
```

### Files not processed by OIC

**Problem**: Files in SFTP but not in HCM database

**Check**:
```bash
# Check mock-oic logs
docker compose -f docker-compose.integrated.yml logs mock-oic

# Check if .ok trigger file exists
docker exec hris-sftp ls -lah /home/hris/data/inbound/*.ok

# Manually trigger file watcher (restart mock-oic)
docker compose -f docker-compose.integrated.yml restart mock-oic
```

---

## 📚 Reference

### API Endpoints

- `POST /api/sync/employees` - Sync employees from Talenta
- `POST /api/sync/payroll` - Sync payroll data
- `POST /api/sync/trigger` - Full sync (employees + payroll)
- `GET /api/jobs` - Get all sync jobs
- `GET /api/jobs/:jobId` - Get specific job
- `GET /health` - Health check

### Database Tables

- `sync_jobs` - All sync job history
- `employees` - Employee master data
- `documents` - Generated documents (PDFs, etc)
- `file_uploads` - SFTP upload tracking
- `payroll_records` - Payroll data

### SFTP Paths

- `/home/hris/data/inbound` - Files uploaded by middleware
- `/home/hris/data/archive` - Processed files
- `/home/hris/data/output` - Generated outputs

---

**Happy Syncing! 🎉**

**Last Updated**: February 3, 2026
