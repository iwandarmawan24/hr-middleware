const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const config = require('../config');

class PayslipGenerator {
  /**
   * Generate payslip PDF
   */
  async generatePayslip(employee, payroll, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const stream = fs.createWriteStream(outputPath);

        doc.pipe(stream);

        // Header
        doc.fontSize(20).text('PAYSLIP', { align: 'center' });
        doc.moveDown();

        // Company info (placeholder)
        doc.fontSize(10).text('PT. Demo Company Indonesia', { align: 'center' });
        doc.text('Jakarta, Indonesia', { align: 'center' });
        doc.moveDown(2);

        // Employee info
        doc.fontSize(12).text(`Employee Name: ${employee.full_name}`, { bold: true });
        doc.fontSize(10);
        doc.text(`Employee ID: ${employee.employee_id || employee.talenta_user_id}`);
        doc.text(`Department: ${employee.department || 'N/A'}`);
        doc.text(`Position: ${employee.position || 'N/A'}`);
        doc.text(`Period: ${payroll.period_name || `${payroll.year}-${String(payroll.month).padStart(2, '0')}`}`);
        doc.moveDown(2);

        // Earnings section
        doc.fontSize(12).text('EARNINGS', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);

        const earnings = [
          ['Basic Salary', this.formatCurrency(payroll.basic_salary)],
          ['Transport Allowance', this.formatCurrency(payroll.allowances?.transport || 0)],
          ['Meal Allowance', this.formatCurrency(payroll.allowances?.meal || 0)],
          ['Overtime Pay', this.formatCurrency(payroll.allowances?.overtime || 0)]
        ];

        earnings.forEach(([label, amount]) => {
          doc.text(label, 50, doc.y, { continued: true, width: 300 });
          doc.text(amount, { align: 'right' });
        });

        doc.moveDown(0.5);
        doc.text('─'.repeat(60));
        doc.text('Total Earnings', 50, doc.y, { continued: true, width: 300, bold: true });
        doc.text(this.formatCurrency(payroll.gross_salary), { align: 'right', bold: true });
        doc.moveDown(2);

        // Deductions section
        doc.fontSize(12).text('DEDUCTIONS', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);

        const deductions = [
          ['Income Tax (PPh 21)', this.formatCurrency(payroll.deductions?.tax || 0)],
          ['BPJS Kesehatan', this.formatCurrency(payroll.deductions?.bpjs_kesehatan || 0)],
          ['BPJS Ketenagakerjaan', this.formatCurrency(payroll.deductions?.bpjs_ketenagakerjaan || 0)]
        ];

        deductions.forEach(([label, amount]) => {
          doc.text(label, 50, doc.y, { continued: true, width: 300 });
          doc.text(amount, { align: 'right' });
        });

        doc.moveDown(0.5);
        doc.text('─'.repeat(60));
        doc.text('Total Deductions', 50, doc.y, { continued: true, width: 300, bold: true });
        doc.text(this.formatCurrency(payroll.total_deductions), { align: 'right', bold: true });
        doc.moveDown(2);

        // Net pay
        doc.fontSize(14);
        doc.text('═'.repeat(60));
        doc.moveDown(0.5);
        doc.text('NET PAY', 50, doc.y, { continued: true, width: 300, bold: true });
        doc.text(this.formatCurrency(payroll.net_salary), { align: 'right', bold: true });
        doc.moveDown(2);

        // Footer
        doc.fontSize(8);
        doc.text('This is a computer-generated document. No signature required.', { align: 'center', color: 'gray' });
        doc.text(`Generated on: ${new Date().toLocaleString('id-ID')}`, { align: 'center', color: 'gray' });

        doc.end();

        stream.on('finish', () => {
          logger.info(`Payslip generated: ${outputPath}`);
          resolve(outputPath);
        });

        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate tax statement PDF
   */
  async generateTaxStatement(employee, taxData, year, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const stream = fs.createWriteStream(outputPath);

        doc.pipe(stream);

        // Header
        doc.fontSize(20).text('TAX STATEMENT', { align: 'center' });
        doc.fontSize(16).text(`Year ${year}`, { align: 'center' });
        doc.moveDown(2);

        // Employee info
        doc.fontSize(12).text(`Employee Name: ${employee.full_name}`, { bold: true });
        doc.fontSize(10);
        doc.text(`Employee ID: ${employee.employee_id || employee.talenta_user_id}`);
        doc.text(`NPWP: ${employee.npwp || 'N/A'}`);
        doc.text(`NIK: ${employee.national_identifier || 'N/A'}`);
        doc.moveDown(2);

        // Tax summary
        doc.fontSize(12).text('ANNUAL TAX SUMMARY', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);

        const taxSummary = [
          ['Gross Annual Income', this.formatCurrency(taxData.gross_annual_income || 0)],
          ['Total Deductions', this.formatCurrency(taxData.total_deductions || 0)],
          ['Taxable Income', this.formatCurrency(taxData.taxable_income || 0)],
          ['Income Tax (PPh 21)', this.formatCurrency(taxData.total_tax || 0)]
        ];

        taxSummary.forEach(([label, amount]) => {
          doc.text(label, 50, doc.y, { continued: true, width: 300 });
          doc.text(amount, { align: 'right' });
        });

        doc.moveDown(2);

        // Footer
        doc.fontSize(8);
        doc.text('This is a computer-generated document. No signature required.', { align: 'center', color: 'gray' });
        doc.text(`Generated on: ${new Date().toLocaleString('id-ID')}`, { align: 'center', color: 'gray' });

        doc.end();

        stream.on('finish', () => {
          logger.info(`Tax statement generated: ${outputPath}`);
          resolve(outputPath);
        });

        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Protect PDF with password
   */
  async protectPDF(pdfPath, password, outputPath) {
    // Note: pdfkit doesn't support password protection natively
    // In production, use pdf-lib or similar library
    // For demo, we'll just copy the file
    logger.warn('PDF password protection not implemented in demo mode');
    await fs.promises.copyFile(pdfPath, outputPath);
    return outputPath;
  }

  /**
   * Convert PDF to base64
   */
  async pdfToBase64(pdfPath) {
    const buffer = await fs.promises.readFile(pdfPath);
    return buffer.toString('base64');
  }

  /**
   * Format currency in Indonesian Rupiah
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  }
}

module.exports = PayslipGenerator;
