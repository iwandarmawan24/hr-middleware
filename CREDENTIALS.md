# 🔐 Credentials & Access Information

## Database Access

### PostgreSQL Middleware Database

**Via Adminer Web UI:**
- URL: http://127.0.0.1:8080/?pgsql=postgres-middleware&username=hris&db=hris_metadata
- System: **PostgreSQL**
- Server: `postgres-middleware`
- Username: `hris`
- Password: **`hrispass_production`**
- Database: `hris_metadata`

**Via Command Line:**
```bash
# From host machine
docker exec hris-postgres-middleware psql -U hris -d hris_metadata

# With password (for external connections)
PGPASSWORD=hrispass_production psql -h localhost -p 5432 -U hris -d hris_metadata
```

---

### PostgreSQL HCM Database (Mock)

**Via Adminer Web UI:**
- URL: http://127.0.0.1:8080/?pgsql=postgres-hcm&username=hcm&db=mock_hcm
- System: **PostgreSQL**
- Server: `postgres-hcm`
- Username: `hcm`
- Password: **`hcmpass_production`**
- Database: `mock_hcm`

**Via Command Line:**
```bash
# From host machine
docker exec hris-postgres-hcm psql -U hcm -d mock_hcm

# With password
PGPASSWORD=hcmpass_production psql -h localhost -p 5433 -U hcm -d mock_hcm
```

---

## SFTP Access

**Credentials:**
- Host: `localhost`
- Port: `2222`
- Username: `hris`
- Password: **`hrispass_production`** (check .env for SFTP_PASSWORD)

**Connect via SFTP:**
```bash
sftp -P 2222 hris@localhost
# Password: hrispass_production (or check SFTP_PASSWORD in .env)
```

**Browse Files:**
```bash
# List inbound files
docker exec hris-sftp ls -lah /home/hris/data/inbound

# List archive files
docker exec hris-sftp ls -lah /home/hris/data/archive
```

---

## API Access

### Middleware API
- URL: http://localhost:3002
- Health: http://localhost:3002/health
- No authentication required (development)

### Talenta API Client
- URL: http://localhost:3000
- Swagger: http://localhost:3000/api-docs
- Health: http://localhost:3000/health
- No authentication required (HMAC handled internally)

---

## Vault (Secrets Management)

- URL: http://localhost:8200
- Root Token: `devtoken` (development only)
- Environment: Development mode

**Access:**
```bash
export VAULT_ADDR='http://localhost:8200'
export VAULT_TOKEN='devtoken'
vault status
```

---

## Redis

- Host: `localhost`
- Port: `6379`
- No password (development)

**Access:**
```bash
docker exec hris-redis redis-cli
# Then: PING (should return PONG)
```

---

## Service URLs Summary

| Service | URL | Username | Password |
|---------|-----|----------|----------|
| **Adminer** | http://localhost:8080 | - | - |
| **Middleware API** | http://localhost:3002 | - | - |
| **Talenta API** | http://localhost:3000 | - | - |
| **Vault** | http://localhost:8200 | - | `devtoken` |
| **PostgreSQL (Middleware)** | localhost:5432 | `hris` | `hrispass_production` |
| **PostgreSQL (HCM)** | localhost:5433 | `hcm` | `hcmpass_production` |
| **SFTP** | localhost:2222 | `hris` | See `.env` SFTP_PASSWORD |
| **Redis** | localhost:6379 | - | - |

---

## Environment Variables

Check your `.env` file for actual passwords:

```bash
cat .env | grep PASSWORD
```

**Default values** (from `.env.integrated`):
- `DB_PASSWORD=hrispass_production`
- `HCM_DB_PASSWORD=hcmpass_production`
- `SFTP_PASSWORD=` (check your .env)
- `VAULT_TOKEN=devtoken`

---

## Quick Access Scripts

### Database Access
```bash
# Middleware DB
./check-db.sh

# Or direct SQL
docker exec hris-postgres-middleware psql -U hris -d hris_metadata
```

### SFTP Access
```bash
# Check files
./check-sftp.sh

# Or direct SFTP
sftp -P 2222 hris@localhost
```

### Adminer Quick Launch
```bash
# PostgreSQL Middleware DB
open "http://127.0.0.1:8080/?pgsql=postgres-middleware&username=hris&db=hris_metadata"

# PostgreSQL HCM DB
open "http://127.0.0.1:8080/?pgsql=postgres-hcm&username=hcm&db=mock_hcm"
```

---

## Security Notes

⚠️ **IMPORTANT**: These are **development credentials only**!

For production:
1. Change all passwords in `.env`
2. Use strong, unique passwords
3. Enable SSL/TLS for all services
4. Use proper secrets management (Azure Key Vault, AWS Secrets Manager, etc.)
5. Enable authentication for APIs
6. Restrict network access
7. Remove Adminer (development tool only)

---

## Troubleshooting

### "Password authentication failed"

**Solution**: Use the correct password from `.env`:
```bash
cat .env | grep DB_PASSWORD
# DB_PASSWORD=hrispass_production
```

Then use `hrispass_production` in Adminer.

### "Connection refused"

1. Check if service is running:
   ```bash
   docker compose -f docker-compose.integrated.yml ps
   ```

2. Restart service:
   ```bash
   docker compose -f docker-compose.integrated.yml restart postgres-middleware
   ```

### "Wrong database system selected"

In Adminer, make sure to select **"PostgreSQL"** not "MySQL"!

---

**Last Updated**: February 3, 2026
**Environment**: Development/Testing
