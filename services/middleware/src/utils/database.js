const { Pool } = require('pg');
const config = require('../config');
const logger = require('./logger');

const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.database,
  user: config.database.user,
  password: config.database.password,
  max: config.database.max,
  idleTimeoutMillis: config.database.idleTimeoutMillis
});

// Error handling
pool.on('error', (err) => {
  logger.error('Unexpected database error', { error: err.message });
});

// Database helper functions
const db = {
  /**
   * Query the database
   */
  async query(text, params) {
    const start = Date.now();
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug('Executed query', { duration, rows: result.rowCount });
      return result;
    } catch (error) {
      logger.error('Database query error', { error: error.message, query: text });
      throw error;
    }
  },

  /**
   * Get a client from the pool for transactions
   */
  async getClient() {
    return await pool.connect();
  },

  /**
   * Test database connection
   */
  async testConnection() {
    try {
      const result = await pool.query('SELECT NOW()');
      logger.info('Database connection successful', { timestamp: result.rows[0].now });
      return true;
    } catch (error) {
      logger.error('Database connection failed', { error: error.message });
      return false;
    }
  },

  /**
   * Close all connections
   */
  async end() {
    await pool.end();
    logger.info('Database pool closed');
  }
};

// Employee queries
db.employees = {
  async findByTalentaId(talentaUserId) {
    const result = await db.query(
      'SELECT * FROM employees WHERE talenta_user_id = $1',
      [talentaUserId]
    );
    return result.rows[0];
  },

  async upsert(employeeData) {
    const {
      talenta_user_id,
      oracle_person_number,
      full_name,
      email,
      national_identifier,
      department,
      position,
      branch_id,
      employment_status
    } = employeeData;

    const result = await db.query(
      `INSERT INTO employees (
        talenta_user_id, oracle_person_number, full_name, email,
        national_identifier, department, position, branch_id, employment_status, synced_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT (talenta_user_id)
      DO UPDATE SET
        oracle_person_number = $2,
        full_name = $3,
        email = $4,
        national_identifier = $5,
        department = $6,
        position = $7,
        branch_id = $8,
        employment_status = $9,
        synced_at = NOW(),
        updated_at = NOW()
      RETURNING *`,
      [
        talenta_user_id,
        oracle_person_number,
        full_name,
        email,
        national_identifier,
        department,
        position,
        branch_id,
        employment_status
      ]
    );
    return result.rows[0];
  }
};

// Document queries
db.documents = {
  async create(documentData) {
    const {
      employee_id,
      document_type,
      document_code,
      document_name,
      period_year,
      period_month,
      original_file_path,
      status = 'PENDING'
    } = documentData;

    const result = await db.query(
      `INSERT INTO documents (
        employee_id, document_type, document_code, document_name,
        period_year, period_month, original_file_path, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        employee_id,
        document_type,
        document_code,
        document_name,
        period_year,
        period_month,
        original_file_path,
        status
      ]
    );
    return result.rows[0];
  },

  async updateStatus(documentId, status, errorMessage = null) {
    const result = await db.query(
      `UPDATE documents
       SET status = $2, error_message = $3, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [documentId, status, errorMessage]
    );
    return result.rows[0];
  },

  async findPending() {
    const result = await db.query(
      `SELECT d.*, e.talenta_user_id, e.full_name, e.national_identifier
       FROM documents d
       JOIN employees e ON d.employee_id = e.id
       WHERE d.status = 'PENDING'
       ORDER BY d.created_at ASC`
    );
    return result.rows;
  }
};

// Encrypted files queries
db.encryptedFiles = {
  async create(fileData) {
    const {
      document_id,
      original_filename,
      encrypted_filename,
      encryption_type,
      file_path,
      file_size,
      checksum_sha256
    } = fileData;

    const result = await db.query(
      `INSERT INTO encrypted_files (
        document_id, original_filename, encrypted_filename,
        encryption_type, file_path, file_size, checksum_sha256
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        document_id,
        original_filename,
        encrypted_filename,
        encryption_type,
        file_path,
        file_size,
        checksum_sha256
      ]
    );
    return result.rows[0];
  },

  async markUploaded(encryptedFileId, archivePath) {
    const result = await db.query(
      `UPDATE encrypted_files
       SET sftp_uploaded = true, upload_timestamp = NOW(), archive_path = $2
       WHERE id = $1
       RETURNING *`,
      [encryptedFileId, archivePath]
    );
    return result.rows[0];
  },

  async findPendingUpload() {
    const result = await db.query(
      `SELECT * FROM encrypted_files
       WHERE sftp_uploaded = false
       ORDER BY created_at ASC`
    );
    return result.rows;
  }
};

// Sync jobs queries
db.syncJobs = {
  async create(jobType, businessUnit = null) {
    const result = await db.query(
      `INSERT INTO sync_jobs (job_type, business_unit, status, started_at)
       VALUES ($1, $2, 'RUNNING', NOW())
       RETURNING *`,
      [jobType, businessUnit]
    );
    return result.rows[0];
  },

  async complete(jobId, recordsProcessed, recordsFailed = 0, errorMessage = null) {
    const status = recordsFailed > 0 && recordsProcessed === 0 ? 'FAILED' : 'COMPLETED';
    const result = await db.query(
      `UPDATE sync_jobs
       SET status = $2, records_processed = $3, records_failed = $4,
           error_message = $5, completed_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [jobId, status, recordsProcessed, recordsFailed, errorMessage]
    );
    return result.rows[0];
  }
};

// API logs
db.apiLogs = {
  async create(logData) {
    const {
      sync_job_id,
      direction,
      endpoint,
      method,
      request_payload,
      response_status,
      response_body,
      duration_ms
    } = logData;

    await db.query(
      `INSERT INTO api_logs (
        sync_job_id, direction, endpoint, method,
        request_payload, response_status, response_body, duration_ms
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        sync_job_id,
        direction,
        endpoint,
        method,
        request_payload,
        response_status,
        response_body,
        duration_ms
      ]
    );
  }
};

module.exports = db;
