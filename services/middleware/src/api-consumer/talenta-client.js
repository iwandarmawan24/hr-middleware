const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');
const db = require('../utils/database');

class TalentaClient {
  constructor() {
    this.baseUrl = config.talenta.baseUrl;
    this.accessToken = config.talenta.accessToken;
    this.companyId = config.talenta.companyId;

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: config.talenta.timeout,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    // Add request/response interceptors for logging
    this.client.interceptors.request.use(
      (request) => {
        request.meta = { startTime: Date.now() };
        logger.debug('Talenta API request', {
          method: request.method,
          url: request.url
        });
        return request;
      },
      (error) => {
        logger.error('Talenta API request error', { error: error.message });
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        const duration = Date.now() - response.config.meta.startTime;
        logger.debug('Talenta API response', {
          status: response.status,
          duration,
          url: response.config.url
        });
        return response;
      },
      async (error) => {
        const duration = error.config?.meta ? Date.now() - error.config.meta.startTime : 0;
        logger.error('Talenta API response error', {
          status: error.response?.status,
          duration,
          url: error.config?.url,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Generic retry logic
   */
  async withRetry(fn, attempts = config.talenta.retryAttempts) {
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (error) {
        const isLastAttempt = i === attempts - 1;
        const shouldRetry = error.response?.status >= 500 || error.code === 'ETIMEDOUT';

        if (!shouldRetry || isLastAttempt) {
          throw error;
        }

        const delay = config.talenta.retryDelay * Math.pow(2, i);
        logger.warn(`Retry attempt ${i + 1}/${attempts} after ${delay}ms`, {
          error: error.message
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Log API call to database
   */
  async logApiCall(syncJobId, endpoint, method, payload, response, duration) {
    try {
      await db.apiLogs.create({
        sync_job_id: syncJobId,
        direction: 'OUTBOUND',
        endpoint,
        method,
        request_payload: payload ? JSON.stringify(payload) : null,
        response_status: response?.status || null,
        response_body: response?.data ? JSON.stringify(response.data) : null,
        duration_ms: duration
      });
    } catch (error) {
      logger.error('Failed to log API call', { error: error.message });
    }
  }

  /**
   * Get all employees
   */
  async getEmployees(filters = {}) {
    return await this.withRetry(async () => {
      const params = {
        limit: 100,
        offset: 0,
        ...filters
      };

      const allEmployees = [];
      let hasMore = true;

      while (hasMore) {
        const response = await this.client.get('/v2/talenta/v2/employee', { params });
        const employees = response.data.data || [];
        allEmployees.push(...employees);

        const total = response.data.meta?.total || 0;
        params.offset += params.limit;
        hasMore = params.offset < total;

        logger.info(`Fetched ${allEmployees.length}/${total} employees`);
      }

      return allEmployees;
    });
  }

  /**
   * Get employee detail
   */
  async getEmployeeDetail(userId) {
    return await this.withRetry(async () => {
      const response = await this.client.get(`/v2/talenta/v2/employee/${userId}`, {
        params: { display: 'all' }
      });
      return response.data.data;
    });
  }

  /**
   * Get payroll data for a specific employee and period
   */
  async getPayrollReport(userId, year, month) {
    return await this.withRetry(async () => {
      const response = await this.client.get('/v2/talenta/v2/payroll/report', {
        params: { user_id: userId, year, month }
      });
      return response.data.data;
    });
  }

  /**
   * Get all payrolls for a specific period
   */
  async getPayrollsForPeriod(year, month) {
    return await this.withRetry(async () => {
      const response = await this.client.get('/v2/talenta/v2/payroll', {
        params: { year, month, limit: 1000 }
      });
      return response.data.data || [];
    });
  }

  /**
   * Get payroll info (bank account, etc.)
   */
  async getPayrollInfo(userId) {
    return await this.withRetry(async () => {
      const response = await this.client.get('/v2/talenta/v2/payroll/info', {
        params: { user_id: userId }
      });
      return response.data.data;
    });
  }

  /**
   * Get attendance data
   */
  async getAttendance(userId, startDate, endDate) {
    return await this.withRetry(async () => {
      const response = await this.client.get('/v2/talenta/v2/live-attendance', {
        params: {
          user_id: userId,
          start_date: startDate,
          end_date: endDate,
          limit: 1000
        }
      });
      return response.data.data || [];
    });
  }

  /**
   * Get company branches
   */
  async getBranches() {
    return await this.withRetry(async () => {
      const response = await this.client.get(`/v2/talenta/v2/company/${this.companyId}/branch`);
      return response.data.data || [];
    });
  }

  /**
   * Get organization structure
   */
  async getOrganization() {
    return await this.withRetry(async () => {
      const response = await this.client.get(`/v2/talenta/v2/company/${this.companyId}/organization`);
      return response.data.data || [];
    });
  }

  /**
   * Get grades
   */
  async getGrades() {
    return await this.withRetry(async () => {
      const response = await this.client.get(`/v2/talenta/v2/company/${this.companyId}/grade`);
      return response.data.data || [];
    });
  }

  /**
   * Test connection
   */
  async testConnection() {
    try {
      await this.client.get('/health');
      logger.info('Talenta API connection successful');
      return true;
    } catch (error) {
      logger.error('Talenta API connection failed', { error: error.message });
      return false;
    }
  }
}

module.exports = TalentaClient;
