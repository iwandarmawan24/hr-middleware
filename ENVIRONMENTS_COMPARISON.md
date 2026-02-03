# Perbandingan Environment: Demo vs Integrated

## 📊 Quick Comparison

| Fitur | Demo Environment | Integrated Environment |
|-------|------------------|------------------------|
| **Talenta API** | Mock (simulasi) | Real Mekari API |
| **Data Source** | Sample data statis | Live data dari Talenta |
| **Authentication** | Tidak ada | HMAC-SHA256 |
| **Credentials Required** | ❌ Tidak | ✅ Ya (Mekari API keys) |
| **Port Talenta** | 3001 (mock-talenta) | 3000 (consume-endpoint) |
| **Docker Compose** | `docker-compose.demo.yml` | `docker-compose.integrated.yml` |
| **Startup Script** | `./start-demo.sh` | `./start-integrated.sh` |
| **Test Script** | `./test-integration.sh` | `./test-integrated.sh` |
| **Environment File** | `.env.demo` | `.env.integrated` |
| **Production Ready** | ❌ Demo only | ✅ Ya |
| **Apple Silicon Support** | ✅ Yes | ✅ Yes |
| **Encryption** | Optional (disabled) | Optional (disabled) |

---

## 🎯 Kapan Menggunakan Demo Environment?

### ✅ Gunakan Demo jika:

1. **Development & Testing**
   - Sedang develop fitur baru
   - Testing transformation logic
   - Tidak perlu data real

2. **Presentasi & Demo**
   - Demo ke client atau stakeholder
   - Training atau onboarding
   - Tidak ada koneksi internet

3. **Tidak Ada Akses Mekari**
   - Belum punya credentials
   - Mekari API sedang down
   - Testing offline

4. **Quick Prototyping**
   - Cepat start tanpa konfigurasi
   - Eksperimen dengan arsitektur
   - POC (Proof of Concept)

### Cara Start Demo:

```bash
cd /Users/yayasandarmawan/Documents/wan-lab/hr-middleware

# Option 1: Dengan script
./start-demo.sh

# Option 2: Manual
docker compose -f docker-compose.demo.yml up -d
```

---

## 🚀 Kapan Menggunakan Integrated Environment?

### ✅ Gunakan Integrated jika:

1. **Production atau Staging**
   - Deploy ke production
   - Setup staging environment
   - Need real data processing

2. **Real Data Testing**
   - Test dengan data actual
   - Validate sync accuracy
   - Performance testing dengan real load

3. **End-to-End Integration**
   - Full system integration test
   - UAT (User Acceptance Testing)
   - Production readiness validation

4. **Development dengan Real API**
   - Debugging API issues
   - Testing authentication flow
   - Verify API behavior

### Cara Start Integrated:

```bash
cd /Users/yayasandarmawan/Documents/wan-lab/hr-middleware

# 1. Configure credentials
cp .env.integrated .env
nano .env  # Add Mekari credentials

# 2. Start with script
./start-integrated.sh

# Or manual:
docker compose -f docker-compose.integrated.yml up -d
```

---

## 🔄 Data Flow Comparison

### Demo Environment Flow

```
┌─────────────────┐
│  mock-talenta   │ ← Static sample data (50 employees)
│  Port: 3001     │   No authentication
└────────┬────────┘   Instant response
         │
         │ HTTP
         ▼
┌─────────────────┐
│   middleware    │ ← Processes mock data
│  Port: 3002     │   All features work
└────────┬────────┘   Fast & predictable
         │
         ▼
    (Rest of flow same)
```

**Pros**:
- Fast startup (no external dependencies)
- Predictable data
- Works offline
- No credentials needed

**Cons**:
- Fake data
- Can't test real API behavior
- Not production representative

---

### Integrated Environment Flow

```
┌─────────────────┐
│ Real Talenta API│ ← Mekari Cloud
│ (api.mekari.com)│   Real employee data
└────────┬────────┘   Real authentication
         │
         │ HMAC-SHA256
         ▼
┌─────────────────┐
│  talenta-api    │ ← consume-endpoint (API Gateway)
│  Port: 3000     │   HMAC authentication
└────────┬────────┘   Swagger docs
         │
         │ HTTP/JSON
         ▼
┌─────────────────┐
│   middleware    │ ← Processes real data
│  Port: 3002     │   Production-like
└────────┬────────┘   Real performance
         │
         ▼
    (Rest of flow same)
```

**Pros**:
- Real data
- Production-like behavior
- Accurate testing
- API validation

**Cons**:
- Requires credentials
- Depends on internet
- Slower (real API calls)
- Rate limits apply

---

## 📦 Services Comparison

### Demo Environment Services

```yaml
services:
  - mock-talenta       # Port 3001 - Simulated API
  - middleware         # Port 3002
  - postgres-middleware # Port 5432
  - postgres-hcm       # Port 5433
  - redis              # Port 6379
  - sftp-server        # Port 2222
  - vault              # Port 8200
  - mock-oic           # Background
  - adminer            # Port 8080
```

**Total**: 9 containers

---

### Integrated Environment Services

```yaml
services:
  - talenta-api        # Port 3000 - Real API client ⭐ NEW
  - middleware         # Port 3002
  - postgres-middleware # Port 5432
  - postgres-hcm       # Port 5433
  - redis              # Port 6379
  - sftp-server        # Port 2222
  - vault              # Port 8200
  - mock-oic           # Background
  - adminer            # Port 8080
```

**Total**: 9 containers (mock-talenta replaced with talenta-api)

---

## 💰 Resource Usage

| Environment | RAM Usage | CPU Usage | Startup Time |
|-------------|-----------|-----------|--------------|
| **Demo** | ~2GB | Low | ~30 seconds |
| **Integrated** | ~2.5GB | Medium | ~45 seconds |

Integrated environment sedikit lebih berat karena real API processing.

---

## 🔧 Configuration Complexity

### Demo Environment

```env
# .env.demo - Minimal configuration
PORT=3002
DB_PASSWORD=hrispass
# No Mekari credentials needed ✓
```

**Complexity**: ⭐ Low

---

### Integrated Environment

```env
# .env.integrated - Requires credentials
MEKARI_API_CLIENT_ID=your_client_id      # Required ✓
MEKARI_API_CLIENT_SECRET=your_secret     # Required ✓
TALENTA_COMPANY_ID=1
DB_PASSWORD=hrispass_prod
# ... more config
```

**Complexity**: ⭐⭐⭐ Medium

---

## 🧪 Testing Scenarios

### Scenario 1: Feature Development

**Recommendation**: **Demo Environment**

```bash
# Quick iteration
docker compose -f docker-compose.demo.yml up -d

# Make code changes
# Test immediately with mock data
curl -X POST http://localhost:3002/api/sync/employees

# No API rate limits
# Fast feedback loop
```

---

### Scenario 2: Integration Testing

**Recommendation**: **Integrated Environment**

```bash
# Real API behavior
docker compose -f docker-compose.integrated.yml up -d

# Test with actual Talenta data
curl -X POST http://localhost:3002/api/sync/employees

# Verify real authentication
# Validate API responses
```

---

### Scenario 3: Production Deployment

**Recommendation**: **Integrated Environment** (modified)

```bash
# Use integrated as base
# Replace mock-oic with real Oracle OIC
# Use production databases
# Enable proper security
```

---

## 🔀 Switching Between Environments

### Demo → Integrated

```bash
# Stop demo
docker compose -f docker-compose.demo.yml down

# Configure credentials
cp .env.integrated .env
nano .env

# Start integrated
./start-integrated.sh
```

---

### Integrated → Demo

```bash
# Stop integrated
docker compose -f docker-compose.integrated.yml down

# Start demo (no config needed)
./start-demo.sh
```

---

## 🎭 Running Both Simultaneously

**Apakah bisa?** Ya, tapi tidak recommended.

Jika Anda ingin run keduanya:

```bash
# Demo menggunakan port 3001 (mock-talenta)
# Integrated menggunakan port 3000 (talenta-api)

# Tidak ada konflik port!
# Tapi akan menggunakan banyak resource (4GB+ RAM)
```

**Use case**: Compare behavior side-by-side

---

## 📋 Decision Matrix

### Pilih Demo jika:
- ✅ Tidak ada Mekari credentials
- ✅ Development/testing lokal
- ✅ Butuh startup cepat
- ✅ Offline development
- ✅ Demo ke client

### Pilih Integrated jika:
- ✅ Ada Mekari credentials
- ✅ Testing dengan real data
- ✅ Pre-production validation
- ✅ API behavior testing
- ✅ Performance testing

---

## 🚀 Recommended Workflow

### 1. Development Phase
```
Demo Environment
  ↓
Feature Development
  ↓
Unit Testing
  ↓
Local Integration Testing
```

### 2. Testing Phase
```
Integrated Environment
  ↓
Integration Testing
  ↓
API Validation
  ↓
Performance Testing
```

### 3. Deployment Phase
```
Integrated Environment (Modified)
  ↓
Replace Mock Services
  ↓
Production Configuration
  ↓
Deploy to Cloud
```

---

## 📊 Summary Table

| Aspect | Demo | Integrated |
|--------|------|------------|
| **Best For** | Development | Testing & Production |
| **Data** | Fake | Real |
| **Speed** | Fast | Normal |
| **Credentials** | Not needed | Required |
| **Offline** | ✅ Yes | ❌ No |
| **Cost** | Free | API costs |
| **Complexity** | Low | Medium |
| **Reliability** | 100% | Depends on API |
| **Production Ready** | ❌ | ✅ |
| **Apple Silicon** | ✅ Compatible | ✅ Compatible |
| **Encryption** | Optional | Optional |

---

## 💡 Pro Tips

1. **Start with Demo** untuk familiarize dengan sistem
2. **Switch to Integrated** saat ready untuk real testing
3. **Keep both configs** untuk flexibility
4. **Use Demo** untuk rapid prototyping
5. **Use Integrated** untuk pre-production validation

---

## 🆘 FAQ

**Q: Bisa pakai data Demo di Integrated environment?**
A: Tidak, Integrated environment harus connect ke real Mekari API.

**Q: Apakah consume-endpoint hanya untuk Integrated?**
A: Ya, consume-endpoint adalah real API client yang menggantikan mock-talenta.

**Q: Bisa switch environment tanpa rebuild?**
A: Ya, hanya perlu `docker compose down` dan `up` dengan file yang berbeda.

**Q: Environment mana yang lebih cepat?**
A: Demo lebih cepat karena tidak ada network latency ke Mekari API.

**Q: Apakah perlu cleanup saat switch environment?**
A: Tidak wajib, tapi recommended untuk avoid confusion:
```bash
docker compose -f docker-compose.demo.yml down
docker compose -f docker-compose.integrated.yml up -d
```

**Q: Apakah bisa run di Apple Silicon (M1/M2/M3)?**
A: Ya! Platform specifications sudah dikonfigurasi untuk compatibility. Beberapa service menggunakan `platform: linux/amd64` untuk emulation.

**Q: Apakah encryption wajib?**
A: Tidak. Default setting adalah `SKIP_ENCRYPTION=true` untuk development. Ubah ke `false` jika ingin menggunakan PGP encryption di production.

---

**Happy Integrating! 🚀**

**Updated**: February 3, 2026
**Version**: 1.1
**Apple Silicon**: ✅ Fully Supported
