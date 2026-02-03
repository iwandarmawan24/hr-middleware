# HRIS Middleware Technical Specification
## Talenta HR → Oracle HCM Cloud Integration

**Version:** 1.0  
**Date:** 2 February 2026  
**Status:** Draft

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [Data Flow Architecture](#3-data-flow-architecture)
4. [Component Details](#4-component-details)
5. [API Integration - Talenta HR](#5-api-integration---talenta-hr)
6. [Data Transformation & PDF Generation](#6-data-transformation--pdf-generation)
7. [Database Schema](#7-database-schema)
8. [Encryption & Security](#8-encryption--security)
9. [Oracle HCM Integration](#9-oracle-hcm-integration)
10. [Deployment Architecture](#10-deployment-architecture)
11. [Error Handling & Monitoring](#11-error-handling--monitoring)
12. [Demo Environment (Mock Oracle HCM)](#12-demo-environment-mock-oracle-hcm)
13. [Implementation Roadmap](#13-implementation-roadmap)

---

## 1. Executive Summary

### 1.1 Purpose

Membangun middleware yang berfungsi sebagai jembatan antara **Talenta HR** (produk HRIS dari Mekari) dengan **Oracle HCM Cloud**. Middleware ini akan:

- Mengambil data dari Talenta HR API
- Mentransformasi data ke format yang sesuai dengan Oracle HCM
- Generate PDF documents (payslip, tax statement)
- Encrypt file menggunakan PGP
- Upload ke Oracle HCM melalui HDL (HCM Data Loader)

### 1.2 Key Stakeholders

| Stakeholder | Role | Responsibility |
|-------------|------|----------------|
| Talenta HR | Data Source | Menyediakan employee data, payroll, attendance |
| Middleware | Data Processor | Transform, generate PDF, encrypt |
| Oracle HCM Cloud | Target System | Menerima dan memproses data payroll |

### 1.3 Scope

**In Scope:**
- Employee data synchronization
- Payroll data integration
- Payslip PDF generation
- Tax statement PDF generation
- Payroll ID mapping
- Overtime hours synchronization

**Out of Scope:**
- Live attendance real-time sync
- Recruitment module
- Performance management

---

## 2. System Overview

### 2.1 High-Level Architecture

```
┌─────────────────┐     ┌─────────────────────────────────────────┐     ┌─────────────────┐
│                 │     │           MIDDLEWARE LAYER              │     │                 │
│   TALENTA HR    │     │  ┌─────────────────────────────────┐   │     │  ORACLE HCM     │
│   (Mekari)      │ ──► │  │  1. API Consumer Service        │   │ ──► │  CLOUD          │
│                 │     │  │     - Fetch employee data       │   │     │                 │
│  ┌───────────┐  │     │  │     - Fetch payroll data        │   │     │  ┌───────────┐  │
│  │ Employee  │  │     │  │     - Fetch attendance          │   │     │  │ Personal  │  │
│  │ Data      │  │     │  └─────────────────────────────────┘   │     │  │ Data      │  │
│  ├───────────┤  │     │                  │                     │     │  ├───────────┤  │
│  │ Payroll   │  │     │                  ▼                     │     │  │ Payroll   │  │
│  │ Data      │  │     │  ┌─────────────────────────────────┐   │     │  │ Results   │  │
│  ├───────────┤  │     │  │  2. Data Transformer Service    │   │     │  ├───────────┤  │
│  │ Attendance│  │     │  │     - Map to Oracle HDL format  │   │     │  │ Statutory │  │
│  │ Data      │  │     │  │     - Validate data integrity   │   │     │  │ Data      │  │
│  └───────────┘  │     │  └─────────────────────────────────┘   │     │  └───────────┘  │
│                 │     │                  │                     │     │                 │
└─────────────────┘     │                  ▼                     │     └─────────────────┘
                        │  ┌─────────────────────────────────┐   │
                        │  │  3. PDF Generator Service       │   │
                        │  │     - Payslip PDF               │   │
                        │  │     - Tax Statement PDF         │   │
                        │  └─────────────────────────────────┘   │
                        │                  │                     │
                        │                  ▼                     │
                        │  ┌─────────────────────────────────┐   │
                        │  │  4. Encryption Service (PGP)    │   │
                        │  │     - Encrypt CSV + PDF         │   │
                        │  │     - Store encrypted files     │   │
                        │  └─────────────────────────────────┘   │
                        │                  │                     │
                        │                  ▼                     │
                        │  ┌─────────────────────────────────┐   │
                        │  │  5. Metadata Database           │   │
                        │  │     - PostgreSQL                │   │
                        │  │     - Track file status         │   │
                        │  │     - Audit trail               │   │
                        │  └─────────────────────────────────┘   │
                        │                  │                     │
                        │                  ▼                     │
                        │  ┌─────────────────────────────────┐   │
                        │  │  6. SFTP Uploader Service       │   │
                        │  │     - Upload to Oracle SFTP     │   │
                        │  │     - Archive processed files   │   │
                        │  └─────────────────────────────────┘   │
                        └─────────────────────────────────────────┘
```

### 2.2 Data Flow Direction

| Direction | From | To | Data Type |
|-----------|------|-----|-----------|
| **Inbound** (to Oracle) | Talenta/Third Party | Oracle HCM | Payslip, Tax Statement, Payroll ID, Overtime |
| **Outbound** (from Oracle) | Oracle HCM | Third Party | Personnel Data, Employment Data, Remuneration |

---

## 3. Data Flow Architecture

### 3.1 Inbound Flow (Talenta → Oracle HCM)

```
Step 1: FETCH DATA FROM TALENTA API
        ┌────────────────────────────────────┐
        │  GET /v2/talenta/v2/payroll        │
        │  GET /v2/talenta/v2/employee       │
        │  GET /v2/talenta/v2/live-attendance│
        └────────────────────────────────────┘
                         │
                         ▼
Step 2: TRANSFORM TO ORACLE FORMAT
        ┌────────────────────────────────────┐
        │  - Map Talenta fields to Oracle    │
        │  - Generate CSV files              │
        │  - Generate PDF documents          │
        └────────────────────────────────────┘
                         │
                         ▼
Step 3: STORE IN METADATA DB
        ┌────────────────────────────────────┐
        │  - Record file metadata            │
        │  - Create processing job entry     │
        │  - Link files to employees         │
        └────────────────────────────────────┘
                         │
                         ▼
Step 4: ENCRYPT FILES (PGP)
        ┌────────────────────────────────────┐
        │  - Encrypt CSV with OIC Public Key │
        │  - Encrypt PDF with password       │
        │  - Password = National Identifier  │
        └────────────────────────────────────┘
                         │
                         ▼
Step 5: UPLOAD TO SFTP
        ┌────────────────────────────────────┐
        │  - Place files in designated folder│
        │  - Create .ok trigger file         │
        │  - Archive original files          │
        └────────────────────────────────────┘
                         │
                         ▼
Step 6: ORACLE OIC PROCESSING
        ┌────────────────────────────────────┐
        │  - OIC picks up files (scheduled)  │
        │  - Load to Oracle ATP table        │
        │  - Transform to HDL format (.dat)  │
        │  - Call HCM Data Loader            │
        └────────────────────────────────────┘
```

### 3.2 File Naming Convention

| Seq | CSV File Name | Description | HDL File | Frequency |
|-----|--------------|-------------|----------|-----------|
| 1 | `HCM_INT_111_PAYSLIP_<BU>_YYYYMMDDHR24MISS.CSV` | Payslip | DocumentsOfRecord.dat | Daily |
| 2 | `HCM_INT_111_TAX_<BU>_YYYYMMDDHR24MISS.CSV` | Tax Statement | DocumentsOfRecord.dat | Daily |
| 3 | `HCM_INT_111_PAYROLLID_<BU>_YYYYMMDDHR24MISS.CSV` | Payroll ID | Worker.dat | Daily |
| 4 | `HCM_INT_121_OT_MY_YYYYMMDDHR24MISS.CSV` | Overtime hours | PersonAccrualDetail.dat | Daily |

---

## 4. Component Details

### 4.1 Middleware Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| **API Consumer** | Node.js / Go | Fetch data from Talenta API |
| **Data Transformer** | Node.js / Go | Map and transform data formats |
| **PDF Generator** | Puppeteer / wkhtmltopdf | Generate payslip & tax PDFs |
| **Encryption Service** | OpenPGP.js / GPG | PGP encryption for files |
| **Metadata Database** | PostgreSQL | Track files, jobs, audit logs |
| **SFTP Client** | ssh2-sftp-client | Upload encrypted files |
| **Job Scheduler** | node-cron / Bull | Schedule daily processing |
| **HashiCorp Vault** | Vault | Secure credential storage |

### 4.2 Service Interactions

```
┌──────────────────────────────────────────────────────────────┐
│                    MIDDLEWARE SERVICES                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │  Scheduler  │───►│ API Consumer│───►│ Transformer │      │
│  │  (Cron)     │    │  Service    │    │  Service    │      │
│  └─────────────┘    └─────────────┘    └──────┬──────┘      │
│                                               │              │
│         ┌─────────────────────────────────────┤              │
│         │                                     │              │
│         ▼                                     ▼              │
│  ┌─────────────┐                      ┌─────────────┐       │
│  │    PDF      │                      │  Metadata   │       │
│  │  Generator  │                      │   Service   │       │
│  └──────┬──────┘                      └──────┬──────┘       │
│         │                                     │              │
│         └─────────────┬───────────────────────┘              │
│                       │                                      │
│                       ▼                                      │
│               ┌─────────────┐                               │
│               │ Encryption  │                               │
│               │  Service    │                               │
│               └──────┬──────┘                               │
│                      │                                      │
│                      ▼                                      │
│               ┌─────────────┐         ┌─────────────┐       │
│               │   SFTP      │────────►│  Vault      │       │
│               │  Uploader   │         │  (Secrets)  │       │
│               └─────────────┘         └─────────────┘       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. API Integration - Talenta HR

### 5.1 Authentication

Talenta uses **OAuth 2.0** for API authentication via Mekari Developer Center.

**Base URLs:**
- Production: `https://api.mekari.com/v2/talenta/v2`
- Sandbox: `https://sandbox-api.mekari.com/v2/talenta/v2`
- Data API: `https://data-api.talenta.co`

**Headers:**
```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

### 5.2 Key Endpoints

#### 5.2.1 Company & Organization

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/company/:companyId/grade` | Get grade list |
| GET | `/company/:companyId/branch` | Get branch list |
| GET | `/company/:companyId/organization` | Get organization structure |
| GET | `/company/:companyId/employment-status` | Get employment status types |
| GET | `/company/:companyId/bank-list` | Get bank list |

#### 5.2.2 Employee Data

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/employee` | Create new employee |
| GET | `/employee/:userId?display=all` | Get employee detail |
| GET | `/employee?limit=20` | List employees |
| GET | `/employee/:userId/status` | Get employment status |

#### 5.2.3 Payroll Data

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/payroll?user_id={id}` | Get payroll data |
| GET | `/payroll/info?user_id={id}` | Get payroll info |
| GET | `/payroll/report?user_id={id}&year={Y}&month={M}` | Get payroll report |

#### 5.2.4 Attendance & Time Off

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/live-attendance?user_id={id}&start_date=...&end_date=...` | Get attendance |
| GET | `/time-off?start_date=...&end_date=...&user_id={id}&status=approved` | Get time off |
| GET | `/time-off/policies?user_id={id}` | Get leave policies |

### 5.3 Sample API Response

**GET /payroll/report:**
```json
{
  "message": "Get payroll report successfully",
  "data": {
    "user_id": 935848,
    "year": 2021,
    "month": 3,
    "gross_salary": 15000000,
    "net_salary": 12500000,
    "deductions": {
      "tax": 1500000,
      "bpjs_kesehatan": 500000,
      "bpjs_ketenagakerjaan": 500000
    },
    "allowances": {
      "transport": 1000000,
      "meal": 500000
    }
  }
}
```

---

## 6. Data Transformation & PDF Generation

### 6.1 Field Mapping - Payslip

| Talenta Field | Oracle HDL Field | Description |
|---------------|------------------|-------------|
| `user_id` | `PersonNumber` | Global Person Number |
| `- ` | `DocumentType` | Fixed: 'Third Party Payslip' |
| `payroll_period` | `DocumentCode` | DocumentName with spaces → '_' |
| `payroll_period` | `DocumentName` | Payslip Name (unique per person) |
| - | `SourceSystemOwner` | Fixed: 'LEGACY_DATA' |
| `user_id` + `document_code` | `SourceSystemId` | Concatenated with underscore |

### 6.2 Field Mapping - Tax Statement

| Talenta Field | Oracle HDL Field | Description |
|---------------|------------------|-------------|
| `user_id` | `PersonNumber` | Global Person Number |
| - | `DocumentType` | Fixed: 'Tax Statement' |
| `tax_year` + `tax_period` | `DocumentCode` | TaxStatement name with '_' |
| `tax_year` + `tax_period` | `DocumentName` | TaxStatement Name (unique) |
| - | `SourceSystemOwner` | Fixed: 'LEGACY_DATA' |

### 6.3 Field Mapping - Payroll ID (External Identifier)

| Talenta Field | Oracle HDL Field | Description |
|---------------|------------------|-------------|
| `user_id` | `PersonNumber` | Global Person Number |
| Sequence | `ExternalIdentifierSequence` | Unique per Person/External ID |
| `payroll_id` | `ExternalIdentifierNumber` | External ID (Talenta ID) |
| - | `ExternalIdentifierType` | Fixed: 'ORA_3RD_PARTY_PAY_ID' |
| Date | `DateFrom` | Valid from date (YYYY/MM/DD) |

### 6.4 PDF Template Structure

**Payslip PDF Components:**
```
┌────────────────────────────────────────────────┐
│              COMPANY LOGO                       │
├────────────────────────────────────────────────┤
│  Employee Name: {full_name}                    │
│  Employee ID: {employee_id}                    │
│  Department: {department}                      │
│  Position: {job_position}                      │
│  Period: {payroll_period}                      │
├────────────────────────────────────────────────┤
│  EARNINGS                    AMOUNT            │
│  ────────────────────────────────────          │
│  Basic Salary                {basic_salary}    │
│  Transport Allowance         {transport}       │
│  Meal Allowance              {meal}            │
│  Overtime Pay                {overtime}        │
│  ────────────────────────────────────          │
│  Total Earnings              {total_earnings}  │
├────────────────────────────────────────────────┤
│  DEDUCTIONS                  AMOUNT            │
│  ────────────────────────────────────          │
│  Income Tax (PPh 21)         {tax}             │
│  BPJS Kesehatan              {bpjs_kes}        │
│  BPJS Ketenagakerjaan        {bpjs_tk}         │
│  ────────────────────────────────────          │
│  Total Deductions            {total_deductions}│
├────────────────────────────────────────────────┤
│  NET PAY                     {net_salary}      │
└────────────────────────────────────────────────┘
```

---

## 7. Database Schema

### 7.1 Entity Relationship Diagram

```
┌───────────────────┐     ┌───────────────────┐
│   employees       │     │   sync_jobs       │
├───────────────────┤     ├───────────────────┤
│ id (PK)           │     │ id (PK)           │
│ talenta_user_id   │     │ job_type          │
│ oracle_person_num │     │ status            │
│ full_name         │     │ started_at        │
│ email             │     │ completed_at      │
│ department        │     │ error_message     │
│ position          │     │ records_processed │
│ created_at        │     │ created_at        │
│ updated_at        │     └───────────────────┘
│ synced_at         │
└─────────┬─────────┘
          │
          │ 1:N
          ▼
┌───────────────────┐     ┌───────────────────┐
│   documents       │     │   encrypted_files │
├───────────────────┤     ├───────────────────┤
│ id (PK)           │     │ id (PK)           │
│ employee_id (FK)  │     │ document_id (FK)  │
│ document_type     │     │ original_filename │
│ document_code     │     │ encrypted_filename│
│ document_name     │     │ encryption_type   │
│ period_year       │     │ file_path         │
│ period_month      │     │ file_size         │
│ original_file_path│     │ checksum_sha256   │
│ status            │     │ sftp_uploaded     │
│ created_at        │     │ upload_timestamp  │
│ updated_at        │     │ archive_path      │
└───────────────────┘     │ created_at        │
                          └───────────────────┘

┌───────────────────┐     ┌───────────────────┐
│   api_logs        │     │   encryption_keys │
├───────────────────┤     ├───────────────────┤
│ id (PK)           │     │ id (PK)           │
│ request_id        │     │ key_name          │
│ endpoint          │     │ key_type          │
│ method            │     │ public_key_id     │
│ request_payload   │     │ environment       │
│ response_status   │     │ valid_from        │
│ response_body     │     │ valid_until       │
│ duration_ms       │     │ vault_path        │
│ created_at        │     │ created_at        │
└───────────────────┘     └───────────────────┘
```

### 7.2 DDL Scripts

```sql
-- Employees table (mapping Talenta <-> Oracle)
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    talenta_user_id INTEGER NOT NULL UNIQUE,
    oracle_person_number VARCHAR(30),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    national_identifier VARCHAR(50), -- For PDF password
    department VARCHAR(100),
    position VARCHAR(100),
    branch_id INTEGER,
    employment_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMP
);

CREATE INDEX idx_employees_talenta_id ON employees(talenta_user_id);
CREATE INDEX idx_employees_oracle_num ON employees(oracle_person_number);

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id),
    document_type VARCHAR(50) NOT NULL, -- 'PAYSLIP', 'TAX_STATEMENT', 'PAYROLL_ID', 'OVERTIME'
    document_code VARCHAR(150) NOT NULL,
    document_name VARCHAR(80) NOT NULL,
    period_year INTEGER,
    period_month INTEGER,
    original_file_path VARCHAR(500),
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, PROCESSED, ENCRYPTED, UPLOADED, FAILED
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, document_type, period_year, period_month)
);

CREATE INDEX idx_documents_employee ON documents(employee_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_period ON documents(period_year, period_month);

-- Encrypted files table
CREATE TABLE encrypted_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id),
    original_filename VARCHAR(255) NOT NULL,
    encrypted_filename VARCHAR(255) NOT NULL,
    encryption_type VARCHAR(20) NOT NULL, -- 'PGP', 'PASSWORD'
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    checksum_sha256 VARCHAR(64),
    sftp_uploaded BOOLEAN DEFAULT FALSE,
    upload_timestamp TIMESTAMP,
    archive_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_encrypted_files_document ON encrypted_files(document_id);
CREATE INDEX idx_encrypted_files_uploaded ON encrypted_files(sftp_uploaded);

-- Sync jobs table
CREATE TABLE sync_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type VARCHAR(50) NOT NULL, -- 'EMPLOYEE_SYNC', 'PAYROLL_SYNC', 'FULL_SYNC'
    business_unit VARCHAR(50),
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, RUNNING, COMPLETED, FAILED
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    records_total INTEGER DEFAULT 0,
    records_processed INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sync_jobs_status ON sync_jobs(status);
CREATE INDEX idx_sync_jobs_type ON sync_jobs(job_type);

-- API logs table
CREATE TABLE api_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(100),
    sync_job_id UUID REFERENCES sync_jobs(id),
    direction VARCHAR(10), -- 'INBOUND', 'OUTBOUND'
    endpoint VARCHAR(500) NOT NULL,
    method VARCHAR(10) NOT NULL,
    request_headers JSONB,
    request_payload JSONB,
    response_status INTEGER,
    response_body JSONB,
    duration_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_logs_request_id ON api_logs(request_id);
CREATE INDEX idx_api_logs_sync_job ON api_logs(sync_job_id);
CREATE INDEX idx_api_logs_created ON api_logs(created_at);

-- Encryption keys metadata (actual keys in Vault)
CREATE TABLE encryption_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_name VARCHAR(100) NOT NULL,
    key_type VARCHAR(20) NOT NULL, -- 'PUBLIC', 'PRIVATE'
    key_purpose VARCHAR(50) NOT NULL, -- 'HCM_EXTRACT', 'OIC_DECRYPT', 'VENDOR_ENCRYPT'
    public_key_id VARCHAR(100), -- PGP Key ID
    environment VARCHAR(20) NOT NULL, -- 'SIT', 'UAT', 'PROD'
    valid_from DATE NOT NULL,
    valid_until DATE,
    vault_secret_path VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_encryption_keys_active ON encryption_keys(is_active, environment);
```

### 7.3 Metadata Relationships

```
Employee (Talenta) ──────────────────► Employee (Middleware DB)
     │                                         │
     │                                         │ 1:N
     ▼                                         ▼
Payroll Data ──► Transform ──► Document ──► Encrypted File
                                   │
                                   ▼
                            Oracle HCM (HDL)
```

---

## 8. Encryption & Security

### 8.1 PGP Encryption Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENCRYPTION SCENARIOS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  OUTBOUND (HCM → Third Party):                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ HCM      │───►│ HCM      │───►│ OIC      │───►│ Vendor   │  │
│  │ Extract  │    │ Public   │    │ Private  │    │ Public   │  │
│  │ (XML)    │    │ Key      │    │ Key      │    │ Key      │  │
│  │          │    │ Encrypt  │    │ Decrypt  │    │ Encrypt  │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│                                                                 │
│  INBOUND (Third Party → HCM):                                   │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ Vendor   │───►│ OIC      │───►│ OIC      │───►│ HCM      │  │
│  │ CSV/PDF  │    │ Public   │    │ Private  │    │ Public   │  │
│  │          │    │ Key      │    │ Key      │    │ Key      │  │
│  │          │    │ Encrypt  │    │ Decrypt  │    │ Encrypt  │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Key Management

| Interface | Public Key Holder | Private Key Holder | Purpose | Environment | Total Keys |
|-----------|-------------------|-------------------|---------|-------------|------------|
| OutBound | Fusion | OIC | HCM Extract encrypts XML using OIC Public Key | SIT, UAT, PROD | 3 |
| OutBound | OIC | Pay Vendors (8) | OIC encrypts CSV with Vendor Public Key | SIT, UAT, PROD | 24 |
| InBound | Pay Vendor | OIC | Vendor encrypts CSV using OIC Public Key | SIT, UAT, PROD | 0 (reuse) |
| InBound | OIC | Fusion | OIC encrypts .dat with HCM Cloud Public Key | SIT, UAT, PROD | 3 |

### 8.3 PDF Password Protection

Payslips dan Tax Statements diproteksi dengan password:
- **Password**: National Identifier (NIK/KTP untuk Indonesia)
- **Encryption**: AES-256

```javascript
// Example: PDF password protection
const protectedPdf = await PDFDocument.create();
protectedPdf.setPassword({
  userPassword: employee.national_identifier,
  ownerPassword: process.env.OWNER_PASSWORD,
  permissions: {
    printing: true,
    modifying: false,
    copying: false
  }
});
```

### 8.4 Vault Integration

```yaml
# Vault secrets structure
secret/hris/talenta:
  client_id: "..."
  client_secret: "..."
  access_token: "..."

secret/hris/oracle:
  sftp_host: "..."
  sftp_user: "..."
  sftp_private_key: "..."

secret/hris/pgp/oic:
  public_key: "-----BEGIN PGP PUBLIC KEY-----..."
  
secret/hris/pgp/hcm:
  public_key: "-----BEGIN PGP PUBLIC KEY-----..."
```

---

## 9. Oracle HCM Integration

### 9.1 HDL File Formats

**DocumentsOfRecord.dat (for Payslip/Tax):**
```
METADATA|DocumentsOfRecord|PersonNumber|DocumentType|DocumentCode|DocumentName|SourceSystemOwner|SourceSystemId
MERGE|DocumentsOfRecord|300000001234567|Third Party Payslip|Payslip_202601|Payslip January 2026|LEGACY_DATA|300000001234567_Payslip_202601

METADATA|DocumentAttachment|PersonNumber|DocumentType|DocumentCode|DataTypeCode|Title|FileName|File|SourceSystemOwner|SourceSystemId
MERGE|DocumentAttachment|300000001234567|Third Party Payslip|Payslip_202601|FILE|Payslip January 2026|payslip_202601.pdf|<base64_content>|LEGACY_DATA|300000001234567_payslip_202601.pdf
```

**Worker.dat (for Payroll ID):**
```
METADATA|ExternalIdentifier|PersonNumber|ExternalIdentifierSequence|ExternalIdentifierNumber|ExternalIdentifierType|DateFrom|SourceSystemOwner|SourceSystemId
MERGE|ExternalIdentifier|300000001234567|1|TAL123456|ORA_3RD_PARTY_PAY_ID|2026/01/01|LEGACY_DATA|300000001234567_TAL123456
```

### 9.2 SFTP Folder Structure

```
/ASW_COMMON_FOLDER/           ← Inbound: Vendor places encrypted CSV here
    ├── payslip_20260201.csv.gpg
    ├── payslip_20260201.ok
    └── ...

/ASW_ARCHIVE_DDMMYYYY/        ← Archive: Processed files moved here
    ├── payslip_20260131/
    └── ...

/ASW_HCM_OUTBOUND_MY/         ← Outbound: HCM extracts for Malaysia
/ASW_HCM_OUTBOUND_ID/         ← Outbound: HCM extracts for Indonesia
```

### 9.3 OIC Processing Steps (Inbound)

1. Source Application generates meta-data in CSV (+ PDF per employee)
2. Source Application sends CSV/PDF files and `.ok` file to SFTP
3. OIC scheduled process (Daily) picks up CSV file
4. OIC loads data into Table in Oracle ATP under PaaS
5. OIC transforms to `.dat` file (HDL format)
6. OIC zips `.dat` file (+ PDFs under BlobFiles subfolder)
7. OIC encrypts zip with HCM Cloud Public PGP key
8. OIC calls HCM Data Loader process in Oracle Fusion HCM
9. HCM Data Loader decrypts using HCM Cloud Private Key
10. Data loaded into Oracle HCM Cloud

---

## 10. Deployment Architecture

### 10.1 Docker Compose Stack

```yaml
name: hris-middleware

services:
  # Main API Service
  api:
    build: ./services/api
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://hris:pass@postgres:5432/hris_db
      - VAULT_ADDR=http://vault:8200
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
      - vault
    networks:
      - hris-net

  # Worker for background jobs
  worker:
    build: ./services/worker
    environment:
      - DATABASE_URL=postgresql://hris:pass@postgres:5432/hris_db
      - VAULT_ADDR=http://vault:8200
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
      - vault
    networks:
      - hris-net

  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: hris
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: hris_db
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - hris-net

  # Redis for job queue
  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    networks:
      - hris-net

  # HashiCorp Vault for secrets
  vault:
    image: hashicorp/vault:1.15
    environment:
      VAULT_DEV_ROOT_TOKEN_ID: devtoken
    cap_add:
      - IPC_LOCK
    volumes:
      - vault-data:/vault/data
    networks:
      - hris-net

  # SFTP Server (for local testing)
  sftp:
    image: atmoz/sftp:alpine
    environment:
      SFTP_USERS: hris::1000:1000:data
    volumes:
      - sftp-data:/home/hris/data
    networks:
      - hris-net

networks:
  hris-net:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
  vault-data:
  sftp-data:
```

### 10.2 Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      DOCKER HOST                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │   API   │  │ Worker  │  │ Postgres│  │  Redis  │       │
│  │ :3000   │  │ (cron)  │  │ :5432   │  │ :6379   │       │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘       │
│       │            │            │            │             │
│       └────────────┼────────────┼────────────┘             │
│                    │            │                          │
│                    ▼            ▼                          │
│              ┌─────────┐  ┌─────────┐                     │
│              │  Vault  │  │  SFTP   │                     │
│              │ :8200   │  │ :2222   │                     │
│              └─────────┘  └─────────┘                     │
│                                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 11. Error Handling & Monitoring

### 11.1 Error Categories

| Category | Example | Handling |
|----------|---------|----------|
| **API Errors** | Talenta rate limit, auth failure | Retry with exponential backoff |
| **Transform Errors** | Missing required field | Log, skip record, continue |
| **Encryption Errors** | Invalid PGP key | Alert, halt job |
| **Upload Errors** | SFTP connection failed | Retry 3x, then alert |
| **Database Errors** | Connection timeout | Retry, alert if persistent |

### 11.2 Retry Strategy

```javascript
const retryConfig = {
  maxRetries: 3,
  initialDelay: 1000,  // 1 second
  maxDelay: 30000,     // 30 seconds
  backoffMultiplier: 2,
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'RATE_LIMITED',
    'SERVICE_UNAVAILABLE'
  ]
};
```

### 11.3 Monitoring & Alerts

```
┌────────────────────────────────────────────────────────────┐
│                    MONITORING STACK                         │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐       │
│  │ Prometheus │───►│  Grafana   │───►│   Slack    │       │
│  │  (Metrics) │    │ (Dashboard)│    │  (Alerts)  │       │
│  └────────────┘    └────────────┘    └────────────┘       │
│         ▲                                                  │
│         │                                                  │
│  ┌──────┴─────────────────────────────────────────┐       │
│  │                APPLICATION                      │       │
│  │  - Jobs processed/failed                        │       │
│  │  - API latency                                  │       │
│  │  - Queue depth                                  │       │
│  │  - Encryption success rate                      │       │
│  │  - SFTP upload status                           │       │
│  └─────────────────────────────────────────────────┘       │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 11.4 Key Metrics

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `sync_job_duration_seconds` | Time to complete sync job | > 30 minutes |
| `api_request_errors_total` | API call failures | > 10/hour |
| `documents_processed_total` | Documents generated | N/A (tracking) |
| `encryption_failures_total` | PGP encryption errors | > 0 |
| `sftp_upload_failures_total` | SFTP upload errors | > 0 |
| `queue_depth` | Pending jobs in queue | > 1000 |

---

## 12. Demo Environment (Mock Oracle HCM)

### 12.1 Overview & Justification

Karena **Oracle HCM Cloud** membutuhkan license yang mahal dan akses terbatas, kita membutuhkan **Demo Environment** yang dapat:

- Menggantikan Oracle HCM Cloud untuk development & testing
- Mensimulasikan OIC (Oracle Integration Cloud) processing
- Memvalidasi HDL file format sebelum production
- Memberikan demo ke stakeholder dengan data real
- Mempercepat development cycle tanpa dependency ke Oracle

**Prinsip Demo Environment:**
- Middleware code **100% sama** dengan production
- Hanya target system yang di-mock
- Data flow identical dengan production
- Bisa switch ke production dengan config change saja

### 12.2 Architecture Comparison

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRODUCTION FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Talenta API ──► Middleware ──► SFTP ──► Oracle OIC ──► Oracle HCM Cloud   │
│                                             │                │              │
│                                             │                ▼              │
│                                             │           [Proprietary]       │
│                                             │           [$$$ License]       │
│                                             │                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                            DEMO FLOW                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Talenta API ──► Middleware ──► SFTP ──► Mock OIC ──► Mock HCM (PostgreSQL)│
│       │              │                      │               │               │
│       ▼              │                      │               ▼               │
│  [Optional:          │                      │          Dashboard UI         │
│   Mock Talenta]      │                      │          (View Results)       │
│                      │                      │                               │
│              [SAME CODE AS PROD]    [Open Source]    [Open Source]          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 12.3 Demo Stack Components

| Component | Production | Demo Replacement | Technology |
|-----------|------------|------------------|------------|
| **Data Source** | Talenta HR API | Mock Talenta API | Express.js + JSON |
| **Middleware** | Node.js Services | **SAMA** | Node.js |
| **File Transfer** | Oracle SFTP | Local SFTP | atmoz/sftp (Docker) |
| **Integration** | Oracle OIC | Mock OIC Processor | Node.js + File Watcher |
| **Target DB** | Oracle HCM Cloud | Mock HCM Database | PostgreSQL |
| **Secrets** | Oracle Vault / Azure KV | HashiCorp Vault | Vault OSS |
| **Dashboard** | Oracle HCM UI | Custom Dashboard | React / Next.js |

### 12.4 Mock OIC (Oracle Integration Cloud) Specification

Mock OIC akan mensimulasikan behavior OIC yang sebenarnya:

**Responsibilities:**
1. **File Watcher** - Monitor SFTP inbound folder untuk file baru
2. **Trigger Detection** - Detect `.ok` file sebagai trigger processing
3. **Decryption** - Decrypt PGP encrypted files menggunakan private key
4. **HDL Parser** - Parse dan validate HDL format (.dat files)
5. **Data Loader** - Load data ke Mock HCM Database
6. **Archival** - Move processed files ke archive folder

**Processing Flow:**
```
┌─────────────────────────────────────────────────────────────────────┐
│                      MOCK OIC PROCESSING                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. File Watcher detects new .ok file in /inbound                   │
│                          │                                          │
│                          ▼                                          │
│  2. Read corresponding .csv.gpg or .zip.gpg file                    │
│                          │                                          │
│                          ▼                                          │
│  3. Decrypt using OIC Private Key (PGP)                             │
│                          │                                          │
│                          ▼                                          │
│  4. If ZIP: Extract contents (CSV + BlobFiles/)                     │
│                          │                                          │
│                          ▼                                          │
│  5. Parse CSV → Transform to HDL .dat format                        │
│                          │                                          │
│                          ▼                                          │
│  6. Validate HDL format (METADATA/MERGE rows)                       │
│                          │                                          │
│                          ▼                                          │
│  7. Load to PostgreSQL (Mock HCM)                                   │
│     - persons table                                                 │
│     - documents_of_record table                                     │
│     - document_attachments table (store PDFs)                       │
│     - external_identifiers table                                    │
│                          │                                          │
│                          ▼                                          │
│  8. Move files to /archive/{date}/                                  │
│                          │                                          │
│                          ▼                                          │
│  9. Log import result to hdl_import_log table                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 12.5 Mock HCM Database Schema

PostgreSQL schema yang mensimulasikan Oracle HCM Cloud tables:

```sql
-- ============================================
-- MOCK ORACLE HCM CLOUD DATABASE
-- Simplified version untuk demo/development
-- ============================================

-- Workers/Persons table (simulates PER_ALL_PEOPLE_F)
CREATE TABLE persons (
    person_id BIGSERIAL PRIMARY KEY,
    person_number VARCHAR(30) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    full_name VARCHAR(200),
    email VARCHAR(255),
    national_identifier VARCHAR(50),
    date_of_birth DATE,
    hire_date DATE,
    department VARCHAR(100),
    job_title VARCHAR(100),
    grade VARCHAR(50),
    location VARCHAR(100),
    manager_person_number VARCHAR(30),
    employment_status VARCHAR(20) DEFAULT 'ACTIVE',
    source_system_owner VARCHAR(50),
    source_system_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents of Record (simulates HR_DOCUMENTS_OF_RECORD)
CREATE TABLE documents_of_record (
    document_id BIGSERIAL PRIMARY KEY,
    person_id BIGINT REFERENCES persons(person_id),
    person_number VARCHAR(30) NOT NULL,
    document_type VARCHAR(80) NOT NULL,
    document_code VARCHAR(150) NOT NULL,
    document_name VARCHAR(80) NOT NULL,
    source_system_owner VARCHAR(256),
    source_system_id VARCHAR(2000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(person_number, document_type, document_code)
);

-- Document Attachments (simulates HR_DOCUMENT_ATTACHMENTS)
CREATE TABLE document_attachments (
    attachment_id BIGSERIAL PRIMARY KEY,
    document_id BIGINT REFERENCES documents_of_record(document_id),
    person_number VARCHAR(30) NOT NULL,
    document_type VARCHAR(80) NOT NULL,
    document_code VARCHAR(150) NOT NULL,
    data_type_code VARCHAR(30) DEFAULT 'FILE',
    title VARCHAR(80),
    file_name VARCHAR(255),
    file_content BYTEA,
    file_size BIGINT,
    mime_type VARCHAR(100) DEFAULT 'application/pdf',
    source_system_owner VARCHAR(256),
    source_system_id VARCHAR(2000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- External Identifiers (simulates PER_EXTERNAL_IDENTIFIERS)
CREATE TABLE external_identifiers (
    identifier_id BIGSERIAL PRIMARY KEY,
    person_id BIGINT REFERENCES persons(person_id),
    person_number VARCHAR(30) NOT NULL,
    external_identifier_sequence INTEGER NOT NULL,
    external_identifier_number VARCHAR(256) NOT NULL,
    external_identifier_type VARCHAR(30) NOT NULL,
    date_from DATE NOT NULL,
    date_to DATE,
    source_system_owner VARCHAR(256),
    source_system_id VARCHAR(2000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(person_number, external_identifier_type, external_identifier_sequence)
);

-- Person Accrual Details (simulates overtime/leave accruals)
CREATE TABLE person_accrual_details (
    accrual_id BIGSERIAL PRIMARY KEY,
    person_id BIGINT REFERENCES persons(person_id),
    person_number VARCHAR(30) NOT NULL,
    accrual_plan VARCHAR(100),
    accrual_type VARCHAR(50),
    accrual_date DATE,
    hours DECIMAL(10,2),
    source_system_owner VARCHAR(256),
    source_system_id VARCHAR(2000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- HDL Import Log (track processed files)
CREATE TABLE hdl_import_log (
    import_id BIGSERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    hdl_object VARCHAR(100),
    records_total INTEGER DEFAULT 0,
    records_success INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'PENDING',
    error_message TEXT,
    processing_details JSONB,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_persons_number ON persons(person_number);
CREATE INDEX idx_documents_person ON documents_of_record(person_number);
CREATE INDEX idx_attachments_document ON document_attachments(document_id);
CREATE INDEX idx_external_ids_person ON external_identifiers(person_number);
CREATE INDEX idx_accruals_person ON person_accrual_details(person_number);
CREATE INDEX idx_import_log_status ON hdl_import_log(status);
```

### 12.6 Mock Talenta API (Optional)

Untuk testing tanpa akses Talenta API production:

**Endpoints yang di-mock:**

| Endpoint | Purpose | Sample Data |
|----------|---------|-------------|
| `GET /v2/talenta/v2/employee` | List employees | 10-50 sample employees |
| `GET /v2/talenta/v2/employee/:id` | Employee detail | Full employee object |
| `GET /v2/talenta/v2/payroll` | Payroll list | 3-6 months history |
| `GET /v2/talenta/v2/payroll/report` | Payroll detail | Complete breakdown |
| `GET /v2/talenta/v2/company/:id/branch` | Branch list | 3-5 branches |
| `GET /v2/talenta/v2/company/:id/organization` | Org structure | Dept hierarchy |

**Sample Data Generation:**
- Gunakan Faker.js untuk generate realistic Indonesian names
- NIK format yang valid (16 digit)
- Realistic salary ranges (UMR-based)
- Proper BPJS & tax calculations

### 12.7 Demo Dashboard UI

Simple web interface untuk visualisasi dan validasi:

**Features:**

| Feature | Description |
|---------|-------------|
| **Employee List** | View all imported employees with search/filter |
| **Document Viewer** | View/download payslips & tax statements |
| **Sync Monitor** | Real-time sync job status |
| **Import History** | HDL import logs with success/error details |
| **File Browser** | Browse SFTP folders (inbound/archive) |
| **Data Comparison** | Compare Talenta source vs HCM target |

**Dashboard Pages:**
```
/                     → Overview dashboard (stats, recent activity)
/employees            → Employee list from Mock HCM
/employees/:id        → Employee detail + documents
/documents            → All documents with filters
/documents/:id/view   → PDF viewer (with password input)
/sync-jobs            → Sync job history
/import-logs          → HDL import results
/settings             → Configuration & connection status
```

### 12.8 Demo Environment Configuration

**Environment Variables:**

```env
# ============================================
# DEMO ENVIRONMENT CONFIG
# ============================================

# Mode
ENVIRONMENT=demo
USE_MOCK_TALENTA=true
USE_MOCK_OIC=true

# Mock Talenta API
MOCK_TALENTA_URL=http://mock-talenta:3001
MOCK_TALENTA_DELAY_MS=100

# Real Talenta API (if USE_MOCK_TALENTA=false)
TALENTA_API_URL=https://api.mekari.com/v2/talenta/v2
TALENTA_CLIENT_ID=xxx
TALENTA_CLIENT_SECRET=xxx

# Middleware Database
MIDDLEWARE_DB_URL=postgresql://hris:pass@postgres-middleware:5432/hris_metadata

# Mock HCM Database
MOCK_HCM_DB_URL=postgresql://hcm:pass@postgres-hcm:5432/mock_hcm

# SFTP Configuration
SFTP_HOST=sftp-server
SFTP_PORT=22
SFTP_USER=hris
SFTP_INBOUND_PATH=/data/inbound
SFTP_ARCHIVE_PATH=/data/archive

# Mock OIC Configuration
OIC_WATCH_INTERVAL_MS=5000
OIC_PROCESS_BATCH_SIZE=100

# Encryption Keys (for demo, can use test keys)
PGP_OIC_PUBLIC_KEY_PATH=/keys/oic_public.asc
PGP_OIC_PRIVATE_KEY_PATH=/keys/oic_private.asc
PGP_HCM_PUBLIC_KEY_PATH=/keys/hcm_public.asc

# Dashboard
DASHBOARD_PORT=3000
```

### 12.9 Demo vs Production Switch

Untuk switch dari Demo ke Production, hanya perlu change config:

| Config | Demo Value | Production Value |
|--------|------------|------------------|
| `ENVIRONMENT` | `demo` | `production` |
| `USE_MOCK_TALENTA` | `true` | `false` |
| `USE_MOCK_OIC` | `true` | `false` |
| `TALENTA_API_URL` | Mock URL | Real Mekari URL |
| `SFTP_HOST` | Local SFTP | Oracle SFTP |
| `TARGET_DB_URL` | PostgreSQL | Oracle HCM (via OIC) |

**Code tidak berubah** - hanya configuration yang berbeda.

### 12.10 Demo Data Seeding

**Initial Data untuk Demo:**

```
Employees:        50 sample employees
                  - Mix departments (Engineering, Finance, HR, Operations)
                  - Mix grades (L1-L5, M1-M2)
                  - Mix branches (Jakarta, Surabaya, Bandung)

Payroll History:  6 months data per employee
                  - Realistic salary components
                  - Proper tax calculations
                  - Random overtime hours

Documents:        ~300 payslips (50 employees × 6 months)
                  50 tax statements (annual)
```

### 12.11 Demo Limitations & Considerations

| Aspect | Demo Behavior | Production Behavior |
|--------|---------------|---------------------|
| **Performance** | Single PostgreSQL | Oracle RAC cluster |
| **Concurrency** | Limited | High concurrency |
| **Data Volume** | ~50 employees | 1000+ employees |
| **Encryption** | Test PGP keys | Production keys |
| **Audit Trail** | Basic logging | Full Oracle audit |
| **Recovery** | Manual | Oracle RMAN |

**Catatan Penting:**
- Demo environment **TIDAK** untuk production data
- PGP keys di demo adalah test keys, **JANGAN** gunakan di production
- Performance benchmarking harus dilakukan di environment yang mirip production

### 12.12 Demo Docker Compose Stack

```yaml
name: hris-demo

services:
  # ========== DATA SOURCE ==========
  mock-talenta:
    image: node:20-alpine
    container_name: mock-talenta
    working_dir: /app
    command: node server.js
    ports:
      - "3001:3001"
    volumes:
      - ./services/mock-talenta:/app
    networks:
      - hris-demo-net

  # ========== MIDDLEWARE (SAME AS PROD) ==========
  middleware:
    build: ./services/middleware
    container_name: hris-middleware
    environment:
      - ENVIRONMENT=demo
      - USE_MOCK_TALENTA=true
      - TALENTA_API_URL=http://mock-talenta:3001
      - DATABASE_URL=postgresql://hris:pass@postgres-middleware:5432/hris_metadata
      - SFTP_HOST=sftp-server
    depends_on:
      - mock-talenta
      - postgres-middleware
      - sftp-server
    networks:
      - hris-demo-net

  # ========== MOCK OIC ==========
  mock-oic:
    build: ./services/mock-oic
    container_name: mock-oic
    environment:
      - WATCH_DIR=/sftp-data/inbound
      - DATABASE_URL=postgresql://hcm:pass@postgres-hcm:5432/mock_hcm
    volumes:
      - sftp-data:/sftp-data
    depends_on:
      - postgres-hcm
    networks:
      - hris-demo-net

  # ========== DATABASES ==========
  postgres-middleware:
    image: postgres:16-alpine
    container_name: postgres-middleware
    environment:
      POSTGRES_USER: hris
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: hris_metadata
    volumes:
      - ./database/middleware-schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
    networks:
      - hris-demo-net

  postgres-hcm:
    image: postgres:16-alpine
    container_name: postgres-hcm
    environment:
      POSTGRES_USER: hcm
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mock_hcm
    volumes:
      - ./database/mock-hcm-schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
    ports:
      - "5433:5432"
    networks:
      - hris-demo-net

  # ========== SUPPORTING ==========
  sftp-server:
    image: atmoz/sftp:alpine
    container_name: hris-sftp
    command: hris::1000:1000:data
    volumes:
      - sftp-data:/home/hris/data
    networks:
      - hris-demo-net

  vault:
    image: hashicorp/vault:1.15
    container_name: hris-vault
    environment:
      VAULT_DEV_ROOT_TOKEN_ID: devtoken
    ports:
      - "8200:8200"
    networks:
      - hris-demo-net

  # ========== DASHBOARD ==========
  dashboard:
    build: ./services/dashboard
    container_name: hris-dashboard
    ports:
      - "3000:3000"
    environment:
      - MOCK_HCM_DB_URL=postgresql://hcm:pass@postgres-hcm:5432/mock_hcm
    depends_on:
      - postgres-hcm
    networks:
      - hris-demo-net

  # ========== UTILITIES ==========
  adminer:
    image: adminer:4
    container_name: hris-adminer
    ports:
      - "8080:8080"
    networks:
      - hris-demo-net

networks:
  hris-demo-net:
    driver: bridge

volumes:
  sftp-data:
```

### 12.13 Demo Verification Checklist

| Step | Verification | Expected Result |
|------|--------------|-----------------|
| 1 | Start all containers | All services healthy |
| 2 | Access Mock Talenta API | Returns sample employees |
| 3 | Trigger middleware sync | Job created, data fetched |
| 4 | Check SFTP inbound folder | Encrypted files present |
| 5 | Mock OIC processes files | Files moved to archive |
| 6 | Query Mock HCM database | Data loaded correctly |
| 7 | Open Dashboard | Employees & documents visible |
| 8 | Download payslip PDF | PDF opens with NIK password |

---

## 13. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Setup Docker development environment
- [ ] Create PostgreSQL database schema (middleware metadata)
- [ ] Implement Vault integration for secrets
- [ ] Setup CI/CD pipeline
- [ ] **Setup Demo Environment stack**

### Phase 2: Demo Environment (Week 3-4)
- [ ] Build Mock Talenta API with sample data
- [ ] Create Mock HCM Database schema
- [ ] Build Mock OIC file processor
- [ ] Implement HDL parser & validator
- [ ] Build basic Dashboard UI
- [ ] Generate realistic sample data (50 employees, 6 months payroll)

### Phase 3: API Integration (Week 5-6)
- [ ] Implement Talenta API client (with interface for mock/real)
- [ ] Build employee data sync service
- [ ] Build payroll data sync service
- [ ] Implement error handling & retry logic
- [ ] **Test dengan Mock Talenta API**

### Phase 4: Transformation (Week 7-8)
- [ ] Build data transformation layer
- [ ] Implement CSV generation for HDL
- [ ] Build PDF generation service (payslip)
- [ ] Build PDF generation service (tax statement)
- [ ] **Validate output dengan Mock OIC**

### Phase 5: Security (Week 9-10)
- [ ] Implement PGP encryption service
- [ ] Implement PDF password protection
- [ ] Setup key rotation mechanism
- [ ] Security audit & penetration testing
- [ ] **Test encryption flow di Demo Environment**

### Phase 6: End-to-End Demo (Week 11-12)
- [ ] Complete Dashboard UI features
- [ ] Full integration testing in Demo Environment
- [ ] Demo to stakeholders
- [ ] Gather feedback & iterate
- [ ] Documentation & runbook

### Phase 7: Production Integration (Week 13-14)
- [ ] Connect to real Talenta API (sandbox first)
- [ ] Configure Oracle SFTP credentials
- [ ] End-to-end testing with Oracle SIT environment
- [ ] Performance optimization

### Phase 8: Production Deployment (Week 15-16)
- [ ] UAT testing with real Oracle HCM
- [ ] Production deployment
- [ ] Monitoring & alerting setup
- [ ] Handover & training

---

## Appendix A: Talenta API Reference

Full API documentation: https://documenter.getpostman.com/view/12246328/UVR5qp6v

## Appendix B: Oracle HCM HDL Reference

Oracle HCM Cloud HDL documentation available in Oracle Help Center.

## Appendix C: PGP Key Generation

```bash
# Generate PGP key pair
gpg --full-generate-key

# Export public key
gpg --armor --export your-key-id > public.asc

# Export private key (store in Vault!)
gpg --armor --export-secret-keys your-key-id > private.asc
```

---

## Appendix D: Demo Environment Quick Start

### Prerequisites
- Docker & Docker Compose
- 4GB+ RAM available
- Ports 3000, 3001, 5432, 5433, 8080, 8200 available

### Quick Start Commands

```bash
# 1. Clone repository
git clone <repo-url>
cd hris-middleware

# 2. Generate SSH keys for SFTP
mkdir -p config/keys
ssh-keygen -t ed25519 -f config/keys/sftp_key -N ""

# 3. Generate PGP keys for demo
gpg --batch --gen-key <<EOF
Key-Type: RSA
Key-Length: 2048
Name-Real: HRIS Demo
Expire-Date: 0
%no-protection
%commit
EOF
gpg --armor --export "HRIS Demo" > config/keys/oic_public.asc
gpg --armor --export-secret-keys "HRIS Demo" > config/keys/oic_private.asc

# 4. Copy environment file
cp .env.example .env.demo

# 5. Start demo environment
docker compose -f docker-compose.demo.yml up -d

# 6. Seed sample data
docker compose exec mock-talenta npm run seed

# 7. Verify all services
docker compose ps

# 8. Access services
# Dashboard:  http://localhost:3000
# Mock API:   http://localhost:3001
# Adminer:    http://localhost:8080
# Vault:      http://localhost:8200
```

### Demo Workflow

```bash
# Trigger a sync job
curl -X POST http://localhost:3002/api/sync/trigger

# Watch processing logs
docker compose logs -f middleware mock-oic

# Check results in dashboard
open http://localhost:3000/employees
```

### Cleanup

```bash
# Stop all services
docker compose -f docker-compose.demo.yml down

# Remove volumes (reset data)
docker compose -f docker-compose.demo.yml down -v
```

---

## Appendix E: Project Directory Structure

```
hris-middleware/
├── docker-compose.yml              # Production compose
├── docker-compose.demo.yml         # Demo compose
├── .env.example
├── .env.demo
│
├── services/
│   ├── middleware/                 # Main middleware (same for prod/demo)
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── src/
│   │       ├── api-consumer/       # Talenta API client
│   │       ├── transformer/        # Data transformation
│   │       ├── pdf-generator/      # Payslip/Tax PDF
│   │       ├── encryption/         # PGP encryption
│   │       ├── sftp-uploader/      # SFTP client
│   │       └── scheduler/          # Job scheduler
│   │
│   ├── mock-talenta/               # [DEMO ONLY] Fake Talenta API
│   │   ├── Dockerfile
│   │   ├── server.js
│   │   └── data/
│   │       ├── employees.json
│   │       └── payroll.json
│   │
│   ├── mock-oic/                   # [DEMO ONLY] Simulates Oracle OIC
│   │   ├── Dockerfile
│   │   └── src/
│   │       ├── file-watcher.js
│   │       ├── hdl-parser.js
│   │       └── db-loader.js
│   │
│   └── dashboard/                  # [DEMO ONLY] Web UI
│       ├── Dockerfile
│       └── src/
│
├── database/
│   ├── middleware-schema.sql       # Metadata DB schema
│   └── mock-hcm-schema.sql         # [DEMO] Mock HCM schema
│
├── config/
│   ├── keys/                       # PGP & SSH keys
│   └── vault/                      # Vault config
│
├── sample-data/                    # [DEMO] Test data
│   ├── employees.csv
│   └── payroll.csv
│
└── docs/
    ├── api-reference.md
    ├── hdl-format.md
    └── troubleshooting.md
```

---

*Document prepared for internal technical review. Contains confidential integration specifications.*
