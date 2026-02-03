-- ============================================
-- MOCK ORACLE HCM CLOUD DATABASE
-- Simplified version for demo/development
-- Simulates Oracle Fusion HCM Cloud tables
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- PERSONS TABLE
-- Simulates PER_ALL_PEOPLE_F (Oracle HCM)
-- ============================================
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

CREATE INDEX idx_persons_number ON persons(person_number);
CREATE INDEX idx_persons_email ON persons(email);
CREATE INDEX idx_persons_status ON persons(employment_status);
CREATE INDEX idx_persons_department ON persons(department);

-- ============================================
-- DOCUMENTS OF RECORD TABLE
-- Simulates HR_DOCUMENTS_OF_RECORD
-- ============================================
CREATE TABLE documents_of_record (
    document_id BIGSERIAL PRIMARY KEY,
    person_id BIGINT REFERENCES persons(person_id) ON DELETE CASCADE,
    person_number VARCHAR(30) NOT NULL,
    document_type VARCHAR(80) NOT NULL,
    document_code VARCHAR(150) NOT NULL,
    document_name VARCHAR(80) NOT NULL,
    source_system_owner VARCHAR(256),
    source_system_id VARCHAR(2000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(person_number, document_type, document_code)
);

CREATE INDEX idx_documents_person ON documents_of_record(person_number);
CREATE INDEX idx_documents_type ON documents_of_record(document_type);
CREATE INDEX idx_documents_code ON documents_of_record(document_code);

-- ============================================
-- DOCUMENT ATTACHMENTS TABLE
-- Simulates HR_DOCUMENT_ATTACHMENTS
-- ============================================
CREATE TABLE document_attachments (
    attachment_id BIGSERIAL PRIMARY KEY,
    document_id BIGINT REFERENCES documents_of_record(document_id) ON DELETE CASCADE,
    person_number VARCHAR(30) NOT NULL,
    document_type VARCHAR(80) NOT NULL,
    document_code VARCHAR(150) NOT NULL,
    data_type_code VARCHAR(30) DEFAULT 'FILE',
    title VARCHAR(80),
    file_name VARCHAR(255),
    file_content BYTEA, -- Binary content of PDF
    file_size BIGINT,
    mime_type VARCHAR(100) DEFAULT 'application/pdf',
    source_system_owner VARCHAR(256),
    source_system_id VARCHAR(2000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attachments_document ON document_attachments(document_id);
CREATE INDEX idx_attachments_person ON document_attachments(person_number);
CREATE INDEX idx_attachments_filename ON document_attachments(file_name);

-- ============================================
-- EXTERNAL IDENTIFIERS TABLE
-- Simulates PER_EXTERNAL_IDENTIFIERS
-- For storing Talenta payroll IDs
-- ============================================
CREATE TABLE external_identifiers (
    identifier_id BIGSERIAL PRIMARY KEY,
    person_id BIGINT REFERENCES persons(person_id) ON DELETE CASCADE,
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

CREATE INDEX idx_external_ids_person ON external_identifiers(person_number);
CREATE INDEX idx_external_ids_type ON external_identifiers(external_identifier_type);
CREATE INDEX idx_external_ids_number ON external_identifiers(external_identifier_number);

-- ============================================
-- PERSON ACCRUAL DETAILS TABLE
-- Simulates overtime/leave accruals
-- ============================================
CREATE TABLE person_accrual_details (
    accrual_id BIGSERIAL PRIMARY KEY,
    person_id BIGINT REFERENCES persons(person_id) ON DELETE CASCADE,
    person_number VARCHAR(30) NOT NULL,
    accrual_plan VARCHAR(100),
    accrual_type VARCHAR(50),
    accrual_date DATE,
    hours DECIMAL(10,2),
    source_system_owner VARCHAR(256),
    source_system_id VARCHAR(2000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_accruals_person ON person_accrual_details(person_number);
CREATE INDEX idx_accruals_date ON person_accrual_details(accrual_date);
CREATE INDEX idx_accruals_type ON person_accrual_details(accrual_type);

-- ============================================
-- HDL IMPORT LOG TABLE
-- Track processed HDL files
-- ============================================
CREATE TABLE hdl_import_log (
    import_id BIGSERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50), -- 'CSV', 'DAT', 'ZIP'
    hdl_object VARCHAR(100), -- 'DocumentsOfRecord', 'Worker', 'PersonAccrualDetail'
    records_total INTEGER DEFAULT 0,
    records_success INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, PROCESSING, COMPLETED, FAILED
    error_message TEXT,
    processing_details JSONB,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_import_log_status ON hdl_import_log(status);
CREATE INDEX idx_import_log_created ON hdl_import_log(created_at DESC);
CREATE INDEX idx_import_log_filename ON hdl_import_log(file_name);

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

CREATE TRIGGER update_persons_updated_at BEFORE UPDATE ON persons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS: Useful data views
-- ============================================

-- View: Employee document summary
CREATE VIEW v_employee_documents AS
SELECT
    p.person_id,
    p.person_number,
    p.full_name,
    p.department,
    COUNT(DISTINCT d.document_id) as total_documents,
    COUNT(DISTINCT CASE WHEN d.document_type = 'Third Party Payslip' THEN d.document_id END) as payslips,
    COUNT(DISTINCT CASE WHEN d.document_type = 'Tax Statement' THEN d.document_id END) as tax_statements,
    MAX(d.created_at) as last_document_date
FROM persons p
LEFT JOIN documents_of_record d ON p.person_number = d.person_number
GROUP BY p.person_id, p.person_number, p.full_name, p.department;

-- View: Import statistics
CREATE VIEW v_import_statistics AS
SELECT
    hdl_object,
    status,
    COUNT(*) as total_imports,
    SUM(records_total) as total_records,
    SUM(records_success) as successful_records,
    SUM(records_failed) as failed_records,
    AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds,
    MAX(completed_at) as last_import
FROM hdl_import_log
WHERE completed_at IS NOT NULL
GROUP BY hdl_object, status;

-- View: Recent imports
CREATE VIEW v_recent_imports AS
SELECT
    import_id,
    file_name,
    hdl_object,
    status,
    records_total,
    records_success,
    records_failed,
    EXTRACT(EPOCH FROM (completed_at - started_at)) as duration_seconds,
    created_at
FROM hdl_import_log
ORDER BY created_at DESC
LIMIT 50;

-- View: Person with external identifiers
CREATE VIEW v_person_external_ids AS
SELECT
    p.person_id,
    p.person_number,
    p.full_name,
    e.external_identifier_type,
    e.external_identifier_number,
    e.date_from,
    e.date_to
FROM persons p
LEFT JOIN external_identifiers e ON p.person_number = e.person_number
WHERE e.date_to IS NULL OR e.date_to >= CURRENT_DATE;

-- ============================================
-- FUNCTIONS: Helper functions
-- ============================================

-- Function: Get employee documents
CREATE OR REPLACE FUNCTION get_employee_documents(emp_person_number VARCHAR)
RETURNS TABLE (
    document_type VARCHAR,
    document_name VARCHAR,
    document_code VARCHAR,
    file_name VARCHAR,
    file_size BIGINT,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.document_type,
        d.document_name,
        d.document_code,
        a.file_name,
        a.file_size,
        d.created_at
    FROM documents_of_record d
    LEFT JOIN document_attachments a ON d.document_id = a.document_id
    WHERE d.person_number = emp_person_number
    ORDER BY d.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Get document attachment content
CREATE OR REPLACE FUNCTION get_document_content(doc_code VARCHAR, emp_person_number VARCHAR)
RETURNS BYTEA AS $$
DECLARE
    content BYTEA;
BEGIN
    SELECT file_content INTO content
    FROM document_attachments
    WHERE document_code = doc_code AND person_number = emp_person_number
    LIMIT 1;

    RETURN content;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEED DATA: Sample employees for demo
-- ============================================

-- Insert sample persons (will be populated by mock data generator)
-- This is just a placeholder to show the structure

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE persons IS 'Mock Oracle HCM persons table (simulates PER_ALL_PEOPLE_F)';
COMMENT ON TABLE documents_of_record IS 'Mock Oracle HCM documents table (simulates HR_DOCUMENTS_OF_RECORD)';
COMMENT ON TABLE document_attachments IS 'Mock Oracle HCM document attachments (simulates HR_DOCUMENT_ATTACHMENTS)';
COMMENT ON TABLE external_identifiers IS 'Mock Oracle HCM external identifiers (simulates PER_EXTERNAL_IDENTIFIERS)';
COMMENT ON TABLE person_accrual_details IS 'Mock Oracle HCM accrual details for overtime/leave';
COMMENT ON TABLE hdl_import_log IS 'Tracking table for HDL file imports';

-- ============================================
-- END OF SCHEMA
-- ============================================
