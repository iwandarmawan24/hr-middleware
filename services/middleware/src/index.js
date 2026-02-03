const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const config = require('./config');
const logger = require('./utils/logger');
const db = require('./utils/database');
const TalentaClient = require('./api-consumer/talenta-client');
const HDLGenerator = require('./transformer/hdl-generator');
const PayslipGenerator = require('./pdf-generator/payslip-generator');
const PGPService = require('./encryption/pgp-service');
const SFTPUploader = require('./sftp-uploader/sftp-client');

const app = express();
app.use(express.json());

// Initialize services
const talentaClient = new TalentaClient();
const hdlGenerator = new HDLGenerator();
const payslipGenerator = new PayslipGenerator();
const pgpService = new PGPService();
const sftpUploader = new SFTPUploader();

// Ensure directories exist
async function ensureDirectories() {
  const dirs = [
    config.storage.tempDir,
    config.storage.outputDir,
    config.storage.archiveDir
  ];

  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }

  logger.info('Storage directories initialized');
}

// Sync employees from Talenta to database
async function syncEmployees(syncJobId) {
  logger.info('Starting employee sync');

  const employees = await talentaClient.getEmployees();
  let processed = 0;
  let failed = 0;

  for (const employee of employees) {
    try {
      // Generate Oracle person number (format: 30 + 13 digits)
      const oraclePersonNumber = `30${String(employee.user_id).padStart(13, '0')}`;

      await db.employees.upsert({
        talenta_user_id: employee.user_id,
        oracle_person_number: oraclePersonNumber,
        full_name: employee.full_name,
        email: employee.email,
        national_identifier: employee.nik,
        department: employee.department,
        position: employee.position,
        branch_id: employee.branch_id,
        employment_status: employee.employment_status
      });

      processed++;
    } catch (error) {
      logger.error(`Failed to sync employee ${employee.user_id}`, { error: error.message });
      failed++;
    }
  }

  logger.info(`Employee sync completed: ${processed} processed, ${failed} failed`);
  return { processed, failed };
}

// Process payroll for a specific period
async function processPayroll(year, month, syncJobId) {
  logger.info(`Processing payroll for ${year}-${month}`);

  const employees = await db.query('SELECT * FROM employees ORDER BY id');
  const documents = [];

  for (const employee of employees.rows) {
    try {
      // Fetch payroll data from Talenta
      const payroll = await talentaClient.getPayrollReport(
        employee.talenta_user_id,
        year,
        month
      );

      if (!payroll) {
        logger.warn(`No payroll data for employee ${employee.talenta_user_id}`);
        continue;
      }

      // Generate PDF
      const pdfFileName = `payslip_${employee.talenta_user_id}_${year}${String(month).padStart(2, '0')}.pdf`;
      const pdfPath = path.join(config.storage.tempDir, pdfFileName);

      await payslipGenerator.generatePayslip(employee, payroll, pdfPath);

      // Convert PDF to base64
      const pdfBase64 = await payslipGenerator.pdfToBase64(pdfPath);

      // Transform to Oracle format
      const document = hdlGenerator.transformPayrollToDocument(employee, payroll, 'Third Party Payslip');
      document.file_name = pdfFileName;
      document.file_content_base64 = pdfBase64;

      documents.push(document);

      // Save to database
      await db.documents.create({
        employee_id: employee.id,
        document_type: 'PAYSLIP',
        document_code: document.document_code,
        document_name: document.document_name,
        period_year: year,
        period_month: month,
        original_file_path: pdfPath,
        status: 'PROCESSED'
      });

    } catch (error) {
      logger.error(`Failed to process payroll for employee ${employee.talenta_user_id}`, {
        error: error.message
      });
    }
  }

  // Generate CSV file
  if (documents.length > 0) {
    const csvFileName = hdlGenerator.generateFileName('PAYSLIP', config.processing.businessUnit);
    const csvPath = path.join(config.storage.outputDir, csvFileName);

    await hdlGenerator.generateDocumentsOfRecordCSV(documents, csvPath);

    // Encrypt CSV
    const encryptedPath = `${csvPath}.gpg`;
    await pgpService.encryptFile(csvPath, encryptedPath);

    // Upload to SFTP
    const remotePath = path.join(config.sftp.inboundPath, path.basename(encryptedPath));
    await sftpUploader.uploadWithTrigger(encryptedPath, remotePath);

    logger.info(`Payroll processing completed: ${documents.length} documents generated`);
  }

  return { documentsGenerated: documents.length };
}

// Full sync job
async function runFullSync() {
  const syncJob = await db.syncJobs.create('FULL_SYNC', config.processing.businessUnit);

  try {
    logger.info(`Starting full sync job: ${syncJob.id}`);

    // Step 1: Sync employees
    const { processed: employeesProcessed, failed: employeesFailed } = await syncEmployees(syncJob.id);

    // Step 2: Process payroll for current month
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // Previous month

    const { documentsGenerated } = await processPayroll(year, month, syncJob.id);

    // Complete job
    await db.syncJobs.complete(syncJob.id, employeesProcessed + documentsGenerated, employeesFailed);

    logger.info(`Full sync completed successfully: ${syncJob.id}`);
    return syncJob;
  } catch (error) {
    logger.error('Full sync failed', { error: error.message, syncJobId: syncJob.id });
    await db.syncJobs.complete(syncJob.id, 0, 1, error.message);
    throw error;
  }
}

// API Routes
app.get('/health', async (req, res) => {
  const dbHealthy = await db.testConnection();
  const talentaHealthy = await talentaClient.testConnection();

  res.json({
    status: dbHealthy && talentaHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      database: dbHealthy ? 'up' : 'down',
      talentaApi: talentaHealthy ? 'up' : 'down'
    },
    config: {
      environment: config.env,
      businessUnit: config.processing.businessUnit,
      features: config.features
    }
  });
});

app.post('/api/sync/trigger', async (req, res) => {
  try {
    logger.info('Manual sync triggered');
    const syncJob = await runFullSync();

    res.json({
      success: true,
      message: 'Sync job started',
      jobId: syncJob.id
    });
  } catch (error) {
    logger.error('Sync trigger failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/sync/employees', async (req, res) => {
  try {
    const syncJob = await db.syncJobs.create('EMPLOYEE_SYNC');
    const result = await syncEmployees(syncJob.id);
    await db.syncJobs.complete(syncJob.id, result.processed, result.failed);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/sync/payroll', async (req, res) => {
  try {
    const { year, month } = req.body;

    if (!year || !month) {
      return res.status(400).json({ error: 'year and month are required' });
    }

    const syncJob = await db.syncJobs.create('PAYROLL_SYNC');
    const result = await processPayroll(year, month, syncJob.id);
    await db.syncJobs.complete(syncJob.id, result.documentsGenerated);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/jobs', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM sync_jobs ORDER BY created_at DESC LIMIT 50'
    );
    res.json({ jobs: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize and start server
async function start() {
  try {
    logger.info('Starting HRIS Middleware');

    // Initialize
    await ensureDirectories();
    await db.testConnection();
    await pgpService.loadKeys();

    // Start server
    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`Features:`, config.features);
    });

  } catch (error) {
    logger.error('Startup failed', { error: error.message });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await db.end();
  await sftpUploader.disconnect();
  process.exit(0);
});

start();
