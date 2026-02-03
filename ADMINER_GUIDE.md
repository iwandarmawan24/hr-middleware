# Adminer Database UI - Quick Guide

## 🌐 Cara Akses Adminer

### Method 1: Direct URL (Recommended)

Buka browser ke URL ini:

```
http://127.0.0.1:8080/?pgsql=postgres-middleware&username=hris&db=hris_metadata
```

Atau gunakan command:

```bash
open "http://127.0.0.1:8080/?pgsql=postgres-middleware&username=hris&db=hris_metadata"
```

**Password**: `hrispass`

---

### Method 2: Manual Login

1. Buka browser ke: `http://127.0.0.1:8080`

2. Isi form login:
   - **System**: Pilih **"PostgreSQL"** (PENTING! Jangan MySQL)
   - **Server**: `postgres-middleware`
   - **Username**: `hris`
   - **Password**: `hrispass`
   - **Database**: `hris_metadata`

3. Klik **Login**

---

## 📊 Apa yang Bisa Dilihat di Adminer

### 1. Tables
Setelah login, Anda akan lihat semua tables:
- `sync_jobs` - History sync jobs
- `employees` - Employee master data
- `documents` - Generated documents
- `encrypted_files` - Encrypted files info
- `encryption_keys` - PGP keys info
- `api_logs` - API call logs

### 2. SQL Query
Klik menu **SQL command** untuk run custom queries:

```sql
-- Check recent sync jobs
SELECT * FROM sync_jobs ORDER BY created_at DESC LIMIT 10;

-- Count employees
SELECT COUNT(*) FROM employees;

-- Recent employees
SELECT talenta_user_id, full_name, email, department
FROM employees
ORDER BY created_at DESC
LIMIT 20;

-- Document summary
SELECT document_type, status, COUNT(*) as count
FROM documents
GROUP BY document_type, status;
```

### 3. Table Browser
- Klik nama table untuk browse data
- Gunakan filters dan search
- Export data ke CSV/SQL

### 4. Import/Export
- Import SQL files
- Export database atau specific tables
- Backup database

---

## 🔧 Troubleshooting

### Error: "Connection refused"

**Problem**: System masih di-set ke MySQL bukan PostgreSQL

**Solution**:
1. Pilih **"PostgreSQL"** di dropdown System
2. Atau gunakan direct URL dengan `?pgsql=` parameter

---

### Error: "Access denied"

**Problem**: Password salah atau user tidak ada

**Solution**:
1. Password default: `hrispass`
2. Cek di `.env` file untuk password yang sebenarnya
3. Atau reset via docker:
   ```bash
   docker exec hris-postgres-middleware psql -U hris -d hris_metadata -c \
     "ALTER USER hris WITH PASSWORD 'hrispass';"
   ```

---

### Cannot connect to postgres-middleware

**Problem**: Network issue atau postgres container tidak running

**Solution**:
```bash
# Check if postgres is running
docker compose -f docker-compose.integrated.yml ps postgres-middleware

# Restart if needed
docker compose -f docker-compose.integrated.yml restart postgres-middleware

# Check logs
docker compose -f docker-compose.integrated.yml logs postgres-middleware
```

---

## 💡 Useful Queries

### Sync Job Status
```sql
SELECT
  SUBSTRING(id::text, 1, 8) as job_id,
  job_type,
  status,
  records_total,
  records_processed,
  records_failed,
  error_message,
  created_at
FROM sync_jobs
ORDER BY created_at DESC
LIMIT 20;
```

### Employee Statistics by Department
```sql
SELECT
  department,
  COUNT(*) as total,
  COUNT(CASE WHEN synced_at IS NOT NULL THEN 1 END) as synced
FROM employees
GROUP BY department
ORDER BY total DESC;
```

### Recent API Calls
```sql
SELECT
  endpoint,
  status_code,
  response_time_ms,
  created_at
FROM api_logs
ORDER BY created_at DESC
LIMIT 50;
```

### Document Processing Status
```sql
SELECT
  d.document_type,
  d.status,
  COUNT(*) as count,
  MIN(d.created_at) as first_created,
  MAX(d.created_at) as last_created
FROM documents d
GROUP BY d.document_type, d.status
ORDER BY d.document_type, d.status;
```

---

## 🎯 Quick Actions

### View All Employees
1. Click **employees** table
2. Browse data
3. Click column headers to sort
4. Use **Search** untuk filter

### Export Data
1. Click table name (e.g., **employees**)
2. Click **Export** button
3. Choose format (CSV, SQL, etc.)
4. Click **Export**

### Run Custom Query
1. Click **SQL command** in left menu
2. Paste your SQL query
3. Click **Execute**
4. Results shown in table format

---

## 🔐 Security Notes

- Adminer adalah **development tool only**
- **JANGAN** expose port 8080 ke public internet
- Password default (`hrispass`) harus diganti di production
- Gunakan **Permanent login** checkbox hanya di development

---

## 📚 More Information

- Adminer Documentation: https://www.adminer.org/
- PostgreSQL Documentation: https://www.postgresql.org/docs/

---

**Last Updated**: February 3, 2026
