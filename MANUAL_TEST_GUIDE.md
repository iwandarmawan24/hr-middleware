# 🧪 Manual Testing Guide - Alternative Flow

Karena ada issue dengan middleware API endpoints, kita bisa test flow secara manual:

## 🎯 Option 1: Test Talenta API Directly

### 1. Get Data dari Talenta API

```bash
# Test endpoint
curl "http://localhost:3000/api/employee?limit=5" | jq '.'

# Save to file
curl "http://localhost:3000/api/employee?limit=100" > employees.json
```

### 2. Insert ke Database Manually

```bash
# View the data first
cat employees.json | jq '.data.data[0]'

# Insert sample employee manually
docker exec hris-postgres-middleware psql -U hris -d hris_metadata << 'EOF'
INSERT INTO employees (talenta_user_id, full_name, email, department, position)
VALUES
  (12345, 'John Doe', 'john@example.com', 'Engineering', 'Software Engineer'),
  (12346, 'Jane Smith', 'jane@example.com', 'HR', 'HR Manager');
EOF
```

### 3. Check Database

```bash
./check-db.sh

# Or direct query
docker exec hris-postgres-middleware psql -U hris -d hris_metadata -c \
  "SELECT * FROM employees;"
```

---

## 🎯 Option 2: Create Test Files in SFTP

### 1. Create Sample CSV File

```bash
# Create sample employee CSV
cat > /tmp/employees_test.csv << 'EOF'
person_number,first_name,last_name,email,department
EMP001,John,Doe,john@example.com,Engineering
EMP002,Jane,Smith,jane@example.com,HR
EMP003,Bob,Johnson,bob@example.com,Sales
EOF
```

### 2. Copy to SFTP

```bash
# Copy file to SFTP inbound
docker cp /tmp/employees_test.csv hris-sftp:/home/hris/data/inbound/

# Create trigger file (.ok)
docker exec hris-sftp touch /home/hris/data/inbound/employees_test.ok

# Verify
docker exec hris-sftp ls -lah /home/hris/data/inbound
```

### 3. Check if Mock OIC Processes It

```bash
# Wait 10 seconds
sleep 10

# Check mock-oic logs
docker compose -f docker-compose.integrated.yml logs --tail 50 mock-oic

# Check if file moved to archive
docker exec hris-sftp ls -lah /home/hris/data/archive
```

---

## 🎯 Option 3: Direct Database Population

### Create Sample Sync Job

```bash
docker exec hris-postgres-middleware psql -U hris -d hris_metadata << 'EOF'
-- Insert a test sync job
INSERT INTO sync_jobs (job_type, status, records_total, records_processed, started_at, completed_at)
VALUES ('EMPLOYEE_SYNC', 'COMPLETED', 10, 10, NOW() - INTERVAL '5 minutes', NOW());

-- Insert test employees
INSERT INTO employees (talenta_user_id, full_name, email, department, position, synced_at)
VALUES
  (100001, 'Ahmad Santoso', 'ahmad.santoso@company.com', 'IT', 'Developer', NOW()),
  (100002, 'Siti Nurhaliza', 'siti.n@company.com', 'HR', 'HR Manager', NOW()),
  (100003, 'Budi Hartono', 'budi.h@company.com', 'Finance', 'Accountant', NOW()),
  (100004, 'Dewi Lestari', 'dewi.l@company.com', 'Marketing', 'Marketing Lead', NOW()),
  (100005, 'Rizki Pratama', 'rizki.p@company.com', 'Operations', 'Operations Manager', NOW());

-- Insert test documents
INSERT INTO documents (employee_id, document_type, document_code, document_name, period_year, period_month, status)
SELECT
  e.id,
  'PAYSLIP',
  'PAY_' || e.talenta_user_id || '_202601',
  'Payslip_January_2026_' || e.full_name || '.pdf',
  2026,
  1,
  'COMPLETED'
FROM employees e
WHERE e.talenta_user_id IN (100001, 100002, 100003);
EOF
```

### Verify Data

```bash
# Check via Adminer
open "http://127.0.0.1:8080/?pgsql=postgres-middleware&username=hris&db=hris_metadata"

# Or via CLI
./check-db.sh
```

---

## 📊 View Results

### In Adminer

1. **sync_jobs** table:
   - Should see COMPLETED job

2. **employees** table:
   - Should see 5 test employees

3. **documents** table:
   - Should see 3 documents (payslips)

### In Command Line

```bash
# Count records
docker exec hris-postgres-middleware psql -U hris -d hris_metadata -c "
  SELECT
    (SELECT COUNT(*) FROM sync_jobs) as jobs,
    (SELECT COUNT(*) FROM employees) as employees,
    (SELECT COUNT(*) FROM documents) as documents;
"

# View data
docker exec hris-postgres-middleware psql -U hris -d hris_metadata -c "
  SELECT
    e.talenta_user_id,
    e.full_name,
    e.department,
    COUNT(d.id) as total_documents
  FROM employees e
  LEFT JOIN documents d ON e.id = d.employee_id
  GROUP BY e.id, e.talenta_user_id, e.full_name, e.department
  ORDER BY e.full_name;
"
```

---

## 🔄 Complete Manual Flow Test

```bash
#!/bin/bash

echo "🧪 Manual Flow Test"
echo "==================="
echo

# 1. Clean existing data
echo "1. Cleaning existing data..."
docker exec hris-postgres-middleware psql -U hris -d hris_metadata -c "
  TRUNCATE employees CASCADE;
  DELETE FROM sync_jobs;
"

# 2. Insert test data
echo "2. Inserting test data..."
docker exec hris-postgres-middleware psql -U hris -d hris_metadata << 'EOF'
INSERT INTO sync_jobs (job_type, status, records_total, records_processed, started_at, completed_at)
VALUES ('EMPLOYEE_SYNC', 'COMPLETED', 5, 5, NOW() - INTERVAL '5 minutes', NOW());

INSERT INTO employees (talenta_user_id, full_name, email, department, position, synced_at)
VALUES
  (100001, 'Ahmad Santoso', 'ahmad.santoso@company.com', 'IT', 'Developer', NOW()),
  (100002, 'Siti Nurhaliza', 'siti.n@company.com', 'HR', 'HR Manager', NOW()),
  (100003, 'Budi Hartono', 'budi.h@company.com', 'Finance', 'Accountant', NOW()),
  (100004, 'Dewi Lestari', 'dewi.l@company.com', 'Marketing', 'Marketing Lead', NOW()),
  (100005, 'Rizki Pratama', 'rizki.p@company.com', 'Operations', 'Operations Manager', NOW());
EOF

# 3. Create CSV file
echo "3. Creating CSV file in SFTP..."
cat > /tmp/employees_export.csv << 'EOF'
person_number,first_name,last_name,email,department,position
100001,Ahmad,Santoso,ahmad.santoso@company.com,IT,Developer
100002,Siti,Nurhaliza,siti.n@company.com,HR,HR Manager
100003,Budi,Hartono,budi.h@company.com,Finance,Accountant
100004,Dewi,Lestari,dewi.l@company.com,Marketing,Marketing Lead
100005,Rizki,Pratama,rizki.p@company.com,Operations,Operations Manager
EOF

docker cp /tmp/employees_export.csv hris-sftp:/home/hris/data/inbound/
docker exec hris-sftp touch /home/hris/data/inbound/employees_export.ok

# 4. Verify
echo "4. Verifying results..."
echo
echo "📊 Database:"
docker exec hris-postgres-middleware psql -U hris -d hris_metadata -c "
  SELECT COUNT(*) as total_employees FROM employees;
"

echo
echo "📁 SFTP Files:"
docker exec hris-sftp ls -lah /home/hris/data/inbound

echo
echo "✅ Manual test complete!"
echo "View in Adminer: http://127.0.0.1:8080"
```

Save as `manual-test.sh`, make executable, and run:

```bash
chmod +x manual-test.sh
./manual-test.sh
```

---

## 🔍 Verify Complete Flow

After running manual test:

1. **Check Database (Adminer)**:
   - http://127.0.0.1:8080
   - Password: `hrispass_production`
   - Browse `employees` and `sync_jobs` tables

2. **Check SFTP**:
   ```bash
   ./check-sftp.sh
   ```

3. **Check Logs**:
   ```bash
   docker compose -f docker-compose.integrated.yml logs mock-oic
   ```

---

**Note**: This is a workaround while the middleware API endpoint issue is being fixed.

---

**Last Updated**: February 3, 2026
