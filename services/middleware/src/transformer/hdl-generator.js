const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const config = require('../config');

class HDLGenerator {
  /**
   * Generate CSV file for DocumentsOfRecord (Payslip/Tax Statement)
   */
  async generateDocumentsOfRecordCSV(documents, outputPath) {
    logger.info(`Generating DocumentsOfRecord CSV for ${documents.length} documents`);

    const rows = [];

    // Header row
    rows.push('PersonNumber,DocumentType,DocumentCode,DocumentName,SourceSystemOwner,SourceSystemId,FileName,FileContent');

    for (const doc of documents) {
      const {
        person_number,
        document_type,
        document_code,
        document_name,
        file_name,
        file_content_base64
      } = doc;

      const sourceSystemId = `${person_number}_${document_code}`;

      // Escape CSV fields
      const row = [
        person_number,
        document_type,
        this.escapeCSV(document_code),
        this.escapeCSV(document_name),
        'LEGACY_DATA',
        sourceSystemId,
        this.escapeCSV(file_name),
        file_content_base64 // Base64 encoded PDF
      ].join(',');

      rows.push(row);
    }

    const csvContent = rows.join('\n');
    await fs.writeFile(outputPath, csvContent, 'utf8');

    logger.info(`DocumentsOfRecord CSV generated: ${outputPath}`);
    return outputPath;
  }

  /**
   * Generate CSV file for Worker (External Identifier / Payroll ID)
   */
  async generateExternalIdentifierCSV(identifiers, outputPath) {
    logger.info(`Generating ExternalIdentifier CSV for ${identifiers.length} identifiers`);

    const rows = [];

    // Header row
    rows.push('PersonNumber,ExternalIdentifierSequence,ExternalIdentifierNumber,ExternalIdentifierType,DateFrom,SourceSystemOwner,SourceSystemId');

    for (const identifier of identifiers) {
      const {
        person_number,
        sequence,
        identifier_number,
        date_from
      } = identifier;

      const sourceSystemId = `${person_number}_${identifier_number}`;

      const row = [
        person_number,
        sequence || 1,
        identifier_number,
        'ORA_3RD_PARTY_PAY_ID',
        date_from,
        'LEGACY_DATA',
        sourceSystemId
      ].join(',');

      rows.push(row);
    }

    const csvContent = rows.join('\n');
    await fs.writeFile(outputPath, csvContent, 'utf8');

    logger.info(`ExternalIdentifier CSV generated: ${outputPath}`);
    return outputPath;
  }

  /**
   * Generate CSV file for PersonAccrualDetail (Overtime)
   */
  async generateOvertimeCSV(overtimes, outputPath) {
    logger.info(`Generating Overtime CSV for ${overtimes.length} records`);

    const rows = [];

    // Header row
    rows.push('PersonNumber,AccrualPlan,AccrualType,AccrualDate,Hours,SourceSystemOwner,SourceSystemId');

    for (const overtime of overtimes) {
      const {
        person_number,
        accrual_date,
        hours
      } = overtime;

      const sourceSystemId = `${person_number}_OT_${accrual_date}`;

      const row = [
        person_number,
        'Overtime Plan',
        'OVERTIME',
        accrual_date,
        hours,
        'LEGACY_DATA',
        sourceSystemId
      ].join(',');

      rows.push(row);
    }

    const csvContent = rows.join('\n');
    await fs.writeFile(outputPath, csvContent, 'utf8');

    logger.info(`Overtime CSV generated: ${outputPath}`);
    return outputPath;
  }

  /**
   * Generate file name according to specification
   */
  generateFileName(type, businessUnit = 'MY') {
    const timestamp = new Date().toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '')
      .split('.')[0];

    const fileTypes = {
      PAYSLIP: `HCM_INT_111_PAYSLIP_${businessUnit}_${timestamp}.CSV`,
      TAX: `HCM_INT_111_TAX_${businessUnit}_${timestamp}.CSV`,
      PAYROLL_ID: `HCM_INT_111_PAYROLLID_${businessUnit}_${timestamp}.CSV`,
      OVERTIME: `HCM_INT_121_OT_${businessUnit}_${timestamp}.CSV`
    };

    return fileTypes[type] || `HCM_INT_${type}_${timestamp}.CSV`;
  }

  /**
   * Transform Talenta payroll data to Oracle format
   */
  transformPayrollToDocument(employee, payroll, documentType = 'Third Party Payslip') {
    const personNumber = employee.oracle_person_number || `30${String(employee.talenta_user_id).padStart(13, '0')}`;
    const period = `${payroll.year}-${String(payroll.month).padStart(2, '0')}`;
    const documentCode = `${documentType.replace(/\s/g, '_')}_${period}`;
    const documentName = `${documentType} ${period}`;

    return {
      person_number: personNumber,
      document_type: documentType,
      document_code: documentCode,
      document_name: documentName,
      period_year: payroll.year,
      period_month: payroll.month,
      payroll_data: payroll
    };
  }

  /**
   * Transform employee to external identifier
   */
  transformEmployeeToExternalIdentifier(employee) {
    const personNumber = employee.oracle_person_number || `30${String(employee.talenta_user_id).padStart(13, '0')}`;

    return {
      person_number: personNumber,
      sequence: 1,
      identifier_number: String(employee.talenta_user_id),
      date_from: employee.hire_date || new Date().toISOString().split('T')[0]
    };
  }

  /**
   * Transform attendance to overtime record
   */
  transformAttendanceToOvertime(employee, attendance) {
    const personNumber = employee.oracle_person_number || `30${String(employee.talenta_user_id).padStart(13, '0')}`;

    return {
      person_number: personNumber,
      accrual_date: attendance.date,
      hours: attendance.overtime_hours || 0
    };
  }

  /**
   * Escape CSV field (handle commas and quotes)
   */
  escapeCSV(field) {
    if (field === null || field === undefined) return '';
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  /**
   * Generate .ok trigger file
   */
  async generateTriggerFile(csvFilePath) {
    const okFilePath = csvFilePath + '.ok';
    await fs.writeFile(okFilePath, '', 'utf8');
    logger.info(`Trigger file generated: ${okFilePath}`);
    return okFilePath;
  }
}

module.exports = HDLGenerator;
