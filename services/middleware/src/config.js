require('dotenv').config();

const config = {
  // Environment
  env: process.env.ENVIRONMENT || 'demo',
  nodeEnv: process.env.NODE_ENV || 'development',

  // API Server
  port: parseInt(process.env.PORT || '3002'),

  // Talenta API Configuration
  talenta: {
    baseUrl: process.env.TALENTA_API_URL || 'http://mock-talenta:3001',
    clientId: process.env.TALENTA_CLIENT_ID || 'demo-client-id',
    clientSecret: process.env.TALENTA_CLIENT_SECRET || 'demo-client-secret',
    accessToken: process.env.TALENTA_ACCESS_TOKEN || 'demo-token',
    companyId: process.env.TALENTA_COMPANY_ID || '1',
    timeout: parseInt(process.env.TALENTA_TIMEOUT || '30000'),
    retryAttempts: parseInt(process.env.TALENTA_RETRY_ATTEMPTS || '3'),
    retryDelay: parseInt(process.env.TALENTA_RETRY_DELAY || '1000')
  },

  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'postgres-middleware',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'hris_metadata',
    user: process.env.DB_USER || 'hris',
    password: process.env.DB_PASSWORD || 'pass',
    max: parseInt(process.env.DB_POOL_MAX || '10'),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000')
  },

  // Redis Configuration
  redis: {
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0')
  },

  // SFTP Configuration
  sftp: {
    host: process.env.SFTP_HOST || 'sftp-server',
    port: parseInt(process.env.SFTP_PORT || '22'),
    username: process.env.SFTP_USER || 'hris',
    password: process.env.SFTP_PASSWORD || '',
    privateKey: process.env.SFTP_PRIVATE_KEY || '',
    inboundPath: process.env.SFTP_INBOUND_PATH || '/data/inbound',
    archivePath: process.env.SFTP_ARCHIVE_PATH || '/data/archive',
    tempPath: process.env.SFTP_TEMP_PATH || '/data/temp'
  },

  // Encryption Configuration
  encryption: {
    pgpPublicKeyPath: process.env.PGP_PUBLIC_KEY_PATH || '/keys/oic_public.asc',
    pgpPrivateKeyPath: process.env.PGP_PRIVATE_KEY_PATH || '/keys/oic_private.asc',
    passphrase: process.env.PGP_PASSPHRASE || '',
    pdfOwnerPassword: process.env.PDF_OWNER_PASSWORD || 'hris-admin-2024'
  },

  // File Storage
  storage: {
    tempDir: process.env.TEMP_DIR || '/tmp/hris',
    outputDir: process.env.OUTPUT_DIR || '/data/output',
    archiveDir: process.env.ARCHIVE_DIR || '/data/archive',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800') // 50MB
  },

  // Job Scheduler
  scheduler: {
    enabled: process.env.SCHEDULER_ENABLED !== 'false',
    syncCron: process.env.SYNC_CRON || '0 2 * * *', // 2 AM daily
    cleanupCron: process.env.CLEANUP_CRON || '0 0 * * 0' // Weekly
  },

  // Processing Configuration
  processing: {
    batchSize: parseInt(process.env.BATCH_SIZE || '50'),
    maxConcurrent: parseInt(process.env.MAX_CONCURRENT || '5'),
    businessUnit: process.env.BUSINESS_UNIT || 'MY',
    generatePayslip: process.env.GENERATE_PAYSLIP !== 'false',
    generateTaxStatement: process.env.GENERATE_TAX_STATEMENT !== 'false'
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json'
  },

  // Feature Flags
  features: {
    useMockTalenta: process.env.USE_MOCK_TALENTA === 'true',
    useMockOIC: process.env.USE_MOCK_OIC === 'true',
    skipEncryption: process.env.SKIP_ENCRYPTION === 'true',
    skipUpload: process.env.SKIP_UPLOAD === 'true'
  }
};

// Validation
function validateConfig() {
  const required = [
    'database.host',
    'database.database',
    'database.user',
    'talenta.baseUrl'
  ];

  const missing = required.filter(path => {
    const value = path.split('.').reduce((obj, key) => obj?.[key], config);
    return !value;
  });

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }
}

// Run validation
try {
  validateConfig();
} catch (error) {
  console.error('Configuration validation failed:', error.message);
  process.exit(1);
}

module.exports = config;
