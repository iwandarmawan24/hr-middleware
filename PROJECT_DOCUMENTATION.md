# HRIS Middleware - Comprehensive Project Documentation
# Dokumentasi Proyek Lengkap - HRIS Middleware

> **Talenta HR to Oracle HCM Cloud Integration Platform**
> **Platform Integrasi Talenta HR ke Oracle HCM Cloud**

---

## Table of Contents / Daftar Isi

1. [Executive Summary](#1-executive-summary)
2. [Business & Product Documentation](#2-business--product-documentation)
3. [System Overview](#3-system-overview)
4. [Infrastructure & Deployment](#4-infrastructure--deployment)
5. [Technology Stack Breakdown](#5-technology-stack-breakdown)
6. [Backend Architecture](#6-backend-architecture)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Security Design](#8-security-design)
9. [Data & Storage](#9-data--storage)
10. [Development Guide](#10-development-guide)
11. [Modification & Extension Guide](#11-modification--extension-guide)
12. [Operations Guide](#12-operations-guide)
13. [Glossary](#13-glossary)
14. [Final Notes](#14-final-notes)

---

## 1. Executive Summary

### 🇮🇩 Bahasa Indonesia

#### Apa Itu Proyek Ini?

HRIS Middleware adalah platform integrasi yang menghubungkan sistem HR Talenta (Mekari) dengan Oracle HCM Cloud. Proyek ini berfungsi sebagai "jembatan" yang mengambil data karyawan dan penggajian dari Talenta, lalu mengubahnya ke format yang dapat dipahami oleh Oracle HCM.

#### Untuk Siapa?

- **Tim HR**: Tidak perlu lagi memasukkan data secara manual ke dua sistem berbeda
- **Tim IT**: Memiliki solusi integrasi yang aman dan dapat dipantau
- **Manajemen**: Mendapatkan data HR yang konsisten di seluruh sistem
- **Karyawan**: Slip gaji dan dokumen pajak tersedia secara otomatis

#### Masalah Bisnis yang Diselesaikan

Banyak perusahaan di Indonesia menggunakan Talenta sebagai sistem HRIS lokal, namun juga menggunakan Oracle HCM Cloud untuk kebutuhan pelaporan global atau regional. Tanpa middleware ini:

1. **Entri Data Manual**: Tim HR harus memasukkan data yang sama ke dua sistem
2. **Inkonsistensi Data**: Data di Talenta dan Oracle sering tidak sinkron
3. **Keterlambatan Pelaporan**: Proses manual memakan waktu dan rawan kesalahan
4. **Risiko Keamanan**: Transfer data manual tidak terenkripsi

#### Mengapa Proyek Ini Ada?

Proyek ini dibuat untuk mengotomatisasi sinkronisasi data HR antara Talenta dan Oracle HCM, dengan fitur:

- Sinkronisasi otomatis data karyawan
- Pemrosesan dan pembuatan slip gaji PDF
- Enkripsi PGP untuk keamanan transfer file
- Audit trail lengkap untuk compliance
- Demo environment untuk pengembangan tanpa kredensial produksi

#### Alur Sistem Tingkat Tinggi (Tanpa Jargon)

```
[Talenta HR] → [Middleware] → [File Terenkripsi] → [Oracle HCM]
     ↑              ↓                                    ↓
  Data HR    Proses & Konversi              Data Tersimpan di Oracle
             Buat Slip Gaji PDF
```

1. **Ambil Data**: Sistem mengambil data karyawan dan penggajian dari Talenta
2. **Proses**: Data diubah ke format Oracle (CSV) dan slip gaji PDF dibuat
3. **Amankan**: Semua file dienkripsi menggunakan PGP
4. **Kirim**: File dikirim melalui SFTP ke server Oracle
5. **Muat**: Oracle memproses dan memuat data ke database HCM

---

### 🇺🇸 English

#### What Is This Project?

HRIS Middleware is an integration platform that connects Talenta HR system (Mekari) with Oracle HCM Cloud. This project functions as a "bridge" that fetches employee and payroll data from Talenta, then transforms it into a format that Oracle HCM can understand.

#### Who Is It For?

- **HR Teams**: No more manual data entry into two different systems
- **IT Teams**: Have a secure and monitorable integration solution
- **Management**: Get consistent HR data across all systems
- **Employees**: Payslips and tax documents are available automatically

#### Business Problem Being Solved

Many companies in Indonesia use Talenta as their local HRIS system, but also use Oracle HCM Cloud for global or regional reporting needs. Without this middleware:

1. **Manual Data Entry**: HR teams must enter the same data into two systems
2. **Data Inconsistency**: Data in Talenta and Oracle often becomes out of sync
3. **Reporting Delays**: Manual processes are time-consuming and error-prone
4. **Security Risks**: Manual data transfer is not encrypted

#### Why Does This Project Exist?

This project was created to automate HR data synchronization between Talenta and Oracle HCM, featuring:

- Automatic employee data synchronization
- Payroll processing and PDF payslip generation
- PGP encryption for secure file transfer
- Complete audit trail for compliance
- Demo environment for development without production credentials

#### High-Level System Flow (No Jargon)

```
[Talenta HR] → [Middleware] → [Encrypted Files] → [Oracle HCM]
     ↑              ↓                                    ↓
  HR Data    Process & Convert              Data Stored in Oracle
             Generate PDF Payslips
```

1. **Fetch Data**: System retrieves employee and payroll data from Talenta
2. **Process**: Data is converted to Oracle format (CSV) and PDF payslips are generated
3. **Secure**: All files are encrypted using PGP
4. **Send**: Files are transferred via SFTP to Oracle server
5. **Load**: Oracle processes and loads data into HCM database

---

## 2. Business & Product Documentation

### 🇮🇩 Bahasa Indonesia

#### Model Bisnis

Proyek ini adalah **middleware integrasi internal** yang berfungsi sebagai komponen infrastruktur. Ini bukan produk yang dijual, melainkan solusi teknis untuk kebutuhan integrasi sistem internal perusahaan.

**Nilai yang Diberikan:**
- Menghemat waktu tim HR (estimasi 20+ jam/bulan untuk entri data manual)
- Mengurangi kesalahan data hingga mendekati nol
- Memenuhi standar keamanan enterprise (enkripsi PGP)
- Menyediakan audit trail untuk kepatuhan regulasi

#### Proposisi Nilai

| Stakeholder | Nilai yang Diterima |
|-------------|---------------------|
| HR Manager | Data konsisten, tidak ada entri manual ganda |
| IT Manager | Sistem terintegrasi, mudah dipantau, aman |
| CFO | Pelaporan tepat waktu, data akurat untuk audit |
| Karyawan | Slip gaji otomatis, akses dokumen cepat |

#### Persona Pengguna

**1. Admin HR (Pengguna Utama)**
- **Nama Fiktif**: Ibu Sari
- **Peran**: HR Administrator
- **Kebutuhan**: Memastikan data karyawan sinkron, mengakses laporan sync
- **Pain Points**: Sebelumnya harus memasukkan data ke dua sistem manual
- **Interaksi dengan Sistem**: Memantau status sync, memverifikasi data

**2. IT Administrator (Pengguna Teknis)**
- **Nama Fiktif**: Pak Budi
- **Peran**: System Administrator
- **Kebutuhan**: Memantau kesehatan sistem, mengelola konfigurasi
- **Pain Points**: Harus menjaga integrasi aman dan berjalan lancar
- **Interaksi dengan Sistem**: Konfigurasi, monitoring, troubleshooting

**3. Developer (Pengguna Pengembangan)**
- **Nama Fiktif**: Mas Andi
- **Peran**: Software Developer
- **Kebutuhan**: Mengembangkan dan memodifikasi integrasi
- **Pain Points**: Membutuhkan environment untuk testing tanpa data produksi
- **Interaksi dengan Sistem**: Development, testing, deployment

#### Perjalanan Pengguna (User Journey)

**Alur Sinkronisasi Karyawan Baru:**

```
1. HR menambahkan karyawan baru di Talenta
           ↓
2. Middleware mendeteksi karyawan baru saat sync terjadwal
           ↓
3. Data karyawan ditransformasi ke format Oracle
           ↓
4. File CSV dienkripsi dan dikirim ke SFTP
           ↓
5. Oracle memuat data ke HCM
           ↓
6. Karyawan tersedia di kedua sistem
```

**Alur Pemrosesan Penggajian:**

```
1. HR memproses penggajian di Talenta
           ↓
2. Middleware mengambil data payroll untuk periode tersebut
           ↓
3. Slip gaji PDF dibuat dengan format profesional
           ↓
4. Data dikonversi ke HDL CSV untuk Oracle
           ↓
5. File dienkripsi dan dikirim
           ↓
6. Slip gaji tersedia di Oracle HCM
```

#### Rincian Fitur

| Fitur | Deskripsi | Status |
|-------|-----------|--------|
| Employee Sync | Sinkronisasi data master karyawan | ✅ Aktif |
| Payroll Processing | Mengambil dan memproses data penggajian | ✅ Aktif |
| PDF Payslip Generation | Membuat slip gaji format PDF | ✅ Aktif |
| Tax Statement Generation | Membuat bukti potong pajak | ✅ Aktif |
| PGP Encryption | Enkripsi file sebelum transfer | ✅ Aktif |
| SFTP Transfer | Upload file ke server Oracle | ✅ Aktif |
| Job Scheduling | Penjadwalan sync otomatis | ✅ Aktif |
| Audit Logging | Pencatatan semua aktivitas | ✅ Aktif |
| Mock Talenta API | API tiruan untuk development | ✅ Demo |
| Mock Oracle OIC | Simulasi Oracle Integration Cloud | ✅ Demo |
| Web Dashboard | Antarmuka web untuk monitoring | 🚧 Planned |

#### Kasus Penggunaan Nyata

**Kasus 1: Sinkronisasi Bulanan**
> PT. ABC Indonesia menggunakan Talenta untuk 500 karyawan. Setiap bulan, middleware otomatis mensinkronkan data karyawan baru, perubahan, dan penggajian ke Oracle HCM untuk pelaporan regional.

**Kasus 2: Onboarding Karyawan Baru**
> Ketika HR memasukkan 10 karyawan baru di Talenta, middleware secara otomatis membuat profil mereka di Oracle HCM dalam siklus sync berikutnya (default: 2 AM setiap hari).

**Kasus 3: Distribusi Slip Gaji**
> Setelah penggajian diproses di Talenta, middleware menghasilkan slip gaji PDF yang dilindungi password (menggunakan NIK karyawan) dan mengunggahnya ke Oracle HCM untuk akses karyawan.

#### Asumsi & Batasan

**Asumsi:**
- Talenta API tersedia dan dapat diakses
- Kredensial API Talenta valid dan memiliki izin yang diperlukan
- Oracle HCM/OIC dapat menerima file melalui SFTP
- Kunci PGP sudah dikonfigurasi dengan benar
- Database PostgreSQL tersedia dan dapat diakses

**Batasan:**
- Sinkronisasi satu arah (Talenta → Oracle) saja
- Tidak ada sinkronisasi real-time (berbasis jadwal)
- Membutuhkan koneksi internet stabil
- Format data spesifik untuk Oracle HDL

---

### 🇺🇸 English

#### Business Model

This project is an **internal integration middleware** that functions as an infrastructure component. It is not a product for sale, but rather a technical solution for internal system integration needs.

**Value Delivered:**
- Saves HR team time (estimated 20+ hours/month for manual data entry)
- Reduces data errors to near zero
- Meets enterprise security standards (PGP encryption)
- Provides audit trail for regulatory compliance

#### Value Proposition

| Stakeholder | Value Received |
|-------------|----------------|
| HR Manager | Consistent data, no duplicate manual entry |
| IT Manager | Integrated system, easy to monitor, secure |
| CFO | Timely reporting, accurate data for audit |
| Employees | Automatic payslips, quick document access |

#### User Personas

**1. HR Admin (Primary User)**
- **Fictional Name**: Mrs. Sari
- **Role**: HR Administrator
- **Needs**: Ensure employee data is synced, access sync reports
- **Pain Points**: Previously had to enter data into two systems manually
- **System Interaction**: Monitor sync status, verify data

**2. IT Administrator (Technical User)**
- **Fictional Name**: Mr. Budi
- **Role**: System Administrator
- **Needs**: Monitor system health, manage configuration
- **Pain Points**: Must keep integration secure and running smoothly
- **System Interaction**: Configuration, monitoring, troubleshooting

**3. Developer (Development User)**
- **Fictional Name**: Andi
- **Role**: Software Developer
- **Needs**: Develop and modify integration
- **Pain Points**: Needs environment for testing without production data
- **System Interaction**: Development, testing, deployment

#### User Journeys

**New Employee Synchronization Flow:**

```
1. HR adds new employee in Talenta
           ↓
2. Middleware detects new employee during scheduled sync
           ↓
3. Employee data is transformed to Oracle format
           ↓
4. CSV file is encrypted and sent to SFTP
           ↓
5. Oracle loads data into HCM
           ↓
6. Employee is available in both systems
```

**Payroll Processing Flow:**

```
1. HR processes payroll in Talenta
           ↓
2. Middleware fetches payroll data for that period
           ↓
3. PDF payslips are generated with professional formatting
           ↓
4. Data is converted to HDL CSV for Oracle
           ↓
5. Files are encrypted and sent
           ↓
6. Payslips are available in Oracle HCM
```

#### Feature Breakdown

| Feature | Description | Status |
|---------|-------------|--------|
| Employee Sync | Synchronize employee master data | ✅ Active |
| Payroll Processing | Fetch and process payroll data | ✅ Active |
| PDF Payslip Generation | Create payslips in PDF format | ✅ Active |
| Tax Statement Generation | Create tax withholding documents | ✅ Active |
| PGP Encryption | Encrypt files before transfer | ✅ Active |
| SFTP Transfer | Upload files to Oracle server | ✅ Active |
| Job Scheduling | Automatic sync scheduling | ✅ Active |
| Audit Logging | Record all activities | ✅ Active |
| Mock Talenta API | Mock API for development | ✅ Demo |
| Mock Oracle OIC | Oracle Integration Cloud simulation | ✅ Demo |
| Web Dashboard | Web interface for monitoring | 🚧 Planned |

#### Real-World Use Cases

**Case 1: Monthly Synchronization**
> PT. ABC Indonesia uses Talenta for 500 employees. Every month, the middleware automatically synchronizes new employees, changes, and payroll to Oracle HCM for regional reporting.

**Case 2: New Employee Onboarding**
> When HR enters 10 new employees in Talenta, the middleware automatically creates their profiles in Oracle HCM in the next sync cycle (default: 2 AM daily).

**Case 3: Payslip Distribution**
> After payroll is processed in Talenta, the middleware generates password-protected PDF payslips (using employee NIK) and uploads them to Oracle HCM for employee access.

#### Assumptions & Constraints

**Assumptions:**
- Talenta API is available and accessible
- Talenta API credentials are valid and have required permissions
- Oracle HCM/OIC can receive files via SFTP
- PGP keys are properly configured
- PostgreSQL database is available and accessible

**Constraints:**
- One-way synchronization (Talenta → Oracle) only
- No real-time synchronization (schedule-based)
- Requires stable internet connection
- Data format specific to Oracle HDL

---

## 3. System Overview

### 🇮🇩 Bahasa Indonesia

#### Tipe Arsitektur

Proyek ini menggunakan **Arsitektur Microservices** dengan pola **Event-Driven** dan **ETL (Extract-Transform-Load)**. Setiap komponen berjalan sebagai container Docker terpisah yang berkomunikasi melalui jaringan internal.

**Mengapa Arsitektur Ini Dipilih:**

1. **Isolasi**: Setiap layanan dapat dikembangkan, di-deploy, dan di-scale secara independen
2. **Keamanan**: Komponen sensitif (seperti enkripsi) terisolasi
3. **Testability**: Mock services memungkinkan testing tanpa sistem eksternal
4. **Maintainability**: Kode terorganisir per fungsi bisnis
5. **Reliability**: Kegagalan satu layanan tidak menjatuhkan seluruh sistem

#### Diagram Komponen Tingkat Tinggi

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           HRIS MIDDLEWARE ECOSYSTEM                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐                                      ┌──────────────────┐ │
│  │   TALENTA    │                                      │   ORACLE HCM     │ │
│  │   HR API     │◄─────┐                        ┌─────►│   CLOUD          │ │
│  │  (External)  │      │                        │      │   (External)     │ │
│  └──────────────┘      │                        │      └──────────────────┘ │
│         ▲              │                        │              ▲            │
│         │              │                        │              │            │
│  ┌──────┴───────┐      │                        │      ┌───────┴─────────┐  │
│  │ MOCK TALENTA │      │                        │      │    MOCK OIC     │  │
│  │   (Demo)     │      │                        │      │    (Demo)       │  │
│  │  Port: 3001  │      │                        │      │                 │  │
│  └──────────────┘      │                        │      └─────────────────┘  │
│                        │                        │              │            │
│                        ▼                        │              ▼            │
│               ┌────────────────────┐    ┌──────┴───────┐                   │
│               │                    │    │              │                   │
│               │     MIDDLEWARE     │───►│ SFTP SERVER  │                   │
│               │     Port: 3002     │    │  Port: 2222  │                   │
│               │                    │    │              │                   │
│               └─────────┬──────────┘    └──────────────┘                   │
│                         │                                                   │
│         ┌───────────────┼───────────────┐                                  │
│         ▼               ▼               ▼                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                           │
│  │ POSTGRES   │  │   REDIS    │  │   VAULT    │                           │
│  │ MIDDLEWARE │  │   Queue    │  │  Secrets   │                           │
│  │ Port: 5432 │  │ Port: 6379 │  │ Port: 8200 │                           │
│  └────────────┘  └────────────┘  └────────────┘                           │
│         │                                                                   │
│  ┌──────┴──────┐                                                           │
│  │  POSTGRES   │                                                           │
│  │  MOCK HCM   │                                                           │
│  │ Port: 5433  │                                                           │
│  └─────────────┘                                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Tanggung Jawab Komponen

| Komponen | Tanggung Jawab |
|----------|----------------|
| **Middleware** | Orkestrasi utama: mengambil data, transformasi, enkripsi, upload |
| **Mock Talenta** | Mensimulasikan API Talenta HR untuk development |
| **Mock OIC** | Mensimulasikan Oracle Integration Cloud (watcher, decryptor, loader) |
| **PostgreSQL Middleware** | Menyimpan metadata: employees, documents, jobs, logs |
| **PostgreSQL HCM** | Mensimulasikan database Oracle HCM Fusion |
| **Redis** | Job queue management dan caching |
| **SFTP Server** | Transfer file terenkripsi |
| **Vault** | Manajemen secrets dan kredensial |
| **Adminer** | Web UI untuk database administration |

#### Alur Data

```
┌────────────────────────────────────────────────────────────────────────────┐
│                            DATA FLOW DIAGRAM                                │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. EXTRACT (Pengambilan Data)                                             │
│  ┌─────────────┐         ┌─────────────┐                                   │
│  │   Talenta   │ ──API──►│  Middleware │                                   │
│  │   HR API    │         │  (Extract)  │                                   │
│  └─────────────┘         └──────┬──────┘                                   │
│                                 │                                           │
│  2. TRANSFORM (Transformasi)    ▼                                           │
│                          ┌──────────────┐                                   │
│                          │  Transform   │                                   │
│                          │  - HDL CSV   │                                   │
│                          │  - PDF Gen   │                                   │
│                          │  - Validate  │                                   │
│                          └──────┬───────┘                                   │
│                                 │                                           │
│  3. SECURE (Pengamanan)         ▼                                           │
│                          ┌──────────────┐                                   │
│                          │  Encrypt     │                                   │
│                          │  - PGP       │                                   │
│                          │  - Password  │                                   │
│                          └──────┬───────┘                                   │
│                                 │                                           │
│  4. TRANSFER (Pengiriman)       ▼                                           │
│                          ┌──────────────┐    ┌──────────────┐              │
│                          │    SFTP      │───►│ Oracle OIC   │              │
│                          │   Upload     │    │  (Watcher)   │              │
│                          └──────────────┘    └──────┬───────┘              │
│                                                     │                       │
│  5. LOAD (Pemuatan)                                 ▼                       │
│                                              ┌──────────────┐              │
│                                              │  Oracle HCM  │              │
│                                              │   Database   │              │
│                                              └──────────────┘              │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

### 🇺🇸 English

#### Architecture Type

This project uses a **Microservices Architecture** with **Event-Driven** and **ETL (Extract-Transform-Load)** patterns. Each component runs as a separate Docker container communicating through an internal network.

**Why This Architecture Was Chosen:**

1. **Isolation**: Each service can be developed, deployed, and scaled independently
2. **Security**: Sensitive components (like encryption) are isolated
3. **Testability**: Mock services enable testing without external systems
4. **Maintainability**: Code is organized by business function
5. **Reliability**: Failure of one service doesn't bring down the entire system

#### High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           HRIS MIDDLEWARE ECOSYSTEM                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐                                      ┌──────────────────┐ │
│  │   TALENTA    │                                      │   ORACLE HCM     │ │
│  │   HR API     │◄─────┐                        ┌─────►│   CLOUD          │ │
│  │  (External)  │      │                        │      │   (External)     │ │
│  └──────────────┘      │                        │      └──────────────────┘ │
│         ▲              │                        │              ▲            │
│         │              │                        │              │            │
│  ┌──────┴───────┐      │                        │      ┌───────┴─────────┐  │
│  │ MOCK TALENTA │      │                        │      │    MOCK OIC     │  │
│  │   (Demo)     │      │                        │      │    (Demo)       │  │
│  │  Port: 3001  │      │                        │      │                 │  │
│  └──────────────┘      │                        │      └─────────────────┘  │
│                        │                        │              │            │
│                        ▼                        │              ▼            │
│               ┌────────────────────┐    ┌──────┴───────┐                   │
│               │                    │    │              │                   │
│               │     MIDDLEWARE     │───►│ SFTP SERVER  │                   │
│               │     Port: 3002     │    │  Port: 2222  │                   │
│               │                    │    │              │                   │
│               └─────────┬──────────┘    └──────────────┘                   │
│                         │                                                   │
│         ┌───────────────┼───────────────┐                                  │
│         ▼               ▼               ▼                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                           │
│  │ POSTGRES   │  │   REDIS    │  │   VAULT    │                           │
│  │ MIDDLEWARE │  │   Queue    │  │  Secrets   │                           │
│  │ Port: 5432 │  │ Port: 6379 │  │ Port: 8200 │                           │
│  └────────────┘  └────────────┘  └────────────┘                           │
│         │                                                                   │
│  ┌──────┴──────┐                                                           │
│  │  POSTGRES   │                                                           │
│  │  MOCK HCM   │                                                           │
│  │ Port: 5433  │                                                           │
│  └─────────────┘                                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| **Middleware** | Main orchestration: fetch data, transform, encrypt, upload |
| **Mock Talenta** | Simulates Talenta HR API for development |
| **Mock OIC** | Simulates Oracle Integration Cloud (watcher, decryptor, loader) |
| **PostgreSQL Middleware** | Stores metadata: employees, documents, jobs, logs |
| **PostgreSQL HCM** | Simulates Oracle HCM Fusion database |
| **Redis** | Job queue management and caching |
| **SFTP Server** | Encrypted file transfer |
| **Vault** | Secrets and credentials management |
| **Adminer** | Web UI for database administration |

#### Data Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                            DATA FLOW DIAGRAM                                │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. EXTRACT (Data Retrieval)                                               │
│  ┌─────────────┐         ┌─────────────┐                                   │
│  │   Talenta   │ ──API──►│  Middleware │                                   │
│  │   HR API    │         │  (Extract)  │                                   │
│  └─────────────┘         └──────┬──────┘                                   │
│                                 │                                           │
│  2. TRANSFORM (Transformation)  ▼                                           │
│                          ┌──────────────┐                                   │
│                          │  Transform   │                                   │
│                          │  - HDL CSV   │                                   │
│                          │  - PDF Gen   │                                   │
│                          │  - Validate  │                                   │
│                          └──────┬───────┘                                   │
│                                 │                                           │
│  3. SECURE (Security)           ▼                                           │
│                          ┌──────────────┐                                   │
│                          │  Encrypt     │                                   │
│                          │  - PGP       │                                   │
│                          │  - Password  │                                   │
│                          └──────┬───────┘                                   │
│                                 │                                           │
│  4. TRANSFER (Delivery)         ▼                                           │
│                          ┌──────────────┐    ┌──────────────┐              │
│                          │    SFTP      │───►│ Oracle OIC   │              │
│                          │   Upload     │    │  (Watcher)   │              │
│                          └──────────────┘    └──────┬───────┘              │
│                                                     │                       │
│  5. LOAD (Loading)                                  ▼                       │
│                                              ┌──────────────┐              │
│                                              │  Oracle HCM  │              │
│                                              │   Database   │              │
│                                              └──────────────┘              │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Infrastructure & Deployment

### 🇮🇩 Bahasa Indonesia

#### Hosting & Environment

**Lingkungan yang Tersedia:**

| Environment | Tujuan | File Konfigurasi |
|-------------|--------|------------------|
| **Demo** | Development & testing dengan mock services | `docker-compose.demo.yml` |
| **Integrated** | Production-ready dengan API Talenta asli | `docker-compose.integrated.yml` |

**Container Registry:**
- Semua image dibangun secara lokal menggunakan Dockerfile
- Base image: Node.js 20 Alpine Linux (minimal footprint)

#### Desain Jaringan

```
┌─────────────────────────────────────────────────────────────────┐
│                    Docker Network: hris-network                  │
│                       (bridge mode)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Internal Services (tidak diekspos ke host):                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ mock-oic    │ │ vault       │ │ redis       │               │
│  │ (internal)  │ │ (8200)      │ │ (6379)      │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
│                                                                  │
│  Exposed Services (dapat diakses dari host):                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ mock-talenta│ │ middleware  │ │ sftp-server │               │
│  │ :3001       │ │ :3002       │ │ :2222       │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
│                                                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ postgres-mw │ │ postgres-hcm│ │ adminer     │               │
│  │ :5432       │ │ :5433       │ │ :8080       │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Port Mapping:**

| Service | Internal Port | Host Port | Protokol |
|---------|---------------|-----------|----------|
| Mock Talenta | 3001 | 3001 | HTTP |
| Middleware | 3002 | 3002 | HTTP |
| PostgreSQL Middleware | 5432 | 5432 | TCP |
| PostgreSQL HCM | 5432 | 5433 | TCP |
| Redis | 6379 | 6379 | TCP |
| SFTP | 22 | 2222 | SSH/SFTP |
| Vault | 8200 | 8200 | HTTP |
| Adminer | 8080 | 8080 | HTTP |

#### Development / Staging / Production

**Perbedaan Environment:**

| Aspek | Demo (Dev) | Integrated (Staging/Prod) |
|-------|------------|---------------------------|
| Talenta API | Mock (localhost:3001) | Real (api.mekari.com) |
| Oracle OIC | Mock (internal) | Real (customer SFTP) |
| Enkripsi | Opsional (SKIP_ENCRYPTION) | Wajib |
| Scheduling | Dinonaktifkan | 2 AM setiap hari |
| Data | Sample (50 karyawan) | Data produksi |
| Secrets | File .env | HashiCorp Vault |

**Startup Scripts:**

```bash
# Demo Environment
./start-demo.sh          # Memulai dengan mock services
docker-compose -f docker-compose.demo.yml up -d

# Integrated Environment
./start-integrated.sh    # Memulai dengan API Talenta asli
docker-compose -f docker-compose.integrated.yml up -d
```

#### CI/CD Pipeline

**Pipeline yang Direkomendasikan (belum diimplementasikan):**

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│   Code   │───►│  Build   │───►│   Test   │───►│  Deploy  │
│   Push   │    │  Images  │    │  (Jest)  │    │  (Docker)│
└──────────┘    └──────────┘    └──────────┘    └──────────┘
     │               │               │               │
     ▼               ▼               ▼               ▼
  GitHub         Docker           Unit +         Staging/
  Actions        Build           Integration      Production
```

**Langkah Build Manual:**

```bash
# Build semua images
docker-compose -f docker-compose.demo.yml build

# Build service spesifik
docker-compose -f docker-compose.demo.yml build middleware
```

#### Manajemen Secrets

**Demo Mode:**
- Secrets disimpan di file `.env`
- Password default untuk development

**Production Mode:**
- HashiCorp Vault untuk secret management
- Vault path: `secret/data/hris/*`
- Secrets yang dikelola:
  - Database credentials
  - API keys (Talenta)
  - PGP private keys
  - SFTP credentials

**Contoh Vault Secret:**

```bash
# Menyimpan secret ke Vault
vault kv put secret/hris/database \
  host=postgres-middleware \
  port=5432 \
  username=hris \
  password=<secure-password>
```

#### Skalabilitas

**Horizontal Scaling:**

```yaml
# docker-compose scale
docker-compose -f docker-compose.demo.yml up -d --scale middleware=3
```

**Pertimbangan Scaling:**
- Middleware dapat di-scale horizontal dengan load balancer
- Database membutuhkan read replicas untuk high-read scenarios
- Redis dapat dikonfigurasi sebagai cluster
- SFTP adalah single point, perlu dipertimbangkan untuk HA setup

**Rekomendasi untuk Production:**

| Komponen | Minimum | Recommended | High-Load |
|----------|---------|-------------|-----------|
| Middleware | 1 instance | 2 instances | 3+ instances |
| PostgreSQL | 1 primary | 1 primary + 1 replica | Cluster |
| Redis | 1 instance | Sentinel | Cluster |

#### Failure & Recovery

**Strategi Penanganan Kegagalan:**

1. **Container Restart Policy:**
   ```yaml
   restart: unless-stopped
   ```
   Semua container akan restart otomatis jika crash.

2. **Health Checks:**
   ```yaml
   healthcheck:
     test: ["CMD", "curl", "-f", "http://localhost:3002/health"]
     interval: 30s
     timeout: 10s
     retries: 3
   ```

3. **Job Retry Logic:**
   - Jobs yang gagal dicatat dengan status FAILED
   - Dapat di-trigger ulang melalui API
   - Exponential backoff untuk API calls

4. **Database Recovery:**
   - PostgreSQL volumes persisten di Docker
   - Backup strategy direkomendasikan untuk production

**Recovery Procedures:**

```bash
# Restart single service
docker-compose restart middleware

# Restart semua services
docker-compose down && docker-compose up -d

# Reset database (HATI-HATI!)
docker-compose down -v  # Menghapus volumes
docker-compose up -d    # Recreate dengan schema baru
```

---

### 🇺🇸 English

#### Hosting & Environment

**Available Environments:**

| Environment | Purpose | Configuration File |
|-------------|---------|-------------------|
| **Demo** | Development & testing with mock services | `docker-compose.demo.yml` |
| **Integrated** | Production-ready with real Talenta API | `docker-compose.integrated.yml` |

**Container Registry:**
- All images are built locally using Dockerfile
- Base image: Node.js 20 Alpine Linux (minimal footprint)

#### Network Design

```
┌─────────────────────────────────────────────────────────────────┐
│                    Docker Network: hris-network                  │
│                       (bridge mode)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Internal Services (not exposed to host):                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ mock-oic    │ │ vault       │ │ redis       │               │
│  │ (internal)  │ │ (8200)      │ │ (6379)      │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
│                                                                  │
│  Exposed Services (accessible from host):                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ mock-talenta│ │ middleware  │ │ sftp-server │               │
│  │ :3001       │ │ :3002       │ │ :2222       │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
│                                                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ postgres-mw │ │ postgres-hcm│ │ adminer     │               │
│  │ :5432       │ │ :5433       │ │ :8080       │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Port Mapping:**

| Service | Internal Port | Host Port | Protocol |
|---------|---------------|-----------|----------|
| Mock Talenta | 3001 | 3001 | HTTP |
| Middleware | 3002 | 3002 | HTTP |
| PostgreSQL Middleware | 5432 | 5432 | TCP |
| PostgreSQL HCM | 5432 | 5433 | TCP |
| Redis | 6379 | 6379 | TCP |
| SFTP | 22 | 2222 | SSH/SFTP |
| Vault | 8200 | 8200 | HTTP |
| Adminer | 8080 | 8080 | HTTP |

#### Development / Staging / Production

**Environment Differences:**

| Aspect | Demo (Dev) | Integrated (Staging/Prod) |
|--------|------------|---------------------------|
| Talenta API | Mock (localhost:3001) | Real (api.mekari.com) |
| Oracle OIC | Mock (internal) | Real (customer SFTP) |
| Encryption | Optional (SKIP_ENCRYPTION) | Required |
| Scheduling | Disabled | 2 AM daily |
| Data | Sample (50 employees) | Production data |
| Secrets | .env files | HashiCorp Vault |

**Startup Scripts:**

```bash
# Demo Environment
./start-demo.sh          # Start with mock services
docker-compose -f docker-compose.demo.yml up -d

# Integrated Environment
./start-integrated.sh    # Start with real Talenta API
docker-compose -f docker-compose.integrated.yml up -d
```

#### CI/CD Pipeline

**Recommended Pipeline (not yet implemented):**

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│   Code   │───►│  Build   │───►│   Test   │───►│  Deploy  │
│   Push   │    │  Images  │    │  (Jest)  │    │  (Docker)│
└──────────┘    └──────────┘    └──────────┘    └──────────┘
     │               │               │               │
     ▼               ▼               ▼               ▼
  GitHub         Docker           Unit +         Staging/
  Actions        Build           Integration      Production
```

**Manual Build Steps:**

```bash
# Build all images
docker-compose -f docker-compose.demo.yml build

# Build specific service
docker-compose -f docker-compose.demo.yml build middleware
```

#### Secrets Management

**Demo Mode:**
- Secrets stored in `.env` files
- Default passwords for development

**Production Mode:**
- HashiCorp Vault for secret management
- Vault path: `secret/data/hris/*`
- Managed secrets:
  - Database credentials
  - API keys (Talenta)
  - PGP private keys
  - SFTP credentials

**Vault Secret Example:**

```bash
# Store secret to Vault
vault kv put secret/hris/database \
  host=postgres-middleware \
  port=5432 \
  username=hris \
  password=<secure-password>
```

#### Scalability

**Horizontal Scaling:**

```yaml
# docker-compose scale
docker-compose -f docker-compose.demo.yml up -d --scale middleware=3
```

**Scaling Considerations:**
- Middleware can be horizontally scaled with load balancer
- Database needs read replicas for high-read scenarios
- Redis can be configured as cluster
- SFTP is single point, consider HA setup

**Production Recommendations:**

| Component | Minimum | Recommended | High-Load |
|-----------|---------|-------------|-----------|
| Middleware | 1 instance | 2 instances | 3+ instances |
| PostgreSQL | 1 primary | 1 primary + 1 replica | Cluster |
| Redis | 1 instance | Sentinel | Cluster |

#### Failure & Recovery

**Failure Handling Strategy:**

1. **Container Restart Policy:**
   ```yaml
   restart: unless-stopped
   ```
   All containers will auto-restart if crashed.

2. **Health Checks:**
   ```yaml
   healthcheck:
     test: ["CMD", "curl", "-f", "http://localhost:3002/health"]
     interval: 30s
     timeout: 10s
     retries: 3
   ```

3. **Job Retry Logic:**
   - Failed jobs are recorded with FAILED status
   - Can be re-triggered via API
   - Exponential backoff for API calls

4. **Database Recovery:**
   - PostgreSQL volumes persist in Docker
   - Backup strategy recommended for production

**Recovery Procedures:**

```bash
# Restart single service
docker-compose restart middleware

# Restart all services
docker-compose down && docker-compose up -d

# Reset database (CAREFUL!)
docker-compose down -v  # Deletes volumes
docker-compose up -d    # Recreate with new schema
```

---

## 5. Technology Stack Breakdown

### 🇮🇩 Bahasa Indonesia

#### Runtime & Framework

| Teknologi | Apa Itu | Mengapa Digunakan | Masalah yang Diselesaikan |
|-----------|---------|-------------------|---------------------------|
| **Node.js 20** | JavaScript runtime untuk server | Async I/O yang efisien, ekosistem npm yang luas | Menangani banyak koneksi API secara bersamaan |
| **Express.js 4.18** | Web framework minimalis | Simpel, cepat, dan teruji di production | Membangun REST API dengan cepat |
| **Alpine Linux** | OS minimal untuk containers | Image size kecil (~100MB vs ~1GB) | Deployment yang lebih cepat dan hemat resource |

#### Database & Caching

| Teknologi | Apa Itu | Mengapa Digunakan | Masalah yang Diselesaikan |
|-----------|---------|-------------------|---------------------------|
| **PostgreSQL 16** | Database relasional open-source | ACID compliance, JSONB support, mature | Menyimpan data terstruktur dengan relasi kompleks |
| **Redis 7** | In-memory data store | Cepat untuk queue dan caching | Job queue management, mengurangi load database |

#### Data Processing

| Teknologi | Apa Itu | Mengapa Digunakan | Masalah yang Diselesaikan |
|-----------|---------|-------------------|---------------------------|
| **axios 1.6** | HTTP client | Promise-based, interceptors, retry support | Komunikasi dengan Talenta API |
| **csv-parser 3.0** | CSV parsing library | Streaming parser untuk file besar | Parsing HDL CSV dari Oracle |
| **handlebars 4.7** | Template engine | Logic-less templates, aman | Menghasilkan HTML untuk PDF |

#### PDF Generation

| Teknologi | Apa Itu | Mengapa Digunakan | Masalah yang Diselesaikan |
|-----------|---------|-------------------|---------------------------|
| **PDFKit 0.14** | PDF generation library | Pure JavaScript, no dependencies | Membuat slip gaji PDF dengan format profesional |
| **Puppeteer 21.6** | Headless Chrome automation | Rendering HTML ke PDF yang akurat | PDF kompleks dari HTML templates |

#### Security

| Teknologi | Apa Itu | Mengapa Digunakan | Masalah yang Diselesaikan |
|-----------|---------|-------------------|---------------------------|
| **OpenPGP.js 5.11** | PGP encryption library | JavaScript native, no native binaries | Enkripsi file sebelum transfer |
| **HashiCorp Vault** | Secrets management | Enterprise-grade, auditable | Menyimpan kredensial dengan aman |

#### File Transfer & Infrastructure

| Teknologi | Apa Itu | Mengapa Digunakan | Masalah yang Diselesaikan |
|-----------|---------|-------------------|---------------------------|
| **ssh2-sftp-client** | SFTP client library | Promise-based, connection pooling | Upload file ke server Oracle |
| **atmoz/sftp** | SFTP server Docker image | Lightweight, easy configuration | SFTP server untuk demo/testing |
| **chokidar 3.5** | File system watcher | Cross-platform, efficient | Deteksi file baru di SFTP (Mock OIC) |

#### Monitoring & Logging

| Teknologi | Apa Itu | Mengapa Digunakan | Masalah yang Diselesaikan |
|-----------|---------|-------------------|---------------------------|
| **Winston 3.11** | Logging library | Multiple transports, formatting | Structured logging untuk debugging |
| **Bull 4.12** | Redis-based queue | Reliable job processing | Background job management |

#### Development Tools

| Teknologi | Apa Itu | Mengapa Digunakan | Masalah yang Diselesaikan |
|-----------|---------|-------------------|---------------------------|
| **nodemon 3.0** | Auto-restart tool | Hot reload saat development | Tidak perlu restart manual |
| **Jest 29.7** | Testing framework | Snapshot testing, mocking | Unit dan integration testing |
| **ESLint 8.55** | Code linter | Konsistensi kode | Mencegah bugs dan code smell |
| **@faker-js/faker** | Data generation | Realistic fake data | Sample data untuk testing |

#### Alternatif & Trade-offs

| Pilihan Saat Ini | Alternatif | Mengapa Dipilih |
|------------------|------------|-----------------|
| Node.js | Python, Go, Java | JavaScript ekosistem, tim sudah familiar |
| PostgreSQL | MySQL, MongoDB | JSONB support, transaction safety |
| Redis | RabbitMQ, SQS | Simpel setup, sudah proven |
| PDFKit | html-pdf, wkhtmltopdf | No native deps, pure JS |
| Express | Fastify, Koa | Paling mature, banyak middleware |

---

### 🇺🇸 English

#### Runtime & Framework

| Technology | What Is It | Why Used | Problem Solved |
|------------|------------|----------|----------------|
| **Node.js 20** | JavaScript runtime for server | Efficient async I/O, vast npm ecosystem | Handle many API connections concurrently |
| **Express.js 4.18** | Minimalist web framework | Simple, fast, production-tested | Build REST APIs quickly |
| **Alpine Linux** | Minimal OS for containers | Small image size (~100MB vs ~1GB) | Faster deployment, resource efficient |

#### Database & Caching

| Technology | What Is It | Why Used | Problem Solved |
|------------|------------|----------|----------------|
| **PostgreSQL 16** | Open-source relational database | ACID compliance, JSONB support, mature | Store structured data with complex relations |
| **Redis 7** | In-memory data store | Fast for queue and caching | Job queue management, reduce database load |

#### Data Processing

| Technology | What Is It | Why Used | Problem Solved |
|------------|------------|----------|----------------|
| **axios 1.6** | HTTP client | Promise-based, interceptors, retry support | Communication with Talenta API |
| **csv-parser 3.0** | CSV parsing library | Streaming parser for large files | Parsing HDL CSV from Oracle |
| **handlebars 4.7** | Template engine | Logic-less templates, safe | Generate HTML for PDFs |

#### PDF Generation

| Technology | What Is It | Why Used | Problem Solved |
|------------|------------|----------|----------------|
| **PDFKit 0.14** | PDF generation library | Pure JavaScript, no dependencies | Create professional PDF payslips |
| **Puppeteer 21.6** | Headless Chrome automation | Accurate HTML to PDF rendering | Complex PDFs from HTML templates |

#### Security

| Technology | What Is It | Why Used | Problem Solved |
|------------|------------|----------|----------------|
| **OpenPGP.js 5.11** | PGP encryption library | JavaScript native, no native binaries | Encrypt files before transfer |
| **HashiCorp Vault** | Secrets management | Enterprise-grade, auditable | Store credentials securely |

#### File Transfer & Infrastructure

| Technology | What Is It | Why Used | Problem Solved |
|------------|------------|----------|----------------|
| **ssh2-sftp-client** | SFTP client library | Promise-based, connection pooling | Upload files to Oracle server |
| **atmoz/sftp** | SFTP server Docker image | Lightweight, easy configuration | SFTP server for demo/testing |
| **chokidar 3.5** | File system watcher | Cross-platform, efficient | Detect new files in SFTP (Mock OIC) |

#### Monitoring & Logging

| Technology | What Is It | Why Used | Problem Solved |
|------------|------------|----------|----------------|
| **Winston 3.11** | Logging library | Multiple transports, formatting | Structured logging for debugging |
| **Bull 4.12** | Redis-based queue | Reliable job processing | Background job management |

#### Development Tools

| Technology | What Is It | Why Used | Problem Solved |
|------------|------------|----------|----------------|
| **nodemon 3.0** | Auto-restart tool | Hot reload during development | No manual restart needed |
| **Jest 29.7** | Testing framework | Snapshot testing, mocking | Unit and integration testing |
| **ESLint 8.55** | Code linter | Code consistency | Prevent bugs and code smell |
| **@faker-js/faker** | Data generation | Realistic fake data | Sample data for testing |

#### Alternatives & Trade-offs

| Current Choice | Alternative | Why Chosen |
|----------------|-------------|------------|
| Node.js | Python, Go, Java | JavaScript ecosystem, team familiarity |
| PostgreSQL | MySQL, MongoDB | JSONB support, transaction safety |
| Redis | RabbitMQ, SQS | Simple setup, proven |
| PDFKit | html-pdf, wkhtmltopdf | No native deps, pure JS |
| Express | Fastify, Koa | Most mature, many middleware |

---

## 6. Backend Architecture

### 🇮🇩 Bahasa Indonesia

#### Struktur Folder & Modul

```
services/
├── middleware/                 # Layanan integrasi utama
│   ├── src/
│   │   ├── index.js           # Entry point, Express server, routes
│   │   ├── config.js          # Configuration loader & validation
│   │   ├── api-consumer/
│   │   │   └── talenta-client.js  # Wrapper untuk Talenta API
│   │   ├── transformer/
│   │   │   └── hdl-generator.js   # Konversi ke format Oracle HDL
│   │   ├── pdf-generator/
│   │   │   └── payslip-generator.js # Pembuatan slip gaji PDF
│   │   ├── encryption/
│   │   │   └── pgp-service.js     # Layanan enkripsi/dekripsi PGP
│   │   ├── sftp-uploader/
│   │   │   └── sftp-client.js     # Client untuk upload SFTP
│   │   └── utils/
│   │       ├── database.js        # PostgreSQL connection & queries
│   │       └── logger.js          # Winston logging config
│   ├── package.json
│   └── Dockerfile
│
├── mock-talenta/              # Simulasi API Talenta
│   └── src/
│       ├── server.js          # Express server dengan mock endpoints
│       └── seed-data.js       # Generator data sample
│
└── mock-oic/                  # Simulasi Oracle Integration Cloud
    └── src/
        └── index.js           # File watcher, decryptor, DB loader
```

#### Layers & Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                      │
│  (Express Routes: /api/sync/*, /api/jobs, /health)          │
├─────────────────────────────────────────────────────────────┤
│                      APPLICATION LAYER                       │
│  (Business Logic: sync orchestration, job management)        │
├─────────────────────────────────────────────────────────────┤
│                       SERVICE LAYER                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Talenta     │ │ HDL         │ │ PDF         │           │
│  │ Client      │ │ Generator   │ │ Generator   │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│  ┌─────────────┐ ┌─────────────┐                           │
│  │ PGP         │ │ SFTP        │                           │
│  │ Service     │ │ Client      │                           │
│  └─────────────┘ └─────────────┘                           │
├─────────────────────────────────────────────────────────────┤
│                    INFRASTRUCTURE LAYER                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ PostgreSQL  │ │ Redis       │ │ File System │           │
│  │ Database    │ │ Queue       │ │             │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

**Penjelasan Layer:**

1. **Presentation Layer**: Menangani HTTP request/response, routing, input validation
2. **Application Layer**: Orkestrasi bisnis logic, koordinasi antar services
3. **Service Layer**: Implementasi spesifik per fungsi (API client, PDF, encryption)
4. **Infrastructure Layer**: Akses ke external resources (database, file system, queue)

#### Design Patterns yang Digunakan

| Pattern | Penggunaan | Penjelasan |
|---------|------------|------------|
| **Repository Pattern** | Database access | Abstraksi query database di `utils/database.js` |
| **Factory Pattern** | PDF generation | Membuat berbagai tipe dokumen (payslip, tax) |
| **Singleton** | Database connection pool | Satu pool digunakan di seluruh aplikasi |
| **Observer** | File watching (Mock OIC) | Chokidar memantau folder SFTP |
| **Retry with Backoff** | API calls | Automatic retry dengan exponential backoff |

#### Model Data

**Employee Model:**
```javascript
{
  id: UUID,
  talenta_user_id: String,      // ID dari Talenta
  oracle_person_number: String,  // Generated: 30 + 13 digits
  full_name: String,
  email: String,
  national_identifier: String,   // NIK
  department: String,
  position: String,
  branch_id: String,
  employment_status: String,     // ACTIVE, INACTIVE
  created_at: Timestamp,
  updated_at: Timestamp,
  synced_at: Timestamp
}
```

**Document Model:**
```javascript
{
  id: UUID,
  employee_id: UUID,            // FK ke employees
  document_type: String,        // PAYSLIP, TAX_STATEMENT
  document_code: String,        // Unique code per document
  document_name: String,
  period_year: Integer,
  period_month: Integer,
  original_file_path: String,
  status: String,               // PENDING, PROCESSED, ENCRYPTED, UPLOADED, FAILED
  error_message: String,
  metadata: JSONB,              // Additional data
  created_at: Timestamp,
  updated_at: Timestamp
}
```

**Sync Job Model:**
```javascript
{
  id: UUID,
  job_type: String,             // EMPLOYEE_SYNC, PAYROLL_SYNC, FULL_SYNC
  business_unit: String,        // MY, ID, SG, etc.
  status: String,               // PENDING, RUNNING, COMPLETED, FAILED
  started_at: Timestamp,
  completed_at: Timestamp,
  records_total: Integer,
  records_processed: Integer,
  records_failed: Integer,
  error_message: String,
  config: JSONB,                // Job-specific configuration
  created_at: Timestamp
}
```

#### Desain API

**Health Check:**
```http
GET /health

Response 200:
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-02-03T10:00:00Z"
}
```

**Trigger Full Sync:**
```http
POST /api/sync/trigger
Content-Type: application/json

Response 200:
{
  "status": "success",
  "message": "Full sync triggered",
  "jobId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Sync Employees Only:**
```http
POST /api/sync/employees

Response 200:
{
  "status": "success",
  "message": "Employee sync completed",
  "data": {
    "synced": 50,
    "created": 5,
    "updated": 45
  }
}
```

**Process Payroll:**
```http
POST /api/sync/payroll
Content-Type: application/json

Request:
{
  "year": 2026,
  "month": 1
}

Response 200:
{
  "status": "success",
  "message": "Payroll processing triggered",
  "jobId": "550e8400-e29b-41d4-a716-446655440001"
}
```

**Get Jobs:**
```http
GET /api/jobs

Response 200:
{
  "status": "success",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "job_type": "FULL_SYNC",
      "status": "COMPLETED",
      "records_processed": 50,
      "started_at": "2026-02-03T02:00:00Z",
      "completed_at": "2026-02-03T02:05:00Z"
    }
  ]
}
```

#### Error Handling

**Error Response Format:**
```javascript
{
  "status": "error",
  "error": {
    "code": "TALENTA_API_ERROR",
    "message": "Failed to fetch employees from Talenta",
    "details": "Connection timeout after 30000ms"
  },
  "timestamp": "2026-02-03T10:00:00Z"
}
```

**Error Codes:**

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Input validation failed | 400 |
| `TALENTA_API_ERROR` | Talenta API communication failed | 502 |
| `DATABASE_ERROR` | Database operation failed | 500 |
| `ENCRYPTION_ERROR` | PGP encryption failed | 500 |
| `SFTP_ERROR` | SFTP upload failed | 502 |
| `NOT_FOUND` | Resource not found | 404 |

#### Auth Flow

**Talenta API Authentication:**
```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  Middleware │         │   Vault     │         │  Talenta    │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                       │
       │  Get API credentials  │                       │
       │──────────────────────►│                       │
       │                       │                       │
       │  Return client_id &   │                       │
       │  client_secret        │                       │
       │◄──────────────────────│                       │
       │                       │                       │
       │  API Request with Bearer Token               │
       │──────────────────────────────────────────────►│
       │                       │                       │
       │  Response with employee/payroll data         │
       │◄──────────────────────────────────────────────│
       │                       │                       │
```

**Internal Services:**
- No authentication between internal Docker services
- Services communicate via Docker network
- Network isolation provides security boundary

---

### 🇺🇸 English

#### Folder & Module Structure

```
services/
├── middleware/                 # Main integration service
│   ├── src/
│   │   ├── index.js           # Entry point, Express server, routes
│   │   ├── config.js          # Configuration loader & validation
│   │   ├── api-consumer/
│   │   │   └── talenta-client.js  # Wrapper for Talenta API
│   │   ├── transformer/
│   │   │   └── hdl-generator.js   # Convert to Oracle HDL format
│   │   ├── pdf-generator/
│   │   │   └── payslip-generator.js # PDF payslip generation
│   │   ├── encryption/
│   │   │   └── pgp-service.js     # PGP encryption/decryption service
│   │   ├── sftp-uploader/
│   │   │   └── sftp-client.js     # SFTP upload client
│   │   └── utils/
│   │       ├── database.js        # PostgreSQL connection & queries
│   │       └── logger.js          # Winston logging config
│   ├── package.json
│   └── Dockerfile
│
├── mock-talenta/              # Talenta API simulation
│   └── src/
│       ├── server.js          # Express server with mock endpoints
│       └── seed-data.js       # Sample data generator
│
└── mock-oic/                  # Oracle Integration Cloud simulation
    └── src/
        └── index.js           # File watcher, decryptor, DB loader
```

#### Layers & Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                      │
│  (Express Routes: /api/sync/*, /api/jobs, /health)          │
├─────────────────────────────────────────────────────────────┤
│                      APPLICATION LAYER                       │
│  (Business Logic: sync orchestration, job management)        │
├─────────────────────────────────────────────────────────────┤
│                       SERVICE LAYER                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Talenta     │ │ HDL         │ │ PDF         │           │
│  │ Client      │ │ Generator   │ │ Generator   │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│  ┌─────────────┐ ┌─────────────┐                           │
│  │ PGP         │ │ SFTP        │                           │
│  │ Service     │ │ Client      │                           │
│  └─────────────┘ └─────────────┘                           │
├─────────────────────────────────────────────────────────────┤
│                    INFRASTRUCTURE LAYER                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ PostgreSQL  │ │ Redis       │ │ File System │           │
│  │ Database    │ │ Queue       │ │             │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

**Layer Explanation:**

1. **Presentation Layer**: Handles HTTP request/response, routing, input validation
2. **Application Layer**: Business logic orchestration, coordinates between services
3. **Service Layer**: Specific implementation per function (API client, PDF, encryption)
4. **Infrastructure Layer**: Access to external resources (database, file system, queue)

#### Design Patterns Used

| Pattern | Usage | Explanation |
|---------|-------|-------------|
| **Repository Pattern** | Database access | Database query abstraction in `utils/database.js` |
| **Factory Pattern** | PDF generation | Creates various document types (payslip, tax) |
| **Singleton** | Database connection pool | One pool used throughout the application |
| **Observer** | File watching (Mock OIC) | Chokidar monitors SFTP folder |
| **Retry with Backoff** | API calls | Automatic retry with exponential backoff |

#### Data Models

**Employee Model:**
```javascript
{
  id: UUID,
  talenta_user_id: String,      // ID from Talenta
  oracle_person_number: String,  // Generated: 30 + 13 digits
  full_name: String,
  email: String,
  national_identifier: String,   // NIK (National ID)
  department: String,
  position: String,
  branch_id: String,
  employment_status: String,     // ACTIVE, INACTIVE
  created_at: Timestamp,
  updated_at: Timestamp,
  synced_at: Timestamp
}
```

**Document Model:**
```javascript
{
  id: UUID,
  employee_id: UUID,            // FK to employees
  document_type: String,        // PAYSLIP, TAX_STATEMENT
  document_code: String,        // Unique code per document
  document_name: String,
  period_year: Integer,
  period_month: Integer,
  original_file_path: String,
  status: String,               // PENDING, PROCESSED, ENCRYPTED, UPLOADED, FAILED
  error_message: String,
  metadata: JSONB,              // Additional data
  created_at: Timestamp,
  updated_at: Timestamp
}
```

**Sync Job Model:**
```javascript
{
  id: UUID,
  job_type: String,             // EMPLOYEE_SYNC, PAYROLL_SYNC, FULL_SYNC
  business_unit: String,        // MY, ID, SG, etc.
  status: String,               // PENDING, RUNNING, COMPLETED, FAILED
  started_at: Timestamp,
  completed_at: Timestamp,
  records_total: Integer,
  records_processed: Integer,
  records_failed: Integer,
  error_message: String,
  config: JSONB,                // Job-specific configuration
  created_at: Timestamp
}
```

#### API Design

**Health Check:**
```http
GET /health

Response 200:
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-02-03T10:00:00Z"
}
```

**Trigger Full Sync:**
```http
POST /api/sync/trigger
Content-Type: application/json

Response 200:
{
  "status": "success",
  "message": "Full sync triggered",
  "jobId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Sync Employees Only:**
```http
POST /api/sync/employees

Response 200:
{
  "status": "success",
  "message": "Employee sync completed",
  "data": {
    "synced": 50,
    "created": 5,
    "updated": 45
  }
}
```

**Process Payroll:**
```http
POST /api/sync/payroll
Content-Type: application/json

Request:
{
  "year": 2026,
  "month": 1
}

Response 200:
{
  "status": "success",
  "message": "Payroll processing triggered",
  "jobId": "550e8400-e29b-41d4-a716-446655440001"
}
```

**Get Jobs:**
```http
GET /api/jobs

Response 200:
{
  "status": "success",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "job_type": "FULL_SYNC",
      "status": "COMPLETED",
      "records_processed": 50,
      "started_at": "2026-02-03T02:00:00Z",
      "completed_at": "2026-02-03T02:05:00Z"
    }
  ]
}
```

#### Error Handling

**Error Response Format:**
```javascript
{
  "status": "error",
  "error": {
    "code": "TALENTA_API_ERROR",
    "message": "Failed to fetch employees from Talenta",
    "details": "Connection timeout after 30000ms"
  },
  "timestamp": "2026-02-03T10:00:00Z"
}
```

**Error Codes:**

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Input validation failed | 400 |
| `TALENTA_API_ERROR` | Talenta API communication failed | 502 |
| `DATABASE_ERROR` | Database operation failed | 500 |
| `ENCRYPTION_ERROR` | PGP encryption failed | 500 |
| `SFTP_ERROR` | SFTP upload failed | 502 |
| `NOT_FOUND` | Resource not found | 404 |

#### Auth Flow

**Talenta API Authentication:**
```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  Middleware │         │   Vault     │         │  Talenta    │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                       │
       │  Get API credentials  │                       │
       │──────────────────────►│                       │
       │                       │                       │
       │  Return client_id &   │                       │
       │  client_secret        │                       │
       │◄──────────────────────│                       │
       │                       │                       │
       │  API Request with Bearer Token               │
       │──────────────────────────────────────────────►│
       │                       │                       │
       │  Response with employee/payroll data         │
       │◄──────────────────────────────────────────────│
       │                       │                       │
```

**Internal Services:**
- No authentication between internal Docker services
- Services communicate via Docker network
- Network isolation provides security boundary

---

## 7. Frontend Architecture

### 🇮🇩 Bahasa Indonesia

#### Status Saat Ini

**Dashboard web belum diimplementasikan.** Saat ini hanya tersedia placeholder di folder `services/dashboard/`. Rencana menggunakan React/Next.js.

#### Rencana Arsitektur UI

```
┌─────────────────────────────────────────────────────────────┐
│                     DASHBOARD (Planned)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Header / Navigation                │   │
│  │  [Logo] [Dashboard] [Jobs] [Employees] [Settings]   │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌──────────────────┐  ┌──────────────────────────────┐   │
│  │   Sidebar        │  │        Main Content          │   │
│  │  - Overview      │  │  ┌────────────────────────┐ │   │
│  │  - Sync Jobs     │  │  │   Stats Cards          │ │   │
│  │  - Employees     │  │  └────────────────────────┘ │   │
│  │  - Documents     │  │  ┌────────────────────────┐ │   │
│  │  - Logs          │  │  │   Recent Jobs Table    │ │   │
│  │  - Settings      │  │  └────────────────────────┘ │   │
│  └──────────────────┘  └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

#### Fitur yang Direncanakan

| Fitur | Deskripsi | Prioritas |
|-------|-----------|-----------|
| Dashboard Overview | Statistik dan status sync terkini | Tinggi |
| Job Management | Lihat, trigger, dan monitor sync jobs | Tinggi |
| Employee List | Daftar karyawan yang sudah di-sync | Medium |
| Document Viewer | Lihat dan download slip gaji | Medium |
| Log Viewer | Real-time log streaming | Rendah |

#### Alternatif Saat Ini

Untuk monitoring dan administrasi, gunakan:
- **Adminer** (http://localhost:8080) - Database administration
- **API Endpoints** - Via curl atau Postman
- **Docker Logs** - `docker-compose logs -f middleware`

---

### 🇺🇸 English

#### Current Status

**Web dashboard is not yet implemented.** Currently only a placeholder exists in `services/dashboard/` folder. Planning to use React/Next.js.

#### Planned UI Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     DASHBOARD (Planned)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Header / Navigation                │   │
│  │  [Logo] [Dashboard] [Jobs] [Employees] [Settings]   │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌──────────────────┐  ┌──────────────────────────────┐   │
│  │   Sidebar        │  │        Main Content          │   │
│  │  - Overview      │  │  ┌────────────────────────┐ │   │
│  │  - Sync Jobs     │  │  │   Stats Cards          │ │   │
│  │  - Employees     │  │  └────────────────────────┘ │   │
│  │  - Documents     │  │  ┌────────────────────────┐ │   │
│  │  - Logs          │  │  │   Recent Jobs Table    │ │   │
│  │  - Settings      │  │  └────────────────────────┘ │   │
│  └──────────────────┘  └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

#### Planned Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Dashboard Overview | Current sync stats and status | High |
| Job Management | View, trigger, and monitor sync jobs | High |
| Employee List | List of synced employees | Medium |
| Document Viewer | View and download payslips | Medium |
| Log Viewer | Real-time log streaming | Low |

#### Current Alternatives

For monitoring and administration, use:
- **Adminer** (http://localhost:8080) - Database administration
- **API Endpoints** - Via curl or Postman
- **Docker Logs** - `docker-compose logs -f middleware`

---
## 8. Security Design

### 🇮🇩 Bahasa Indonesia

#### Model Ancaman (Threat Model)

**Aset yang Dilindungi:**
- Data karyawan (nama, NIK, alamat, gaji)
- Kredensial API (Talenta client_id/secret)
- Kunci enkripsi PGP
- Password database

**Ancaman Potensial:**

| Ancaman | Dampak | Mitigasi |
|---------|--------|----------|
| Pencurian data saat transfer | Data karyawan bocor | Enkripsi PGP end-to-end |
| Akses tidak sah ke API | Data diambil pihak tidak berwenang | API authentication, network isolation |
| SQL Injection | Database compromised | Parameterized queries |
| Man-in-the-Middle | Data diintersep | HTTPS/TLS, SFTP (SSH) |
| Credential theft | Akses penuh ke sistem | Vault secret management |

#### Authentication (Autentikasi)

**Lapisan Autentikasi:**

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION LAYERS                     │
├─────────────────────────────────────────────────────────────┤
│  1. TALENTA API                                             │
│     ├── OAuth 2.0 Client Credentials                        │
│     ├── client_id + client_secret                           │
│     └── Bearer token dalam header                           │
│                                                              │
│  2. SFTP SERVER                                             │
│     ├── SSH key authentication                              │
│     └── Username + password (demo)                          │
│                                                              │
│  3. DATABASE                                                │
│     ├── Username + password                                  │
│     └── Connection string via Vault (production)            │
│                                                              │
│  4. INTERNAL SERVICES                                       │
│     └── Docker network isolation (no auth required)         │
└─────────────────────────────────────────────────────────────┘
```

**Penjelasan Sederhana:**
- **Talenta API**: Menggunakan OAuth 2.0, seperti login dengan username/password tetapi untuk aplikasi
- **SFTP**: Menggunakan SSH, seperti koneksi aman ke server remote
- **Database**: Username dan password, disimpan aman di Vault
- **Internal**: Container berkomunikasi dalam jaringan tertutup Docker

#### Encryption (Enkripsi)

**Data at Rest (Data Tersimpan):**

| Data | Enkripsi | Detail |
|------|----------|--------|
| Database | Tidak (recommend: TDE) | PostgreSQL standard |
| PDF Payslips | Password protected | NIK sebagai password |
| PGP Keys | File system | Disimpan di volume mount |

**Data in Transit (Data Ditransfer):**

| Koneksi | Enkripsi | Detail |
|---------|----------|--------|
| Talenta API | HTTPS/TLS 1.2+ | Otomatis |
| SFTP | SSH (SFTP) | Enkripsi channel |
| File Content | PGP | End-to-end encryption |
| Database | Plaintext (recommend: SSL) | Internal network |

**Alur Enkripsi PGP:**

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│ Original    │         │  PGP        │         │  Encrypted  │
│ CSV File    │────────►│  Encrypt    │────────►│  .pgp File  │
│ (plaintext) │         │             │         │             │
└─────────────┘         └─────────────┘         └─────────────┘
                              │
                              ▼
                     Public Key Oracle
                     (oic_public.asc)
```

#### Secrets Management

**Demo Mode:**
```
.env file → Environment Variables → Application
```

**Production Mode (Recommended):**
```
Vault → API → Application
  │
  ├── secret/hris/database
  ├── secret/hris/talenta
  └── secret/hris/pgp
```

#### Pencegahan Serangan Umum

| Serangan | Pencegahan | Implementasi |
|----------|------------|--------------|
| **SQL Injection** | Parameterized queries | `pg` library dengan $1, $2 parameters |
| **Path Traversal** | Validasi file paths | Joi validation |
| **Credential Exposure** | Vault | Secrets tidak di code |

---

### 🇺🇸 English

#### Threat Model

**Protected Assets:**
- Employee data (name, NIK, address, salary)
- API credentials (Talenta client_id/secret)
- PGP encryption keys
- Database passwords

**Potential Threats:**

| Threat | Impact | Mitigation |
|--------|--------|------------|
| Data theft during transfer | Employee data leaked | PGP end-to-end encryption |
| Unauthorized API access | Data taken by unauthorized party | API authentication, network isolation |
| SQL Injection | Database compromised | Parameterized queries |
| Man-in-the-Middle | Data intercepted | HTTPS/TLS, SFTP (SSH) |
| Credential theft | Full system access | Vault secret management |

#### Authentication

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION LAYERS                     │
├─────────────────────────────────────────────────────────────┤
│  1. TALENTA API: OAuth 2.0 Client Credentials               │
│  2. SFTP SERVER: SSH key / username+password                │
│  3. DATABASE: Username + password via Vault                  │
│  4. INTERNAL SERVICES: Docker network isolation             │
└─────────────────────────────────────────────────────────────┘
```

#### Encryption

**Data at Rest:**
- Database: Standard PostgreSQL (recommend TDE for production)
- PDF Payslips: Password protected with employee NIK
- PGP Keys: Stored in mounted volumes

**Data in Transit:**
- Talenta API: HTTPS/TLS 1.2+
- SFTP: SSH encryption
- File Content: PGP end-to-end encryption

---

## 9. Data & Storage

### 🇮🇩 Bahasa Indonesia

#### Database Schema Utama

**Tabel employees:**
```sql
CREATE TABLE employees (
    id UUID PRIMARY KEY,
    talenta_user_id VARCHAR(50) UNIQUE NOT NULL,
    oracle_person_number VARCHAR(50) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    national_identifier VARCHAR(50),  -- NIK
    department VARCHAR(255),
    position VARCHAR(255),
    employment_status VARCHAR(50) DEFAULT 'ACTIVE',
    synced_at TIMESTAMP
);
```

**Tabel documents:**
```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY,
    employee_id UUID REFERENCES employees(id),
    document_type VARCHAR(50),  -- PAYSLIP, TAX_STATEMENT
    period_year INTEGER,
    period_month INTEGER,
    status VARCHAR(50),  -- PENDING, PROCESSED, ENCRYPTED, UPLOADED
    UNIQUE(employee_id, document_type, period_year, period_month)
);
```

**Tabel sync_jobs:**
```sql
CREATE TABLE sync_jobs (
    id UUID PRIMARY KEY,
    job_type VARCHAR(50),  -- EMPLOYEE_SYNC, PAYROLL_SYNC
    status VARCHAR(50),    -- PENDING, RUNNING, COMPLETED, FAILED
    records_processed INTEGER,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);
```

#### Mengapa PostgreSQL

| Aspek | Keputusan | Alasan |
|-------|-----------|--------|
| Database | PostgreSQL | ACID compliant, JSONB support |
| UUID | gen_random_uuid() | Aman untuk distributed systems |
| JSONB | Untuk metadata | Fleksibilitas tanpa alter schema |

#### Backup & Restore

```bash
# Backup
docker exec hris-postgres-middleware \
  pg_dump -U hris hris_metadata > backup/middleware.sql

# Restore
docker exec -i hris-postgres-middleware \
  psql -U hris hris_metadata < backup/middleware.sql
```

---

### 🇺🇸 English

#### Main Database Schema

**employees table:**
```sql
CREATE TABLE employees (
    id UUID PRIMARY KEY,
    talenta_user_id VARCHAR(50) UNIQUE NOT NULL,
    oracle_person_number VARCHAR(50) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    national_identifier VARCHAR(50),  -- NIK (National ID)
    department VARCHAR(255),
    position VARCHAR(255),
    employment_status VARCHAR(50) DEFAULT 'ACTIVE',
    synced_at TIMESTAMP
);
```

**documents table:**
```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY,
    employee_id UUID REFERENCES employees(id),
    document_type VARCHAR(50),  -- PAYSLIP, TAX_STATEMENT
    period_year INTEGER,
    period_month INTEGER,
    status VARCHAR(50),  -- PENDING, PROCESSED, ENCRYPTED, UPLOADED
    UNIQUE(employee_id, document_type, period_year, period_month)
);
```

**sync_jobs table:**
```sql
CREATE TABLE sync_jobs (
    id UUID PRIMARY KEY,
    job_type VARCHAR(50),  -- EMPLOYEE_SYNC, PAYROLL_SYNC
    status VARCHAR(50),    -- PENDING, RUNNING, COMPLETED, FAILED
    records_processed INTEGER,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);
```

#### Why PostgreSQL

| Aspect | Decision | Reason |
|--------|----------|--------|
| Database | PostgreSQL | ACID compliant, JSONB support |
| UUID | gen_random_uuid() | Safe for distributed systems |
| JSONB | For metadata | Flexibility without schema changes |

#### Backup & Restore

```bash
# Backup
docker exec hris-postgres-middleware \
  pg_dump -U hris hris_metadata > backup/middleware.sql

# Restore
docker exec -i hris-postgres-middleware \
  psql -U hris hris_metadata < backup/middleware.sql
```

---

## 10. Development Guide

### 🇮🇩 Bahasa Indonesia

#### Langkah 1: Prerequisites

**Software yang Dibutuhkan:**
```bash
# Cek Docker
docker --version        # Minimal: 20.10+

# Cek Docker Compose
docker-compose --version  # Minimal: 2.0+

# Cek GPG (untuk enkripsi)
gpg --version           # Opsional untuk demo
```

#### Langkah 2: Clone & Setup

```bash
# Clone repository
git clone <repository-url>
cd hr-middleware

# Copy environment file
cp .env.demo .env

# Generate PGP keys (jika belum ada)
./start-demo.sh  # Script akan generate otomatis
```

#### Langkah 3: Jalankan Semua Services

```bash
# Mulai semua containers
docker-compose -f docker-compose.demo.yml up -d

# Tunggu semua services ready (sekitar 30-60 detik)
docker-compose -f docker-compose.demo.yml ps

# Cek health
curl http://localhost:3002/health
```

#### Langkah 4: Jalankan Demo Sync

```bash
# Trigger employee sync
curl -X POST http://localhost:3002/api/sync/employees

# Trigger payroll sync
curl -X POST http://localhost:3002/api/sync/payroll \
  -H "Content-Type: application/json" \
  -d '{"year": 2026, "month": 1}'

# Cek status jobs
curl http://localhost:3002/api/jobs
```

#### Penjelasan Struktur Folder

```
hr-middleware/
├── services/
│   ├── middleware/     # ← Kode utama middleware
│   │   ├── src/        # ← Source code
│   │   └── Dockerfile  # ← Build instructions
│   ├── mock-talenta/   # ← Mock API Talenta
│   └── mock-oic/       # ← Mock Oracle OIC
├── database/
│   ├── middleware-schema.sql  # ← Schema database middleware
│   └── mock-hcm-schema.sql    # ← Schema mock HCM
├── config/
│   └── keys/           # ← PGP keys
├── docker-compose.demo.yml    # ← Orchestration demo
└── .env.demo           # ← Environment variables
```

#### Menambah Fitur Baru

**Contoh: Menambah Endpoint Baru**

1. Buka `services/middleware/src/index.js`
2. Tambahkan route baru:
```javascript
app.get('/api/new-endpoint', async (req, res) => {
  try {
    // Logic here
    res.json({ status: 'success', data: {} });
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});
```
3. Restart middleware: `docker-compose restart middleware`

#### Menambah API Consumer Baru

1. Buat file baru di `services/middleware/src/api-consumer/`
2. Ikuti pattern dari `talenta-client.js`
3. Import dan gunakan di `index.js`

#### Kesalahan Umum

| Masalah | Penyebab | Solusi |
|---------|----------|--------|
| Container not starting | Port sudah digunakan | `docker-compose down` lalu `up` |
| Database connection error | Container belum ready | Tunggu 30 detik, cek logs |
| SFTP upload failed | Keys tidak ada | Jalankan `./start-demo.sh` |
| API timeout | Mock Talenta tidak jalan | `docker-compose restart mock-talenta` |

---

### 🇺🇸 English

#### Step 1: Prerequisites

**Required Software:**
```bash
# Check Docker
docker --version        # Minimum: 20.10+

# Check Docker Compose
docker-compose --version  # Minimum: 2.0+

# Check GPG (for encryption)
gpg --version           # Optional for demo
```

#### Step 2: Clone & Setup

```bash
# Clone repository
git clone <repository-url>
cd hr-middleware

# Copy environment file
cp .env.demo .env

# Generate PGP keys (if not exists)
./start-demo.sh  # Script will auto-generate
```

#### Step 3: Run All Services

```bash
# Start all containers
docker-compose -f docker-compose.demo.yml up -d

# Wait for all services to be ready (about 30-60 seconds)
docker-compose -f docker-compose.demo.yml ps

# Check health
curl http://localhost:3002/health
```

#### Step 4: Run Demo Sync

```bash
# Trigger employee sync
curl -X POST http://localhost:3002/api/sync/employees

# Trigger payroll sync
curl -X POST http://localhost:3002/api/sync/payroll \
  -H "Content-Type: application/json" \
  -d '{"year": 2026, "month": 1}'

# Check job status
curl http://localhost:3002/api/jobs
```

#### Folder Structure Explanation

```
hr-middleware/
├── services/
│   ├── middleware/     # ← Main middleware code
│   │   ├── src/        # ← Source code
│   │   └── Dockerfile  # ← Build instructions
│   ├── mock-talenta/   # ← Mock Talenta API
│   └── mock-oic/       # ← Mock Oracle OIC
├── database/
│   ├── middleware-schema.sql  # ← Middleware DB schema
│   └── mock-hcm-schema.sql    # ← Mock HCM schema
├── config/
│   └── keys/           # ← PGP keys
├── docker-compose.demo.yml    # ← Demo orchestration
└── .env.demo           # ← Environment variables
```

#### Adding New Features

**Example: Adding New Endpoint**

1. Open `services/middleware/src/index.js`
2. Add new route:
```javascript
app.get('/api/new-endpoint', async (req, res) => {
  try {
    // Logic here
    res.json({ status: 'success', data: {} });
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});
```
3. Restart middleware: `docker-compose restart middleware`

#### Common Mistakes

| Problem | Cause | Solution |
|---------|-------|----------|
| Container not starting | Port already in use | `docker-compose down` then `up` |
| Database connection error | Container not ready | Wait 30 seconds, check logs |
| SFTP upload failed | Keys missing | Run `./start-demo.sh` |
| API timeout | Mock Talenta not running | `docker-compose restart mock-talenta` |

---

## 11. Modification & Extension Guide

### 🇮🇩 Bahasa Indonesia

#### Area Aman untuk Modifikasi

| Area | File | Risiko |
|------|------|--------|
| Menambah endpoint baru | `index.js` | Rendah |
| Mengubah format PDF | `payslip-generator.js` | Rendah |
| Menambah field mapping | `hdl-generator.js` | Medium |
| Mengubah business logic | `index.js` | Medium |
| Mengubah schema database | `*.sql` files | Tinggi |
| Mengubah enkripsi | `pgp-service.js` | Tinggi |

#### Area Berisiko

**HATI-HATI saat mengubah:**

1. **Database Schema** - Membutuhkan migrasi data existing
2. **PGP Encryption** - Bisa menyebabkan file tidak bisa dibuka Oracle
3. **HDL Format** - Oracle memiliki format yang sangat spesifik
4. **API Authentication** - Bisa menyebabkan gagal koneksi ke Talenta

#### Menambah Integrasi Baru

```javascript
// services/middleware/src/api-consumer/new-client.js
const axios = require('axios');
const logger = require('../utils/logger');

class NewApiClient {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
  }

  async fetchData() {
    try {
      const response = await axios.get(`${this.baseUrl}/data`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data;
    } catch (error) {
      logger.error('New API error:', error);
      throw error;
    }
  }
}

module.exports = NewApiClient;
```

#### Strategi Scaling

**Horizontal Scaling:**
```bash
# Scale middleware to 3 instances
docker-compose up -d --scale middleware=3
```

**Database Scaling:**
- Tambahkan read replicas untuk query-heavy workloads
- Gunakan connection pooling (PgBouncer)

**Mengganti Tech Stack:**

| Komponen | Pengganti | Pertimbangan |
|----------|-----------|--------------|
| PostgreSQL | MySQL | Perlu ubah queries |
| Redis | RabbitMQ | Perlu ubah job queue code |
| Express | Fastify | Perlu ubah middleware |
| PDFKit | Puppeteer | Lebih berat tapi lebih fleksibel |

---

### 🇺🇸 English

#### Safe Modification Areas

| Area | File | Risk |
|------|------|------|
| Add new endpoint | `index.js` | Low |
| Change PDF format | `payslip-generator.js` | Low |
| Add field mapping | `hdl-generator.js` | Medium |
| Change business logic | `index.js` | Medium |
| Change database schema | `*.sql` files | High |
| Change encryption | `pgp-service.js` | High |

#### Risky Areas

**BE CAREFUL when modifying:**

1. **Database Schema** - Requires existing data migration
2. **PGP Encryption** - May cause files unreadable by Oracle
3. **HDL Format** - Oracle has very specific format requirements
4. **API Authentication** - May break Talenta connection

#### Adding New Integration

```javascript
// services/middleware/src/api-consumer/new-client.js
const axios = require('axios');
const logger = require('../utils/logger');

class NewApiClient {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
  }

  async fetchData() {
    try {
      const response = await axios.get(`${this.baseUrl}/data`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data;
    } catch (error) {
      logger.error('New API error:', error);
      throw error;
    }
  }
}

module.exports = NewApiClient;
```

#### Scaling Strategy

**Horizontal Scaling:**
```bash
# Scale middleware to 3 instances
docker-compose up -d --scale middleware=3
```

**Replacing Tech Stack:**

| Component | Replacement | Consideration |
|-----------|-------------|---------------|
| PostgreSQL | MySQL | Need to change queries |
| Redis | RabbitMQ | Need to change job queue code |
| Express | Fastify | Need to change middleware |
| PDFKit | Puppeteer | Heavier but more flexible |

---

## 12. Operations Guide

### 🇮🇩 Bahasa Indonesia

#### Monitoring

**Health Check:**
```bash
# Check middleware health
curl http://localhost:3002/health

# Check all containers
docker-compose ps

# Resource usage
docker stats
```

**Database Monitoring:**
```bash
# Via Adminer
open http://localhost:8080

# Login:
# - System: PostgreSQL
# - Server: postgres-middleware
# - Username: hris
# - Password: hrispass
# - Database: hris_metadata
```

#### Logging

**View Logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f middleware

# Last 100 lines
docker-compose logs --tail=100 middleware
```

**Log Format:**
```
2026-02-03T10:00:00.000Z [INFO] Sync completed: 50 employees processed
2026-02-03T10:00:01.000Z [ERROR] SFTP upload failed: Connection refused
```

#### Debugging

**Common Debug Commands:**
```bash
# Enter container shell
docker exec -it hris-middleware /bin/sh

# Check environment variables
docker exec hris-middleware env

# Test database connection
docker exec hris-postgres-middleware psql -U hris -d hris_metadata -c "SELECT 1"

# Check SFTP files
docker exec hris-sftp ls -la /data/inbound
```

#### Performance Tuning

**Database:**
```sql
-- Check slow queries
SELECT pid, query, state, query_start
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;

-- Vacuum and analyze
VACUUM ANALYZE employees;
```

**Node.js:**
```bash
# Increase memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

#### Cost Control

| Resource | Demo | Production Recommendation |
|----------|------|---------------------------|
| Middleware | 256MB RAM | 512MB-1GB RAM |
| PostgreSQL | 256MB RAM | 1GB+ RAM |
| Redis | 128MB RAM | 256MB RAM |
| Total | ~1GB | ~3GB minimum |

---

### 🇺🇸 English

#### Monitoring

**Health Check:**
```bash
# Check middleware health
curl http://localhost:3002/health

# Check all containers
docker-compose ps

# Resource usage
docker stats
```

**Database Monitoring:**
```bash
# Via Adminer
open http://localhost:8080

# Login:
# - System: PostgreSQL
# - Server: postgres-middleware
# - Username: hris
# - Password: hrispass
# - Database: hris_metadata
```

#### Logging

**View Logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f middleware

# Last 100 lines
docker-compose logs --tail=100 middleware
```

#### Debugging

**Common Debug Commands:**
```bash
# Enter container shell
docker exec -it hris-middleware /bin/sh

# Check environment variables
docker exec hris-middleware env

# Test database connection
docker exec hris-postgres-middleware psql -U hris -d hris_metadata -c "SELECT 1"

# Check SFTP files
docker exec hris-sftp ls -la /data/inbound
```

#### Performance Tuning

**Database:**
```sql
-- Check slow queries
SELECT pid, query, state, query_start
FROM pg_stat_activity
WHERE state != 'idle';

-- Vacuum and analyze
VACUUM ANALYZE employees;
```

#### Cost Control

| Resource | Demo | Production Recommendation |
|----------|------|---------------------------|
| Middleware | 256MB RAM | 512MB-1GB RAM |
| PostgreSQL | 256MB RAM | 1GB+ RAM |
| Redis | 128MB RAM | 256MB RAM |
| Total | ~1GB | ~3GB minimum |

---

## 13. Glossary

### 🇮🇩 Bahasa Indonesia

#### Istilah Teknis

| Istilah | Definisi |
|---------|----------|
| **API** | Application Programming Interface - cara aplikasi berkomunikasi |
| **Docker** | Platform untuk menjalankan aplikasi dalam container terisolasi |
| **Container** | Paket software yang berisi aplikasi dan semua dependensinya |
| **SFTP** | Secure File Transfer Protocol - transfer file terenkripsi |
| **PGP** | Pretty Good Privacy - standar enkripsi untuk email dan file |
| **OAuth 2.0** | Standar autentikasi untuk API |
| **REST API** | Arsitektur API yang menggunakan HTTP methods |
| **UUID** | Universally Unique Identifier - ID unik global |
| **JSONB** | Format JSON binary di PostgreSQL |

#### Istilah Bisnis

| Istilah | Definisi |
|---------|----------|
| **HRIS** | Human Resource Information System |
| **HCM** | Human Capital Management |
| **Talenta** | Produk HRIS dari Mekari (Indonesia) |
| **Oracle Fusion** | Enterprise suite dari Oracle termasuk HCM |
| **OIC** | Oracle Integration Cloud |
| **HDL** | HCM Data Loader - format import data Oracle |
| **Payslip** | Slip gaji bulanan karyawan |
| **NIK** | Nomor Induk Kependudukan (National ID Indonesia) |

#### Akronim

| Akronim | Kepanjangan |
|---------|-------------|
| ETL | Extract, Transform, Load |
| TLS | Transport Layer Security |
| SSH | Secure Shell |
| SQL | Structured Query Language |
| CSV | Comma Separated Values |
| PDF | Portable Document Format |
| CI/CD | Continuous Integration/Continuous Deployment |

---

### 🇺🇸 English

#### Technical Terms

| Term | Definition |
|------|------------|
| **API** | Application Programming Interface - how applications communicate |
| **Docker** | Platform for running applications in isolated containers |
| **Container** | Software package containing application and all dependencies |
| **SFTP** | Secure File Transfer Protocol - encrypted file transfer |
| **PGP** | Pretty Good Privacy - encryption standard for email and files |
| **OAuth 2.0** | Authentication standard for APIs |
| **REST API** | API architecture using HTTP methods |
| **UUID** | Universally Unique Identifier - globally unique ID |
| **JSONB** | Binary JSON format in PostgreSQL |

#### Business Terms

| Term | Definition |
|------|------------|
| **HRIS** | Human Resource Information System |
| **HCM** | Human Capital Management |
| **Talenta** | HRIS product from Mekari (Indonesia) |
| **Oracle Fusion** | Enterprise suite from Oracle including HCM |
| **OIC** | Oracle Integration Cloud |
| **HDL** | HCM Data Loader - Oracle data import format |
| **Payslip** | Monthly employee salary slip |
| **NIK** | Indonesian National ID Number |

#### Acronyms

| Acronym | Full Form |
|---------|-----------|
| ETL | Extract, Transform, Load |
| TLS | Transport Layer Security |
| SSH | Secure Shell |
| SQL | Structured Query Language |
| CSV | Comma Separated Values |
| PDF | Portable Document Format |
| CI/CD | Continuous Integration/Continuous Deployment |

---

## 14. Final Notes

### 🇮🇩 Bahasa Indonesia

#### Keterbatasan Saat Ini

1. **Sinkronisasi Satu Arah**: Hanya Talenta → Oracle, tidak sebaliknya
2. **Tidak Real-time**: Berbasis jadwal, bukan event-driven
3. **Dashboard Belum Ada**: Monitoring hanya via API dan logs
4. **Rate Limiting Belum Ada**: Perlu ditambahkan untuk production
5. **Test Coverage**: Unit test belum lengkap

#### Technical Debt

| Item | Prioritas | Deskripsi |
|------|-----------|-----------|
| Unit Tests | Tinggi | Tambahkan Jest tests untuk semua modules |
| API Documentation | Medium | Generate OpenAPI/Swagger docs |
| Dashboard | Medium | Implementasi React dashboard |
| Rate Limiting | Medium | Tambahkan express-rate-limit |
| Retry Queue | Rendah | Implementasi dead-letter queue |

#### Roadmap Masa Depan

**Phase 1 (Short-term):**
- [ ] Tambah comprehensive unit tests
- [ ] Implementasi rate limiting
- [ ] Improve error handling

**Phase 2 (Medium-term):**
- [ ] Build monitoring dashboard
- [ ] Add bidirectional sync capability
- [ ] Implement webhook support

**Phase 3 (Long-term):**
- [ ] Multi-tenant support
- [ ] Real-time sync dengan event streaming
- [ ] Mobile app for employees

#### Trade-offs yang Dibuat

| Keputusan | Alasan | Dampak |
|-----------|--------|--------|
| Node.js vs Java | Tim familiar, faster development | Mungkin kurang performant untuk data besar |
| PostgreSQL vs Oracle | Open source, lebih murah | Perlu mapping ke Oracle format |
| Monorepo | Kemudahan development | Deployment coupling |
| Mock Services | Testing tanpa dependency | Perlu maintenance terpisah |

---

### 🇺🇸 English

#### Current Limitations

1. **One-way Sync**: Only Talenta → Oracle, not reverse
2. **Not Real-time**: Schedule-based, not event-driven
3. **No Dashboard**: Monitoring only via API and logs
4. **No Rate Limiting**: Needs to be added for production
5. **Test Coverage**: Unit tests not complete

#### Technical Debt

| Item | Priority | Description |
|------|----------|-------------|
| Unit Tests | High | Add Jest tests for all modules |
| API Documentation | Medium | Generate OpenAPI/Swagger docs |
| Dashboard | Medium | Implement React dashboard |
| Rate Limiting | Medium | Add express-rate-limit |
| Retry Queue | Low | Implement dead-letter queue |

#### Future Roadmap

**Phase 1 (Short-term):**
- [ ] Add comprehensive unit tests
- [ ] Implement rate limiting
- [ ] Improve error handling

**Phase 2 (Medium-term):**
- [ ] Build monitoring dashboard
- [ ] Add bidirectional sync capability
- [ ] Implement webhook support

**Phase 3 (Long-term):**
- [ ] Multi-tenant support
- [ ] Real-time sync with event streaming
- [ ] Mobile app for employees

#### Trade-offs Made

| Decision | Reason | Impact |
|----------|--------|--------|
| Node.js vs Java | Team familiarity, faster development | May be less performant for large data |
| PostgreSQL vs Oracle | Open source, cheaper | Need mapping to Oracle format |
| Monorepo | Ease of development | Deployment coupling |
| Mock Services | Testing without dependencies | Separate maintenance needed |

---

## Quick Reference Card

### Service URLs (Demo Environment)

| Service | URL |
|---------|-----|
| Middleware API | http://localhost:3002 |
| Mock Talenta API | http://localhost:3001 |
| Adminer (DB UI) | http://localhost:8080 |
| Vault UI | http://localhost:8200 |

### Database Credentials

| Database | Host | Port | User | Password |
|----------|------|------|------|----------|
| Middleware | postgres-middleware | 5432 | hris | hrispass |
| Mock HCM | postgres-hcm | 5433 | hcm | hcmpass |

### Quick Commands

```bash
# Start
docker-compose -f docker-compose.demo.yml up -d

# Stop
docker-compose -f docker-compose.demo.yml down

# Logs
docker-compose logs -f middleware

# Sync
curl -X POST http://localhost:3002/api/sync/trigger

# Health
curl http://localhost:3002/health
```

---

**Document Version:** 1.0
**Last Updated:** 2026-02-03
**Maintainer:** HRIS Integration Team
