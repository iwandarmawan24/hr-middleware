# 🚀 Trigger Sync Guide - Talenta → Metadata → SFTP

## 🎯 Complete Flow

```
Talenta API → Middleware → Metadata DB → Generate Files → SFTP → Mock OIC → HCM DB
```

---

## 1️⃣ Trigger Employee Sync

### Via API Call

```bash
# Trigger employee sync
curl -X POST http://localhost:3002/api/sync/employees

# Expected response:
# {"status":"success","message":"Employee sync started","jobId":"..."}
```

### Monitor Progress

```bash
# Check job status (in new terminal)
curl http://localhost:3002/api/jobs | jq '.jobs[0]'

# Or follow logs
docker compose -f docker-compose.integrated.yml logs -f middleware
```

---

## 2️⃣ Check Metadata Database

### Via Adminer
1. Refresh browser (http://127.0.0.1:8080)
2. Click **sync_jobs** table → See the running/completed job
3. Click **employees** table → See employee data

### Via Command Line
```bash
# Run check script
./check-db.sh

# Or manual query
docker exec hris-postgres-middleware psql -U hris -d hris_metadata -c \
  "SELECT COUNT(*) FROM employees;"
```

---

## 3️⃣ Check SFTP Files

### Via Command Line
```bash
# Run check script
./check-sftp.sh

# Or manual check
docker exec hris-sftp ls -lah /home/hris/data/inbound

# View file content (if CSV)
docker exec hris-sftp cat /home/hris/data/inbound/employees_*.csv
```

---

## 4️⃣ Complete Demo Script

Save this as `demo-sync.sh`:

```bash
#!/bin/bash

echo "════════════════════════════════════════════════════════════"
echo "  🚀 HRIS Sync Demo - Talenta → Metadata → SFTP"
echo "════════════════════════════════════════════════════════════"
echo

# Step 1: Check initial state
echo "📊 Step 1: Checking initial state..."
echo "─────────────────────────────────────────────────────────────"
BEFORE_COUNT=$(docker exec hris-postgres-middleware psql -U hris -d hris_metadata -t -c "SELECT COUNT(*) FROM employees;")
echo "Employees in DB: $BEFORE_COUNT"
echo

# Step 2: Trigger sync
echo "🔄 Step 2: Triggering employee sync..."
echo "─────────────────────────────────────────────────────────────"
RESPONSE=$(curl -s -X POST http://localhost:3002/api/sync/employees)
echo "API Response: $RESPONSE"
JOB_ID=$(echo $RESPONSE | jq -r '.jobId // empty')
echo "Job ID: $JOB_ID"
echo

# Step 3: Wait for processing
echo "⏳ Step 3: Waiting 15 seconds for processing..."
echo "─────────────────────────────────────────────────────────────"
for i in {15..1}; do
  echo -ne "  $i seconds remaining...\r"
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
   LIMIT 1;"
echo

# Step 5: Check employees
echo "👥 Step 5: Checking employees in metadata DB..."
echo "─────────────────────────────────────────────────────────────"
AFTER_COUNT=$(docker exec hris-postgres-middleware psql -U hris -d hris_metadata -t -c "SELECT COUNT(*) FROM employees;")
echo "Employees in DB: $AFTER_COUNT (was: $BEFORE_COUNT)"
echo
docker exec hris-postgres-middleware psql -U hris -d hris_metadata -c \
  "SELECT
     talenta_user_id,
     full_name,
     email,
     department
   FROM employees
   ORDER BY created_at DESC
   LIMIT 5;"
echo

# Step 6: Check SFTP files
echo "📁 Step 6: Checking SFTP files..."
echo "─────────────────────────────────────────────────────────────"
FILE_COUNT=$(docker exec hris-sftp find /home/hris/data/inbound -type f 2>/dev/null | wc -l)
echo "Files in SFTP inbound: $FILE_COUNT"
echo
docker exec hris-sftp ls -lah /home/hris/data/inbound
echo

# Step 7: Show file content (if exists)
if [ $FILE_COUNT -gt 0 ]; then
  echo "📄 Step 7: Sample file content..."
  echo "─────────────────────────────────────────────────────────────"
  FIRST_FILE=$(docker exec hris-sftp find /home/hris/data/inbound -type f -name "*.csv" 2>/dev/null | head -1)
  if [ -n "$FIRST_FILE" ]; then
    echo "File: $FIRST_FILE"
    echo "First 10 lines:"
    docker exec hris-sftp head -10 "$FIRST_FILE"
  fi
fi

echo
echo "════════════════════════════════════════════════════════════"
echo "  ✅ Sync Demo Complete!"
echo "════════════════════════════════════════════════════════════"
echo
echo "Next steps:"
echo "  • View in Adminer: http://127.0.0.1:8080"
echo "  • Check logs: docker compose -f docker-compose.integrated.yml logs -f middleware"
echo "  • Run again: ./demo-sync.sh"
```

---

## 5️⃣ Payroll Sync (Optional)

```bash
# Trigger payroll sync for specific month
curl -X POST http://localhost:3002/api/sync/payroll \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2026,
    "month": 1
  }'
```

---

## 6️⃣ Full Sync (All Data)

```bash
# Trigger complete sync (employees + payroll)
curl -X POST http://localhost:3002/api/sync/trigger
```

---

## 🔍 Monitoring Tools

### Real-time Logs
```bash
# Follow middleware logs
docker compose -f docker-compose.integrated.yml logs -f middleware

# Follow all services
docker compose -f docker-compose.integrated.yml logs -f
```

### Database Monitoring
```bash
# Watch sync jobs (updates every 2 seconds)
watch -n 2 "docker exec hris-postgres-middleware psql -U hris -d hris_metadata -c \
  'SELECT SUBSTRING(id::text, 1, 8) as job_id, job_type, status, records_processed
   FROM sync_jobs ORDER BY created_at DESC LIMIT 5;'"
```

### SFTP Monitoring
```bash
# Watch SFTP inbound folder
watch -n 2 "docker exec hris-sftp ls -lah /home/hris/data/inbound"
```

---

## 🐛 Troubleshooting

### No data synced

**Check middleware logs:**
```bash
docker compose -f docker-compose.integrated.yml logs middleware | grep -i error
```

**Check Talenta API:**
```bash
# Test if Talenta API is responding
curl http://localhost:3000/api/employee?limit=1
```

**Check sync job status:**
```bash
docker exec hris-postgres-middleware psql -U hris -d hris_metadata -c \
  "SELECT * FROM sync_jobs WHERE status = 'FAILED' ORDER BY created_at DESC LIMIT 1;"
```

---

### Files not in SFTP

**Check middleware environment:**
```bash
docker compose -f docker-compose.integrated.yml exec middleware env | grep SKIP_UPLOAD
# Should be: SKIP_UPLOAD=false
```

**Check SFTP connection:**
```bash
docker compose -f docker-compose.integrated.yml logs middleware | grep -i sftp
```

---

### API 404 Error

**Check available endpoints:**
```bash
# List middleware routes
curl http://localhost:3002/health

# Check Talenta API endpoints
curl http://localhost:3000/api
```

---

## 📊 Expected Results

After successful sync:

1. **Metadata DB**:
   - `sync_jobs`: 1+ rows with status = 'COMPLETED'
   - `employees`: N rows (from Talenta)
   - `documents`: N rows (if payroll sync)

2. **SFTP**:
   - `/data/inbound/employees_YYYYMMDD.csv` (or .csv.pgp if encrypted)
   - `/data/inbound/employees_YYYYMMDD.ok` (trigger file)
   - More files if payroll sync

3. **Mock HCM** (if mock-oic processed):
   - `persons` table has employee data

---

## 🎯 Quick Commands

```bash
# Trigger sync
curl -X POST http://localhost:3002/api/sync/employees

# Check database
./check-db.sh

# Check SFTP
./check-sftp.sh

# View in Adminer
open "http://127.0.0.1:8080/?pgsql=postgres-middleware&username=hris&db=hris_metadata"

# Follow logs
docker compose -f docker-compose.integrated.yml logs -f middleware
```

---

**Pro Tip**: Run `./demo-sync.sh` untuk see complete flow dengan monitoring otomatis!

---

**Last Updated**: February 3, 2026
