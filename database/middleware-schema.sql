-- ============================================
-- HRIS MIDDLEWARE METADATA DATABASE
-- PostgreSQL Schema for tracking sync operations
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- EMPLOYEES TABLE
-- Mapping between Talenta and Oracle HCM
-- ============================================
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    talenta_user_id INTEGER NOT NULL UNIQUE,
    oracle_person_number VARCHAR(30),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    national_identifier VARCHAR(50), -- For PDF password (NIK/KTP)
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
CREATE INDEX idx_employees_synced ON employees(synced_at);

-- ============================================
-- DOCUMENTS TABLE
-- Track generated documents (payslip, tax, etc)
-- ============================================
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- 'PAYSLIP', 'TAX_STATEMENT', 'PAYROLL_ID', 'OVERTIME'
    document_code VARCHAR(150) NOT NULL,
    document_name VARCHAR(80) NOT NULL,
    period_year INTEGER,
    period_month INTEGER,
    original_file_path VARCHAR(500),
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, PROCESSED, ENCRYPTED, UPLOADED, FAILED
    error_message TEXT,
    metadata JSONB, -- Additional flexible data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, document_type, period_year, period_month)
);

CREATE INDEX idx_documents_employee ON documents(employee_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_period ON documents(period_year, period_month);
CREATE INDEX idx_documents_type ON documents(document_type);

-- ============================================
-- ENCRYPTED FILES TABLE
-- Track encrypted files ready for upload
-- ============================================
CREATE TABLE encrypted_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
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
CREATE INDEX idx_encrypted_files_checksum ON encrypted_files(checksum_sha256);

-- ============================================
-- SYNC JOBS TABLE
-- Track synchronization job execution
-- ============================================
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
    config JSONB, -- Job configuration
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sync_jobs_status ON sync_jobs(status);
CREATE INDEX idx_sync_jobs_type ON sync_jobs(job_type);
CREATE INDEX idx_sync_jobs_created ON sync_jobs(created_at DESC);

-- ============================================
-- API LOGS TABLE
-- Audit trail for all API calls
-- ============================================
CREATE TABLE api_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(100),
    sync_job_id UUID REFERENCES sync_jobs(id) ON DELETE SET NULL,
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
CREATE INDEX idx_api_logs_created ON api_logs(created_at DESC);
CREATE INDEX idx_api_logs_endpoint ON api_logs(endpoint);

-- ============================================
-- ENCRYPTION KEYS METADATA TABLE
-- Track encryption keys (actual keys stored in Vault)
-- ============================================
CREATE TABLE encryption_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_name VARCHAR(100) NOT NULL,
    key_type VARCHAR(20) NOT NULL, -- 'PUBLIC', 'PRIVATE'
    key_purpose VARCHAR(50) NOT NULL, -- 'HCM_EXTRACT', 'OIC_DECRYPT', 'VENDOR_ENCRYPT'
    public_key_id VARCHAR(100), -- PGP Key ID
    environment VARCHAR(20) NOT NULL, -- 'SIT', 'UAT', 'PROD', 'DEMO'
    valid_from DATE NOT NULL,
    valid_until DATE,
    vault_secret_path VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_encryption_keys_active ON encryption_keys(is_active, environment);
CREATE INDEX idx_encryption_keys_purpose ON encryption_keys(key_purpose);

-- ============================================
-- TRIGGER: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS: Useful data views
-- ============================================

-- View: Document processing status summary
CREATE VIEW v_document_status_summary AS
SELECT
    document_type,
    status,
    COUNT(*) as count,
    DATE(created_at) as created_date
FROM documents
GROUP BY document_type, status, DATE(created_at)
ORDER BY created_date DESC, document_type, status;

-- View: Sync job performance
CREATE VIEW v_sync_job_performance AS
SELECT
    job_type,
    status,
    COUNT(*) as total_jobs,
    AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds,
    SUM(records_processed) as total_records_processed,
    SUM(records_failed) as total_records_failed
FROM sync_jobs
WHERE completed_at IS NOT NULL
GROUP BY job_type, status;

-- View: Employee sync status
CREATE VIEW v_employee_sync_status AS
SELECT
    e.id,
    e.talenta_user_id,
    e.oracle_person_number,
    e.full_name,
    e.department,
    e.synced_at,
    CASE
        WHEN e.synced_at IS NULL THEN 'NEVER_SYNCED'
        WHEN e.synced_at < CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 'STALE'
        ELSE 'SYNCED'
    END as sync_status,
    COUNT(d.id) as total_documents
FROM employees e
LEFT JOIN documents d ON e.id = d.employee_id
GROUP BY e.id;

-- ============================================
-- SEED DATA: Initial encryption keys metadata
-- ============================================
INSERT INTO encryption_keys (key_name, key_type, key_purpose, environment, valid_from, vault_secret_path, is_active) VALUES
('demo-oic-public', 'PUBLIC', 'OIC_DECRYPT', 'DEMO', CURRENT_DATE, 'secret/hris/pgp/oic-public', true),
('demo-oic-private', 'PRIVATE', 'OIC_DECRYPT', 'DEMO', CURRENT_DATE, 'secret/hris/pgp/oic-private', true),
('demo-hcm-public', 'PUBLIC', 'HCM_EXTRACT', 'DEMO', CURRENT_DATE, 'secret/hris/pgp/hcm-public', true);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE employees IS 'Mapping between Talenta HR and Oracle HCM employee records';
COMMENT ON TABLE documents IS 'Generated documents (payslips, tax statements) pending upload';
COMMENT ON TABLE encrypted_files IS 'Encrypted files ready for SFTP upload';
COMMENT ON TABLE sync_jobs IS 'Synchronization job execution tracking';
COMMENT ON TABLE api_logs IS 'Audit trail for all API calls to/from Talenta';
COMMENT ON TABLE encryption_keys IS 'Metadata for encryption keys (actual keys in Vault)';

-- ============================================
-- END OF SCHEMA
-- ============================================
