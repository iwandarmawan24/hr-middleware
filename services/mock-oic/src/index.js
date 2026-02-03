require('dotenv').config();
const chokidar = require('chokidar');
const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');
const openpgp = require('openpgp');
const csv = require('csv-parser');
const { createReadStream } = require('fs');
const winston = require('winston');

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      let msg = `${timestamp} [${level}] ${message}`;
      if (Object.keys(meta).length > 0) {
        msg += ` ${JSON.stringify(meta)}`;
      }
      return msg;
    })
  ),
  transports: [new winston.transports.Console()]
});

// Configuration
const config = {
  watchDir: process.env.WATCH_DIR || '/data/inbound',
  archiveDir: process.env.ARCHIVE_DIR || '/data/archive',
  tempDir: process.env.TEMP_DIR || '/tmp/oic',
  pgpPrivateKeyPath: process.env.PGP_PRIVATE_KEY_PATH || '/keys/oic_private.asc',
  pgpPassphrase: process.env.PGP_PASSPHRASE || '',
  database: {
    host: process.env.DB_HOST || 'postgres-hcm',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'mock_hcm',
    user: process.env.DB_USER || 'hcm',
    password: process.env.DB_PASSWORD || 'pass'
  }
};

// Database connection
const pool = new Pool(config.database);

// PGP private key
let privateKey = null;

// Initialize PGP key
async function loadPrivateKey() {
  try {
    const keyData = await fs.readFile(config.pgpPrivateKeyPath, 'utf8');
    privateKey = await openpgp.readPrivateKey({ armoredKey: keyData });
    logger.info('PGP private key loaded');
  } catch (error) {
    logger.warn('PGP private key not found, skipping decryption', { error: error.message });
  }
}

// Ensure directories exist
async function ensureDirectories() {
  await fs.mkdir(config.watchDir, { recursive: true });
  await fs.mkdir(config.archiveDir, { recursive: true });
  await fs.mkdir(config.tempDir, { recursive: true });
  logger.info('Directories initialized');
}

// Decrypt PGP file
async function decryptFile(encryptedPath, outputPath) {
  try {
    if (!privateKey) {
      // If no key, just copy the file (assume it's not encrypted)
      await fs.copyFile(encryptedPath, outputPath);
      logger.warn('No private key, copying file without decryption');
      return outputPath;
    }

    const encryptedData = await fs.readFile(encryptedPath);
    const message = await openpgp.readMessage({ binaryMessage: encryptedData });

    const { data: decrypted } = await openpgp.decrypt({
      message,
      decryptionKeys: privateKey
    });

    await fs.writeFile(outputPath, decrypted);
    logger.info(`File decrypted: ${outputPath}`);
    return outputPath;
  } catch (error) {
    logger.error('Decryption failed', { error: error.message });
    throw error;
  }
}

// Parse CSV and load to database
async function processCSV(csvPath, fileName) {
  const importLog = await createImportLog(fileName);

  try {
    logger.info(`Processing CSV: ${csvPath}`);

    // Determine HDL object type from filename
    const hdlObject = detectHDLObject(fileName);
    logger.info(`Detected HDL object: ${hdlObject}`);

    const rows = [];

    return new Promise((resolve, reject) => {
      createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          rows.push(row);
        })
        .on('end', async () => {
          logger.info(`Parsed ${rows.length} rows from CSV`);

          let success = 0;
          let failed = 0;

          for (const row of rows) {
            try {
              await loadRowToDatabase(row, hdlObject);
              success++;
            } catch (error) {
              logger.error('Failed to load row', { error: error.message, row });
              failed++;
            }
          }

          await updateImportLog(importLog.import_id, {
            records_total: rows.length,
            records_success: success,
            records_failed: failed,
            status: failed === 0 ? 'COMPLETED' : 'COMPLETED',
            completed_at: new Date()
          });

          logger.info(`CSV processing completed: ${success} success, ${failed} failed`);
          resolve({ success, failed, total: rows.length });
        })
        .on('error', (error) => {
          logger.error('CSV parsing error', { error: error.message });
          reject(error);
        });
    });
  } catch (error) {
    await updateImportLog(importLog.import_id, {
      status: 'FAILED',
      error_message: error.message,
      completed_at: new Date()
    });
    throw error;
  }
}

// Detect HDL object type from filename
function detectHDLObject(fileName) {
  if (fileName.includes('PAYSLIP') || fileName.includes('TAX')) {
    return 'DocumentsOfRecord';
  } else if (fileName.includes('PAYROLLID')) {
    return 'ExternalIdentifier';
  } else if (fileName.includes('OT')) {
    return 'PersonAccrualDetail';
  }
  return 'Unknown';
}

// Load row to appropriate database table
async function loadRowToDatabase(row, hdlObject) {
  switch (hdlObject) {
    case 'DocumentsOfRecord':
      await loadDocumentOfRecord(row);
      break;
    case 'ExternalIdentifier':
      await loadExternalIdentifier(row);
      break;
    case 'PersonAccrualDetail':
      await loadPersonAccrualDetail(row);
      break;
    default:
      logger.warn('Unknown HDL object type', { hdlObject });
  }
}

// Load document of record
async function loadDocumentOfRecord(row) {
  const {
    PersonNumber,
    DocumentType,
    DocumentCode,
    DocumentName,
    SourceSystemOwner,
    SourceSystemId,
    FileName,
    FileContent
  } = row;

  // Ensure person exists
  const person = await ensurePersonExists(PersonNumber);

  // Insert or update document
  const documentResult = await pool.query(
    `INSERT INTO documents_of_record
     (person_id, person_number, document_type, document_code, document_name,
      source_system_owner, source_system_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (person_number, document_type, document_code)
     DO UPDATE SET document_name = $5, source_system_owner = $6, source_system_id = $7
     RETURNING document_id`,
    [person.person_id, PersonNumber, DocumentType, DocumentCode, DocumentName,
     SourceSystemOwner, SourceSystemId]
  );

  const documentId = documentResult.rows[0].document_id;

  // If there's file content (base64), save attachment
  if (FileContent && FileName) {
    const fileBuffer = Buffer.from(FileContent, 'base64');

    await pool.query(
      `INSERT INTO document_attachments
       (document_id, person_number, document_type, document_code, title,
        file_name, file_content, file_size, source_system_owner, source_system_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (document_id) DO UPDATE SET
         file_content = $7, file_size = $8`,
      [documentId, PersonNumber, DocumentType, DocumentCode, DocumentName,
       FileName, fileBuffer, fileBuffer.length, SourceSystemOwner, SourceSystemId]
    );
  }

  logger.debug(`Loaded document: ${DocumentType} for ${PersonNumber}`);
}

// Load external identifier
async function loadExternalIdentifier(row) {
  const {
    PersonNumber,
    ExternalIdentifierSequence,
    ExternalIdentifierNumber,
    ExternalIdentifierType,
    DateFrom,
    SourceSystemOwner,
    SourceSystemId
  } = row;

  const person = await ensurePersonExists(PersonNumber);

  await pool.query(
    `INSERT INTO external_identifiers
     (person_id, person_number, external_identifier_sequence, external_identifier_number,
      external_identifier_type, date_from, source_system_owner, source_system_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (person_number, external_identifier_type, external_identifier_sequence)
     DO UPDATE SET external_identifier_number = $4, date_from = $6`,
    [person.person_id, PersonNumber, ExternalIdentifierSequence, ExternalIdentifierNumber,
     ExternalIdentifierType, DateFrom, SourceSystemOwner, SourceSystemId]
  );

  logger.debug(`Loaded external ID: ${ExternalIdentifierNumber} for ${PersonNumber}`);
}

// Load person accrual detail
async function loadPersonAccrualDetail(row) {
  const {
    PersonNumber,
    AccrualPlan,
    AccrualType,
    AccrualDate,
    Hours,
    SourceSystemOwner,
    SourceSystemId
  } = row;

  const person = await ensurePersonExists(PersonNumber);

  await pool.query(
    `INSERT INTO person_accrual_details
     (person_id, person_number, accrual_plan, accrual_type, accrual_date,
      hours, source_system_owner, source_system_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [person.person_id, PersonNumber, AccrualPlan, AccrualType, AccrualDate,
     parseFloat(Hours), SourceSystemOwner, SourceSystemId]
  );

  logger.debug(`Loaded accrual: ${Hours} hours for ${PersonNumber}`);
}

// Ensure person exists in database
async function ensurePersonExists(personNumber) {
  const result = await pool.query(
    'SELECT person_id FROM persons WHERE person_number = $1',
    [personNumber]
  );

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  // Create person with minimal data
  const insertResult = await pool.query(
    `INSERT INTO persons (person_number, full_name, source_system_owner, source_system_id)
     VALUES ($1, $2, $3, $4)
     RETURNING person_id`,
    [personNumber, `Person ${personNumber}`, 'LEGACY_DATA', personNumber]
  );

  logger.info(`Created person: ${personNumber}`);
  return insertResult.rows[0];
}

// Create import log entry
async function createImportLog(fileName) {
  const hdlObject = detectHDLObject(fileName);
  const fileType = path.extname(fileName).substring(1).toUpperCase();

  const result = await pool.query(
    `INSERT INTO hdl_import_log (file_name, file_type, hdl_object, status, started_at)
     VALUES ($1, $2, $3, 'PROCESSING', NOW())
     RETURNING import_id`,
    [fileName, fileType, hdlObject]
  );

  return result.rows[0];
}

// Update import log
async function updateImportLog(importId, updates) {
  const fields = [];
  const values = [];
  let index = 1;

  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = $${index}`);
    values.push(value);
    index++;
  }

  values.push(importId);

  await pool.query(
    `UPDATE hdl_import_log SET ${fields.join(', ')} WHERE import_id = $${index}`,
    values
  );
}

// Process a file
async function processFile(filePath) {
  const fileName = path.basename(filePath);
  const fileNameWithoutExt = fileName.replace(/\.(gpg|csv)$/gi, '');

  logger.info(`Processing file: ${fileName}`);

  try {
    // Check if it's encrypted
    const isEncrypted = fileName.toLowerCase().endsWith('.gpg');
    let csvPath = filePath;

    if (isEncrypted) {
      // Decrypt file
      const decryptedPath = path.join(config.tempDir, fileNameWithoutExt);
      csvPath = await decryptFile(filePath, decryptedPath);
    }

    // Process CSV
    const result = await processCSV(csvPath, fileName);

    // Archive original file
    const archiveDate = new Date().toISOString().split('T')[0];
    const archivePath = path.join(config.archiveDir, archiveDate);
    await fs.mkdir(archivePath, { recursive: true });

    const archivedFilePath = path.join(archivePath, fileName);
    await fs.rename(filePath, archivedFilePath);
    logger.info(`File archived: ${archivedFilePath}`);

    // Remove .ok file if exists
    const okFilePath = `${filePath}.ok`;
    try {
      await fs.unlink(okFilePath);
    } catch (error) {
      // Ignore if doesn't exist
    }

    logger.info(`File processing completed: ${fileName}`, result);
  } catch (error) {
    logger.error('File processing failed', { fileName, error: error.message });
  }
}

// File watcher
function startFileWatcher() {
  const watcher = chokidar.watch(`${config.watchDir}/*.ok`, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100
    }
  });

  watcher.on('add', async (okFilePath) => {
    logger.info(`Trigger file detected: ${okFilePath}`);

    // Get the corresponding data file
    const dataFilePath = okFilePath.replace(/\.ok$/, '');

    try {
      // Check if data file exists
      await fs.access(dataFilePath);

      // Process the file
      await processFile(dataFilePath);
    } catch (error) {
      logger.error('Failed to process triggered file', { okFilePath, error: error.message });
    }
  });

  logger.info(`File watcher started: ${config.watchDir}`);
}

// Test database connection
async function testDatabaseConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    logger.info('Database connection successful', { timestamp: result.rows[0].now });
    return true;
  } catch (error) {
    logger.error('Database connection failed', { error: error.message });
    return false;
  }
}

// Main function
async function main() {
  logger.info('Starting Mock OIC Service');

  try {
    await ensureDirectories();
    await loadPrivateKey();
    await testDatabaseConnection();
    startFileWatcher();

    logger.info('Mock OIC Service ready');
  } catch (error) {
    logger.error('Startup failed', { error: error.message });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down');
  await pool.end();
  process.exit(0);
});

main();
