# HRIS Middleware - Demo Environment
## Talenta HR → Oracle HCM Cloud Integration

This is a **demo environment** for the HRIS middleware that integrates Talenta HR with Oracle HCM Cloud. It includes mock services to simulate both Talenta API and Oracle Integration Cloud (OIC) for development and testing purposes.

---

## 🎯 Overview

This middleware bridges **Talenta HR** (Mekari HRIS) and **Oracle HCM Cloud**, handling:
- Employee data synchronization
- Payroll data transformation
- PDF document generation (payslips, tax statements)
- PGP encryption
- SFTP file transfer
- HDL format conversion

### Architecture

```
Talenta API → Middleware → SFTP → Mock OIC → Mock HCM Database
    (Mock)                          (Demo)      (PostgreSQL)
```

---

## 📋 Prerequisites

- **Docker** & **Docker Compose** (v2.0+)
- **4GB+ RAM** available
- **Ports** available: 3001, 3002, 5432, 5433, 6379, 8080, 8200, 2222
- **Note for Apple Silicon (M1/M2/M3)**: Some images use platform emulation (linux/amd64)

---

## 🚀 Quick Start

### 1. (Optional) Generate PGP Keys

**Note**: For development/testing, you can skip encryption by using `SKIP_ENCRYPTION=true` in the docker-compose file.

```bash
# Create keys directory (if you want encryption)
mkdir -p config/keys

# Generate PGP key pair (optional)
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
```

**Alternative**: Use `SKIP_ENCRYPTION=true` in your environment (already set in demo)

### 2. Start All Services

```bash
# Start demo environment
docker compose -f docker-compose.demo.yml up -d

# Check status
docker compose -f docker-compose.demo.yml ps
```

### 3. Verify Services

```bash
# Check Mock Talenta API
curl http://localhost:3001/health

# Check Middleware
curl http://localhost:3002/health

# Access Adminer (Database UI)
open http://localhost:8080
```

---

## 🔧 Services

| Service | Port | Description | Access |
|---------|------|-------------|--------|
| **Mock Talenta API** | 3001 | Simulates Talenta HR API | http://localhost:3001 |
| **Middleware** | 3002 | Main integration service | http://localhost:3002 |
| **PostgreSQL (Middleware)** | 5432 | Metadata database | `psql -h localhost -U hris hris_metadata` |
| **PostgreSQL (Mock HCM)** | 5433 | Mock Oracle HCM | `psql -h localhost -p 5433 -U hcm mock_hcm` |
| **Redis** | 6379 | Job queue | `redis-cli -p 6379` |
| **SFTP Server** | 2222 | File transfer | `sftp -P 2222 hris@localhost` |
| **Vault** | 8200 | Secrets management | http://localhost:8200 |
| **Adminer** | 8080 | Database UI | http://localhost:8080 |

---

## 📊 Sample Data

The Mock Talenta API comes pre-loaded with sample data:
- **50 employees** across multiple departments
- **6 months** of payroll history per employee
- **30 days** of attendance records
- Realistic Indonesian names, NIK, salary data

---

## 🔄 Running a Sync Job

### Manual Sync via API

```bash
# Sync all employees
curl -X POST http://localhost:3002/api/sync/employees

# Sync payroll for specific period
curl -X POST http://localhost:3002/api/sync/payroll \
  -H "Content-Type: application/json" \
  -d '{"year": 2026, "month": 1}'

# Full sync (employees + payroll)
curl -X POST http://localhost:3002/api/sync/trigger
```

### Check Job Status

```bash
# Get recent sync jobs
curl http://localhost:3002/api/jobs | jq '.'
```

---

## 📁 Data Flow

### Complete Flow Example

1. **Trigger Sync**
   ```bash
   curl -X POST http://localhost:3002/api/sync/trigger
   ```

2. **Middleware Process**
   - Fetches data from Mock Talenta API
   - Generates PDFs (payslips)
   - Transforms to Oracle HDL format
   - Encrypts files with PGP
   - Uploads to SFTP

3. **Mock OIC Process**
   - Watches SFTP `/inbound` folder for `.ok` trigger files
   - Decrypts PGP files
   - Parses CSV/HDL format
   - Loads data into Mock HCM database

4. **Verify Results**
   ```bash
   # Check Mock HCM database
   docker exec -it hris-postgres-hcm psql -U hcm -d mock_hcm -c "SELECT * FROM persons LIMIT 5;"

   # Check documents
   docker exec -it hris-postgres-hcm psql -U hcm -d mock_hcm -c "SELECT * FROM documents_of_record;"

   # Check import logs
   docker exec -it hris-postgres-hcm psql -U hcm -d mock_hcm -c "SELECT * FROM hdl_import_log ORDER BY created_at DESC;"
   ```

---

## 🗂️ Directory Structure

```
.
├── services/
│   ├── mock-talenta/          # Mock Talenta HR API
│   │   ├── src/
│   │   │   ├── server.js
│   │   │   └── seed-data.js
│   │   ├── data/              # Generated sample data
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── middleware/            # Main middleware service
│   │   ├── src/
│   │   │   ├── api-consumer/
│   │   │   ├── transformer/
│   │   │   ├── pdf-generator/
│   │   │   ├── encryption/
│   │   │   ├── sftp-uploader/
│   │   │   ├── utils/
│   │   │   ├── config.js
│   │   │   └── index.js
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── mock-oic/              # Mock Oracle Integration Cloud
│       ├── src/
│       │   └── index.js
│       ├── Dockerfile
│       └── package.json
│
├── database/
│   ├── middleware-schema.sql  # Metadata DB schema
│   └── mock-hcm-schema.sql    # Mock HCM schema
│
├── config/
│   └── keys/                  # PGP keys
│       ├── oic_public.asc
│       └── oic_private.asc
│
├── docker-compose.demo.yml
├── .env.demo
└── README.md
```

---

## 🔍 Monitoring & Debugging

### View Logs

```bash
# All services
docker compose -f docker-compose.demo.yml logs -f

# Specific service
docker compose -f docker-compose.demo.yml logs -f middleware
docker compose -f docker-compose.demo.yml logs -f mock-oic

# Tail logs
docker compose -f docker-compose.demo.yml logs --tail=100 middleware
```

### Check SFTP Files

```bash
# List inbound files
docker exec hris-sftp ls -la /home/hris/data/inbound

# List archive
docker exec hris-sftp ls -la /home/hris/data/archive
```

### Database Queries

```bash
# Middleware DB - Check sync jobs
docker exec -it hris-postgres-middleware psql -U hris -d hris_metadata -c \
  "SELECT * FROM sync_jobs ORDER BY created_at DESC LIMIT 10;"

# Mock HCM DB - Check imported persons
docker exec -it hris-postgres-hcm psql -U hcm -d mock_hcm -c \
  "SELECT COUNT(*) as total_employees FROM persons;"

# Mock HCM DB - Check documents
docker exec -it hris-postgres-hcm psql -U hcm -d mock_hcm -c \
  "SELECT person_number, document_type, document_name, created_at FROM documents_of_record ORDER BY created_at DESC LIMIT 10;"
```

---

## 🛠️ Troubleshooting

### Services Won't Start

```bash
# Check if ports are already in use
lsof -i :3001 -i :3002 -i :5432 -i :5433

# Remove old containers/volumes
docker compose -f docker-compose.demo.yml down -v

# Rebuild and start fresh
docker compose -f docker-compose.demo.yml up --build -d
```

### No Sample Data

```bash
# Regenerate sample data for Mock Talenta
docker exec hris-mock-talenta npm run seed

# Restart Mock Talenta
docker compose -f docker-compose.demo.yml restart mock-talenta
```

### PGP Encryption Errors

```bash
# Option 1: Disable encryption for development
# Edit docker-compose.demo.yml and set:
# - SKIP_ENCRYPTION=true

# Option 2: Generate keys
# Verify keys exist
ls -la config/keys/

# Check key format
gpg --show-keys config/keys/oic_public.asc
gpg --show-keys config/keys/oic_private.asc

# Regenerate if needed (see Quick Start section)
```

### Platform Issues (Apple Silicon)

```bash
# Error: "platform (linux/amd64) does not match detected host platform (linux/arm64/v8)"
# Solution: Platform specifications are already set in docker-compose files

# If you still encounter issues:
docker compose -f docker-compose.demo.yml down
docker compose -f docker-compose.demo.yml pull
docker compose -f docker-compose.demo.yml up -d
```

### Database Connection Issues

```bash
# Check database health
docker compose -f docker-compose.demo.yml ps postgres-middleware postgres-hcm

# Restart databases
docker compose -f docker-compose.demo.yml restart postgres-middleware postgres-hcm

# Check logs
docker compose -f docker-compose.demo.yml logs postgres-middleware
```

---

## 🧪 Testing Scenarios

### Scenario 1: Employee Sync

```bash
# 1. Check current employees in middleware DB
docker exec -it hris-postgres-middleware psql -U hris -d hris_metadata -c \
  "SELECT COUNT(*) FROM employees;"

# 2. Trigger sync
curl -X POST http://localhost:3002/api/sync/employees

# 3. Verify sync
docker exec -it hris-postgres-middleware psql -U hris -d hris_metadata -c \
  "SELECT talenta_user_id, full_name, department FROM employees LIMIT 10;"
```

### Scenario 2: Payroll Processing & Document Generation

```bash
# 1. Process payroll for January 2026
curl -X POST http://localhost:3002/api/sync/payroll \
  -H "Content-Type: application/json" \
  -d '{"year": 2026, "month": 1}'

# 2. Check generated documents in middleware DB
docker exec -it hris-postgres-middleware psql -U hris -d hris_metadata -c \
  "SELECT document_type, status, COUNT(*) FROM documents GROUP BY document_type, status;"

# 3. Check SFTP inbound folder
docker exec hris-sftp ls -la /home/hris/data/inbound

# 4. Wait for Mock OIC to process (check logs)
docker compose -f docker-compose.demo.yml logs -f mock-oic

# 5. Verify in Mock HCM
docker exec -it hris-postgres-hcm psql -U hcm -d mock_hcm -c \
  "SELECT * FROM v_employee_documents LIMIT 10;"
```

### Scenario 3: End-to-End Integration Test

```bash
# Run the complete flow
./test-integration.sh

# Or manually:
# 1. Full sync
curl -X POST http://localhost:3002/api/sync/trigger

# 2. Wait 30 seconds for processing

# 3. Check results
curl http://localhost:3002/api/jobs | jq '.jobs[0]'

# 4. Verify in Mock HCM
docker exec -it hris-postgres-hcm psql -U hcm -d mock_hcm -c \
  "SELECT * FROM v_import_statistics;"
```

---

## 🔒 Security Notes (Demo Only)

**⚠️ WARNING: This is a DEMO environment with insecure defaults!**

- Uses hardcoded passwords
- PGP keys are for testing only
- No SSL/TLS encryption
- No authentication on APIs
- **DO NOT USE IN PRODUCTION**

For production deployment:
- Use proper secrets management (Vault, Azure Key Vault, etc.)
- Generate production-grade PGP keys
- Enable SSL/TLS
- Implement OAuth 2.0 / API key authentication
- Use strong, unique passwords
- Enable audit logging

---

## 🧹 Cleanup

```bash
# Stop all services
docker compose -f docker-compose.demo.yml down

# Remove volumes (delete all data)
docker compose -f docker-compose.demo.yml down -v

# Remove images
docker compose -f docker-compose.demo.yml down --rmi all

# Complete cleanup
docker system prune -a --volumes
```

---

## 📚 Additional Documentation

- [Technical Specification](./docs/technical-spec.md) - Full technical details
- [API Reference](./docs/api-reference.md) - API endpoints documentation
- [HDL Format Guide](./docs/hdl-format.md) - Oracle HDL format reference
- [Troubleshooting Guide](./docs/troubleshooting.md) - Common issues and solutions

---

## 🤝 Contributing

This is a demo/reference implementation. For questions or improvements:

1. Check existing documentation
2. Review logs and database state
3. Test in isolated Docker environment
4. Document any changes

---

## 📄 License

MIT License - See LICENSE file for details

---

## 📞 Support

For technical issues:
- Check troubleshooting section above
- Review service logs
- Inspect database state
- Consult technical specification document

---

**Demo Version 1.0** | Last Updated: February 2, 2026
