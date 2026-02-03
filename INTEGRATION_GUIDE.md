# Integration Guide: Consume-Endpoint + HR-Middleware

## Overview

This guide explains how to integrate **consume-endpoint** (Talenta API Client) with **hr-middleware** (HRIS Middleware) to create a complete end-to-end HRIS integration system.

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     INTEGRATED ARCHITECTURE                          │
└─────────────────────────────────────────────────────────────────────┘

  Talenta API (Mekari)
        │
        │ HMAC Auth
        ▼
  ┌─────────────────┐
  │ consume-endpoint │ ◄── Real Talenta API Client (Port 3000)
  │  (API Gateway)  │     - HMAC-SHA256 Authentication
  └────────┬────────┘     - RESTful endpoints
           │              - Swagger docs
           │
           │ HTTP
           ▼
  ┌─────────────────┐
  │  hr-middleware  │ ◄── Integration Service (Port 3002)
  │  (Transformer)  │     - Data transformation
  └────────┬────────┘     - PDF generation
           │              - PGP encryption
           │              - Job scheduling
           │
           │ SFTP
           ▼
  ┌─────────────────┐
  │   Oracle OIC    │ ◄── Oracle Integration Cloud
  │  (or Mock OIC)  │     - File processing
  └────────┬────────┘     - HDL import
           │
           ▼
  ┌─────────────────┐
  │  Oracle HCM DB  │ ◄── Final destination
  │  (or Mock HCM)  │
  └─────────────────┘
```

---

## Prerequisites

1. **Docker & Docker Compose** v2.0+
2. **Mekari API Credentials**:
   - Client ID
   - Client Secret
   - Access to Talenta API
3. **System Requirements**:
   - 4GB+ RAM
   - Ports available: 3000, 3002, 5432, 5433, 6379, 8080, 2222
   - **Note for Apple Silicon (M1/M2/M3)**: Platform specifications are pre-configured for compatibility

---

## Quick Start

### 1. Setup Credentials

Copy the integrated environment file:

```bash
cd /Users/yayasandarmawan/Documents/wan-lab/hr-middleware
cp .env.integrated .env
```

Edit `.env` and add your Mekari credentials:

```env
MEKARI_API_CLIENT_ID=your_actual_client_id
MEKARI_API_CLIENT_SECRET=your_actual_client_secret
```

### 2. (Optional) Generate PGP Keys

**Note**: For development/testing, you can skip encryption by setting `SKIP_ENCRYPTION=true` in the environment.

```bash
# Option 1: Skip encryption (already configured in docker-compose.integrated.yml)
# Set SKIP_ENCRYPTION=true in the middleware service

# Option 2: Generate PGP keys for production
mkdir -p config/keys

# Generate PGP key pair
gpg --batch --gen-key <<EOF
Key-Type: RSA
Key-Length: 2048
Name-Real: HRIS Production OIC
Name-Email: oic@production.local
Expire-Date: 0
%no-protection
%commit
EOF

# Export keys
gpg --armor --export "HRIS Production OIC" > config/keys/oic_public.asc
gpg --armor --export-secret-keys "HRIS Production OIC" > config/keys/oic_private.asc

# Then set SKIP_ENCRYPTION=false in docker-compose.integrated.yml
```

### 3. Start Integrated Environment

```bash
# Start all services
docker compose -f docker-compose.integrated.yml up -d

# Check status
docker compose -f docker-compose.integrated.yml ps
```

### 4. Verify Services

```bash
# 1. Check Talenta API Client
curl http://localhost:3000/health
# Expected: {"status":"ok","service":"Talenta API Client"}

# 2. Check Middleware
curl http://localhost:3002/health
# Expected: {"status":"ok","service":"HRIS Middleware"}

# 3. Access Swagger Documentation
open http://localhost:3000
```

---

## Architecture Components

### Service Overview

| Service | Port | Description | Status |
|---------|------|-------------|--------|
| **talenta-api** | 3000 | Real Talenta API Client with HMAC auth | ✅ Production Ready |
| **middleware** | 3002 | Data transformation & sync service | ✅ Production Ready |
| **postgres-middleware** | 5432 | Middleware metadata database | ✅ Production Ready |
| **postgres-hcm** | 5433 | Mock Oracle HCM (replace in prod) | ⚠️ Demo Only |
| **redis** | 6379 | Job queue & caching | ✅ Production Ready |
| **sftp-server** | 2222 | File transfer server | ✅ Production Ready |
| **vault** | 8200 | Secrets management | ✅ Production Ready |
| **mock-oic** | - | Mock Oracle Integration Cloud | ⚠️ Demo Only |
| **adminer** | 8080 | Database UI | 🛠 Development Only |

---

## Key Differences: Demo vs Integrated

### Demo Environment (`docker-compose.demo.yml`)

```yaml
# Uses MOCK Talenta API
mock-talenta:
  ports: ["3001:3001"]
  # Returns sample/fake data

middleware:
  environment:
    - TALENTA_API_URL=http://mock-talenta:3001
    - USE_MOCK_TALENTA=true
```

**Pros**: Self-contained, works without credentials
**Cons**: Fake data, not production-ready

---

### Integrated Environment (`docker-compose.integrated.yml`)

```yaml
# Uses REAL Talenta API via consume-endpoint
talenta-api:
  ports: ["3000:3000"]
  environment:
    - MEKARI_API_CLIENT_ID=${MEKARI_API_CLIENT_ID}
    - MEKARI_API_CLIENT_SECRET=${MEKARI_API_CLIENT_SECRET}

middleware:
  environment:
    - TALENTA_API_URL=http://talenta-api:3000
    - USE_MOCK_TALENTA=false
```

**Pros**: Real Talenta data, production-ready
**Cons**: Requires Mekari credentials

---

## Usage Examples

### 1. Sync Employees from Real Talenta

```bash
# Trigger employee sync
curl -X POST http://localhost:3002/api/sync/employees

# Check sync status
curl http://localhost:3002/api/jobs | jq '.jobs[0]'
```

### 2. Process Payroll

```bash
# Sync payroll for specific period
curl -X POST http://localhost:3002/api/sync/payroll \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2026,
    "month": 1
  }'
```

### 3. Full End-to-End Sync

```bash
# Trigger complete sync (employees + payroll)
curl -X POST http://localhost:3002/api/sync/trigger

# Monitor logs
docker compose -f docker-compose.integrated.yml logs -f middleware
```

### 4. Direct API Testing via Talenta Client

```bash
# Test direct Talenta API access
curl http://localhost:3000/api/v2/talenta/employees?page=1&per_page=10

# View Swagger docs
open http://localhost:3000
```

---

## Data Flow Example

### Complete Sync Flow

1. **Trigger Sync Job**
   ```bash
   curl -X POST http://localhost:3002/api/sync/trigger
   ```

2. **Middleware Actions**:
   - Calls `http://talenta-api:3000/api/v2/talenta/employees`
   - Talenta-API makes HMAC-authenticated request to Mekari
   - Middleware transforms data to Oracle HDL format
   - Generates PDF payslips
   - Encrypts files with PGP
   - Uploads to SFTP server

3. **OIC Processing** (if using mock-oic):
   - Watches SFTP `/inbound` folder
   - Decrypts PGP files
   - Parses HDL format
   - Loads into HCM database

4. **Verify Results**:
   ```bash
   # Check middleware metadata
   docker exec -it hris-postgres-middleware psql -U hris -d hris_metadata \
     -c "SELECT * FROM sync_jobs ORDER BY created_at DESC LIMIT 5;"

   # Check HCM data
   docker exec -it hris-postgres-hcm psql -U hcm -d mock_hcm \
     -c "SELECT COUNT(*) FROM persons;"
   ```

---

## Monitoring & Debugging

### View Logs

```bash
# All services
docker compose -f docker-compose.integrated.yml logs -f

# Specific service
docker compose -f docker-compose.integrated.yml logs -f talenta-api
docker compose -f docker-compose.integrated.yml logs -f middleware

# Tail recent logs
docker compose -f docker-compose.integrated.yml logs --tail=50 middleware
```

### Check SFTP Files

```bash
# List inbound files
docker exec hris-sftp ls -lah /home/hris/data/inbound

# List archived files
docker exec hris-sftp ls -lah /home/hris/data/archive
```

### Database Queries

```bash
# Check sync jobs
docker exec -it hris-postgres-middleware psql -U hris -d hris_metadata -c \
  "SELECT job_id, job_type, status, started_at, completed_at
   FROM sync_jobs
   ORDER BY created_at DESC
   LIMIT 10;"

# Check employees
docker exec -it hris-postgres-middleware psql -U hris -d hris_metadata -c \
  "SELECT COUNT(*) as total_employees,
          COUNT(CASE WHEN sync_status = 'synced' THEN 1 END) as synced
   FROM employees;"

# Check generated documents
docker exec -it hris-postgres-middleware psql -U hris -d hris_metadata -c \
  "SELECT document_type, status, COUNT(*) as count
   FROM documents
   GROUP BY document_type, status;"
```

---

## Troubleshooting

### 1. Talenta API Authentication Errors

**Problem**: 401 Unauthorized from Talenta API

**Solution**:
```bash
# Verify credentials are set
docker compose -f docker-compose.integrated.yml exec talenta-api env | grep MEKARI

# Check Talenta API logs
docker compose -f docker-compose.integrated.yml logs talenta-api

# Test credentials manually
curl http://localhost:3000/api/v2/talenta/employees?page=1&per_page=1
```

### 2. Middleware Can't Connect to Talenta API

**Problem**: Connection refused to talenta-api

**Solution**:
```bash
# Check if talenta-api is healthy
docker compose -f docker-compose.integrated.yml ps talenta-api

# Restart talenta-api
docker compose -f docker-compose.integrated.yml restart talenta-api

# Check network connectivity
docker compose -f docker-compose.integrated.yml exec middleware ping talenta-api
```

### 3. No Data Syncing

**Problem**: Sync job completes but no data

**Solution**:
```bash
# Check middleware logs for errors
docker compose -f docker-compose.integrated.yml logs middleware | grep ERROR

# Verify Talenta API is returning data
curl http://localhost:3000/api/v2/talenta/employees?page=1&per_page=5

# Check database connection
docker compose -f docker-compose.integrated.yml exec middleware \
  psql -h postgres-middleware -U hris -d hris_metadata -c "SELECT 1;"
```

### 4. PGP Encryption Errors

**Problem**: Failed to load PGP keys or encryption errors

**Solution**:
```bash
# Option 1: Disable encryption for development (recommended)
# Edit docker-compose.integrated.yml:
# - SKIP_ENCRYPTION=true
# Then recreate the container:
docker compose -f docker-compose.integrated.yml up -d --force-recreate middleware

# Option 2: Generate and use PGP keys
# Verify keys exist and are mounted
docker compose -f docker-compose.integrated.yml exec middleware ls -la /keys/

# Check key format
gpg --show-keys config/keys/oic_public.asc

# Regenerate keys if needed (see Setup section)
```

### 5. Platform Issues (Apple Silicon)

**Problem**: "platform (linux/amd64) does not match detected host platform (linux/arm64/v8)"

**Solution**:
```bash
# Platform specifications are already configured in docker-compose.integrated.yml
# for sftp-server and adminer services

# If you still encounter issues, force recreation:
docker compose -f docker-compose.integrated.yml down
docker compose -f docker-compose.integrated.yml pull
docker compose -f docker-compose.integrated.yml up -d
```

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Replace demo passwords in `.env`
- [ ] Use production-grade PGP keys (not demo keys)
- [ ] Enable SSL/TLS for all services
- [ ] Implement proper authentication (OAuth 2.0, API keys)
- [ ] Use managed secrets (Azure Key Vault, AWS Secrets Manager)
- [ ] Replace mock-oic with real Oracle Integration Cloud
- [ ] Replace postgres-hcm with real Oracle HCM Cloud connection
- [ ] Set up monitoring (Prometheus, Grafana, ELK stack)
- [ ] Configure backup strategy for databases
- [ ] Enable audit logging
- [ ] Review and harden SFTP server configuration
- [ ] Set up proper DNS and load balancing
- [ ] Configure firewall rules
- [ ] Remove adminer service (dev only)
- [ ] Set appropriate resource limits (CPU, memory)
- [ ] Test disaster recovery procedures

---

## Cleanup

### Stop Services

```bash
# Stop all services
docker compose -f docker-compose.integrated.yml down

# Stop and remove volumes (deletes all data)
docker compose -f docker-compose.integrated.yml down -v
```

### Remove Everything

```bash
# Complete cleanup
docker compose -f docker-compose.integrated.yml down -v --rmi all
docker system prune -a --volumes
```

---

## Support & Documentation

### Project Documentation

- **HR Middleware**: `/Users/yayasandarmawan/Documents/wan-lab/hr-middleware/README.md`
- **Talenta API Client**: `/Users/yayasandarmawan/Documents/wan-lab/consume-endpoint/README.md`

### Useful Links

- Mekari API Documentation: https://developer.mekari.com/
- Oracle HCM Cloud: https://docs.oracle.com/en/cloud/saas/human-resources/
- Docker Compose Reference: https://docs.docker.com/compose/

---

## FAQ

**Q: Can I use demo environment alongside integrated environment?**

A: Yes, but they use different Docker networks and container names, so no conflicts.

**Q: How do I switch from integrated back to demo?**

A:
```bash
docker compose -f docker-compose.integrated.yml down
docker compose -f docker-compose.demo.yml up -d
```

**Q: Can I use only consume-endpoint without middleware?**

A: Yes! Consume-endpoint is standalone. Just use it as API gateway:
```bash
cd /Users/yayasandarmawan/Documents/wan-lab/consume-endpoint
docker compose up -d
curl http://localhost:3000/api/v2/talenta/employees
```

**Q: What if I don't have Oracle HCM?**

A: Keep using `mock-oic` and `postgres-hcm` for development/testing.

---

**Integration Version 1.0** | Last Updated: February 3, 2026
