const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const DELAY_MS = parseInt(process.env.MOCK_DELAY_MS || '100');

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Load mock data
const dataDir = path.join(__dirname, '..', 'data');
let employees = [];
let payrolls = [];
let attendances = [];
let organization = [];
let branches = [];

function loadData() {
  try {
    if (fs.existsSync(path.join(dataDir, 'employees.json'))) {
      employees = JSON.parse(fs.readFileSync(path.join(dataDir, 'employees.json'), 'utf8'));
    }
    if (fs.existsSync(path.join(dataDir, 'payrolls.json'))) {
      payrolls = JSON.parse(fs.readFileSync(path.join(dataDir, 'payrolls.json'), 'utf8'));
    }
    if (fs.existsSync(path.join(dataDir, 'attendances.json'))) {
      attendances = JSON.parse(fs.readFileSync(path.join(dataDir, 'attendances.json'), 'utf8'));
    }
    if (fs.existsSync(path.join(dataDir, 'organization.json'))) {
      organization = JSON.parse(fs.readFileSync(path.join(dataDir, 'organization.json'), 'utf8'));
    }
    if (fs.existsSync(path.join(dataDir, 'branches.json'))) {
      branches = JSON.parse(fs.readFileSync(path.join(dataDir, 'branches.json'), 'utf8'));
    }
    console.log('✅ Data loaded successfully');
  } catch (error) {
    console.error('❌ Error loading data:', error.message);
    console.log('💡 Run "npm run seed" to generate sample data');
  }
}

// Simulate API delay
const simulateDelay = () => new Promise(resolve => setTimeout(resolve, DELAY_MS));

// Auth middleware (simple bearer token check)
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Missing or invalid authorization token' });
  }
  next();
};

// ============================================
// COMPANY & ORGANIZATION ENDPOINTS
// ============================================

// GET /v2/talenta/v2/company/:companyId/branch
app.get('/v2/talenta/v2/company/:companyId/branch', authMiddleware, async (req, res) => {
  await simulateDelay();
  res.json({
    message: 'Get branches successfully',
    data: branches
  });
});

// GET /v2/talenta/v2/company/:companyId/organization
app.get('/v2/talenta/v2/company/:companyId/organization', authMiddleware, async (req, res) => {
  await simulateDelay();
  res.json({
    message: 'Get organization structure successfully',
    data: organization
  });
});

// GET /v2/talenta/v2/company/:companyId/grade
app.get('/v2/talenta/v2/company/:companyId/grade', authMiddleware, async (req, res) => {
  await simulateDelay();
  const grades = ['L1', 'L2', 'L3', 'L4', 'L5', 'M1', 'M2', 'M3'].map((grade, index) => ({
    id: index + 1,
    name: grade,
    description: `Grade ${grade}`,
    created_at: new Date().toISOString()
  }));
  res.json({
    message: 'Get grades successfully',
    data: grades
  });
});

// GET /v2/talenta/v2/company/:companyId/employment-status
app.get('/v2/talenta/v2/company/:companyId/employment-status', authMiddleware, async (req, res) => {
  await simulateDelay();
  const statuses = ['Permanent', 'Contract', 'Probation', 'Intern'].map((status, index) => ({
    id: index + 1,
    name: status,
    created_at: new Date().toISOString()
  }));
  res.json({
    message: 'Get employment statuses successfully',
    data: statuses
  });
});

// GET /v2/talenta/v2/company/:companyId/bank-list
app.get('/v2/talenta/v2/company/:companyId/bank-list', authMiddleware, async (req, res) => {
  await simulateDelay();
  const banks = ['BCA', 'Mandiri', 'BNI', 'BRI', 'CIMB Niaga', 'Permata', 'Danamon'].map((bank, index) => ({
    id: index + 1,
    name: bank,
    code: bank.toUpperCase().replace(/\s/g, '_')
  }));
  res.json({
    message: 'Get banks successfully',
    data: banks
  });
});

// ============================================
// EMPLOYEE ENDPOINTS
// ============================================

// GET /v2/talenta/v2/employee - List employees
app.get('/v2/talenta/v2/employee', authMiddleware, async (req, res) => {
  await simulateDelay();

  const { limit = 20, offset = 0, department, branch_id, employment_status } = req.query;

  let filtered = [...employees];

  // Apply filters
  if (department) {
    filtered = filtered.filter(emp => emp.department === department);
  }
  if (branch_id) {
    filtered = filtered.filter(emp => emp.branch_id === parseInt(branch_id));
  }
  if (employment_status) {
    filtered = filtered.filter(emp => emp.employment_status === employment_status);
  }

  // Apply pagination
  const start = parseInt(offset);
  const end = start + parseInt(limit);
  const paginated = filtered.slice(start, end);

  res.json({
    message: 'Get employees successfully',
    data: paginated,
    meta: {
      total: filtered.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }
  });
});

// GET /v2/talenta/v2/employee/:userId - Get employee detail
app.get('/v2/talenta/v2/employee/:userId', authMiddleware, async (req, res) => {
  await simulateDelay();

  const userId = parseInt(req.params.userId);
  const employee = employees.find(emp => emp.user_id === userId);

  if (!employee) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Employee with user_id ${userId} not found`
    });
  }

  res.json({
    message: 'Get employee detail successfully',
    data: employee
  });
});

// GET /v2/talenta/v2/employee/:userId/status
app.get('/v2/talenta/v2/employee/:userId/status', authMiddleware, async (req, res) => {
  await simulateDelay();

  const userId = parseInt(req.params.userId);
  const employee = employees.find(emp => emp.user_id === userId);

  if (!employee) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Employee with user_id ${userId} not found`
    });
  }

  res.json({
    message: 'Get employment status successfully',
    data: {
      user_id: employee.user_id,
      employment_status: employee.employment_status,
      hire_date: employee.hire_date,
      probation_end_date: employee.employment_status === 'Probation' ? new Date(new Date(employee.hire_date).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
      contract_end_date: employee.employment_status === 'Contract' ? new Date(new Date(employee.hire_date).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null
    }
  });
});

// ============================================
// PAYROLL ENDPOINTS
// ============================================

// GET /v2/talenta/v2/payroll - List payrolls
app.get('/v2/talenta/v2/payroll', authMiddleware, async (req, res) => {
  await simulateDelay();

  const { user_id, year, month, limit = 20, offset = 0 } = req.query;

  let filtered = [...payrolls];

  if (user_id) {
    filtered = filtered.filter(p => p.user_id === parseInt(user_id));
  }
  if (year) {
    filtered = filtered.filter(p => p.year === parseInt(year));
  }
  if (month) {
    filtered = filtered.filter(p => p.month === parseInt(month));
  }

  // Sort by date descending
  filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const start = parseInt(offset);
  const end = start + parseInt(limit);
  const paginated = filtered.slice(start, end);

  res.json({
    message: 'Get payrolls successfully',
    data: paginated,
    meta: {
      total: filtered.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }
  });
});

// GET /v2/talenta/v2/payroll/report - Get detailed payroll report
app.get('/v2/talenta/v2/payroll/report', authMiddleware, async (req, res) => {
  await simulateDelay();

  const { user_id, year, month } = req.query;

  if (!user_id || !year || !month) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'user_id, year, and month are required'
    });
  }

  const payroll = payrolls.find(p =>
    p.user_id === parseInt(user_id) &&
    p.year === parseInt(year) &&
    p.month === parseInt(month)
  );

  if (!payroll) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Payroll record not found'
    });
  }

  res.json({
    message: 'Get payroll report successfully',
    data: payroll
  });
});

// GET /v2/talenta/v2/payroll/info
app.get('/v2/talenta/v2/payroll/info', authMiddleware, async (req, res) => {
  await simulateDelay();

  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'user_id is required'
    });
  }

  const employee = employees.find(emp => emp.user_id === parseInt(user_id));
  if (!employee) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Employee not found'
    });
  }

  // Get latest payroll
  const employeePayrolls = payrolls.filter(p => p.user_id === parseInt(user_id));
  const latestPayroll = employeePayrolls.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

  res.json({
    message: 'Get payroll info successfully',
    data: {
      user_id: employee.user_id,
      employee_id: employee.employee_id,
      bank_name: employee.bank_name,
      bank_account: employee.bank_account,
      npwp: employee.npwp,
      basic_salary: latestPayroll?.basic_salary || 0,
      payment_method: 'Bank Transfer'
    }
  });
});

// ============================================
// ATTENDANCE ENDPOINTS
// ============================================

// GET /v2/talenta/v2/live-attendance
app.get('/v2/talenta/v2/live-attendance', authMiddleware, async (req, res) => {
  await simulateDelay();

  const { user_id, start_date, end_date, limit = 20, offset = 0 } = req.query;

  let filtered = [...attendances];

  if (user_id) {
    filtered = filtered.filter(a => a.user_id === parseInt(user_id));
  }
  if (start_date) {
    filtered = filtered.filter(a => a.date >= start_date);
  }
  if (end_date) {
    filtered = filtered.filter(a => a.date <= end_date);
  }

  // Sort by date descending
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  const start = parseInt(offset);
  const end = start + parseInt(limit);
  const paginated = filtered.slice(start, end);

  res.json({
    message: 'Get attendance successfully',
    data: paginated,
    meta: {
      total: filtered.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }
  });
});

// ============================================
// TIME OFF ENDPOINTS
// ============================================

// GET /v2/talenta/v2/time-off
app.get('/v2/talenta/v2/time-off', authMiddleware, async (req, res) => {
  await simulateDelay();

  // Mock time-off data (empty for now)
  res.json({
    message: 'Get time-off successfully',
    data: [],
    meta: {
      total: 0,
      limit: 20,
      offset: 0
    }
  });
});

// ============================================
// HEALTH CHECK & INFO
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Mock Talenta API',
    timestamp: new Date().toISOString(),
    data_loaded: {
      employees: employees.length,
      payrolls: payrolls.length,
      attendances: attendances.length,
      departments: organization.length,
      branches: branches.length
    }
  });
});

app.get('/', (req, res) => {
  res.json({
    service: 'Mock Talenta HR API',
    version: '1.0.0',
    description: 'Mock API for HRIS middleware demo',
    endpoints: {
      health: 'GET /health',
      company: {
        branches: 'GET /v2/talenta/v2/company/:companyId/branch',
        organization: 'GET /v2/talenta/v2/company/:companyId/organization',
        grades: 'GET /v2/talenta/v2/company/:companyId/grade',
        employmentStatuses: 'GET /v2/talenta/v2/company/:companyId/employment-status',
        banks: 'GET /v2/talenta/v2/company/:companyId/bank-list'
      },
      employees: {
        list: 'GET /v2/talenta/v2/employee',
        detail: 'GET /v2/talenta/v2/employee/:userId',
        status: 'GET /v2/talenta/v2/employee/:userId/status'
      },
      payroll: {
        list: 'GET /v2/talenta/v2/payroll',
        report: 'GET /v2/talenta/v2/payroll/report',
        info: 'GET /v2/talenta/v2/payroll/info'
      },
      attendance: {
        list: 'GET /v2/talenta/v2/live-attendance'
      }
    },
    authentication: 'Bearer token required (any token accepted in demo mode)',
    note: 'Run "npm run seed" to generate sample data'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
loadData();

app.listen(PORT, () => {
  console.log(`\n🚀 Mock Talenta API running on http://localhost:${PORT}`);
  console.log(`📊 Data loaded: ${employees.length} employees, ${payrolls.length} payrolls\n`);
});
