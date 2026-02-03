const { faker } = require('@faker-js/faker');
const fs = require('fs');
const path = require('path');

// Configure faker for Indonesian locale
faker.locale = 'id_ID';

// Constants
const NUM_EMPLOYEES = 50;
const PAYROLL_MONTHS = 6; // 6 months of payroll history
const DEPARTMENTS = ['Engineering', 'Finance', 'HR', 'Operations', 'Marketing', 'Sales'];
const GRADES = ['L1', 'L2', 'L3', 'L4', 'L5', 'M1', 'M2', 'M3'];
const BRANCHES = [
  { id: 1, name: 'Jakarta HQ', code: 'JKT' },
  { id: 2, name: 'Surabaya', code: 'SUB' },
  { id: 3, name: 'Bandung', code: 'BDG' },
  { id: 4, name: 'Medan', code: 'MDN' }
];
const EMPLOYMENT_STATUSES = ['Permanent', 'Contract', 'Probation'];
const POSITIONS = {
  Engineering: ['Software Engineer', 'Senior Software Engineer', 'Engineering Manager', 'Tech Lead'],
  Finance: ['Accountant', 'Finance Manager', 'Financial Analyst', 'CFO'],
  HR: ['HR Officer', 'HR Manager', 'Talent Acquisition', 'HR Director'],
  Operations: ['Operations Officer', 'Operations Manager', 'COO'],
  Marketing: ['Marketing Officer', 'Marketing Manager', 'CMO', 'Content Creator'],
  Sales: ['Sales Executive', 'Sales Manager', 'Account Manager', 'Sales Director']
};

// Helper: Generate valid Indonesian NIK (16 digits)
function generateNIK() {
  // Format: PPKKSSDDMMYYKKKK
  // PP: Provinsi (31 for DKI Jakarta)
  // KK: Kabupaten/Kota
  // SS: Kecamatan
  // DDMMYY: Date of birth (DD+40 for female)
  // KKKK: Sequence
  const provinsi = faker.helpers.arrayElement(['31', '32', '33', '35', '36']);
  const kabupaten = faker.string.numeric(2);
  const kecamatan = faker.string.numeric(2);
  const date = faker.date.past({ years: 40, refDate: '2000-01-01' });
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  const sequence = faker.string.numeric(4);

  return `${provinsi}${kabupaten}${kecamatan}${day}${month}${year}${sequence}`;
}

// Helper: Generate salary based on grade
function generateSalary(grade) {
  const salaryRanges = {
    L1: [5000000, 7000000],
    L2: [7000000, 10000000],
    L3: [10000000, 15000000],
    L4: [15000000, 20000000],
    L5: [20000000, 30000000],
    M1: [25000000, 35000000],
    M2: [35000000, 50000000],
    M3: [50000000, 80000000]
  };

  const [min, max] = salaryRanges[grade] || [5000000, 10000000];
  return faker.number.int({ min, max });
}

// Helper: Calculate BPJS Kesehatan (employee portion)
function calculateBPJSKesehatan(grossSalary) {
  // 1% of gross salary, max 12,000,000
  const maxSalary = 12000000;
  const baseSalary = Math.min(grossSalary, maxSalary);
  return Math.round(baseSalary * 0.01);
}

// Helper: Calculate BPJS Ketenagakerjaan (employee portion)
function calculateBPJSKetenagakerjaan(grossSalary) {
  // JHT: 2%, max 9,559,600
  // JP: 1%, max 9,559,600
  const maxSalary = 9559600;
  const baseSalary = Math.min(grossSalary, maxSalary);
  const jht = Math.round(baseSalary * 0.02);
  const jp = Math.round(baseSalary * 0.01);
  return jht + jp;
}

// Helper: Calculate PPh 21 (simplified progressive tax)
function calculatePPh21(annualIncome) {
  // PTKP (2024): Rp 54,000,000 (single, no dependents)
  const ptkp = 54000000;
  const taxableIncome = Math.max(0, annualIncome - ptkp);

  let tax = 0;
  if (taxableIncome <= 60000000) {
    tax = taxableIncome * 0.05;
  } else if (taxableIncome <= 250000000) {
    tax = 60000000 * 0.05 + (taxableIncome - 60000000) * 0.15;
  } else if (taxableIncome <= 500000000) {
    tax = 60000000 * 0.05 + 190000000 * 0.15 + (taxableIncome - 250000000) * 0.25;
  } else {
    tax = 60000000 * 0.05 + 190000000 * 0.15 + 250000000 * 0.25 + (taxableIncome - 500000000) * 0.30;
  }

  return Math.round(tax / 12); // Monthly tax
}

// Generate employees
function generateEmployees() {
  const employees = [];

  for (let i = 0; i < NUM_EMPLOYEES; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const department = faker.helpers.arrayElement(DEPARTMENTS);
    const grade = faker.helpers.arrayElement(GRADES);
    const branch = faker.helpers.arrayElement(BRANCHES);
    const position = faker.helpers.arrayElement(POSITIONS[department]);
    const employmentStatus = faker.helpers.arrayElement(EMPLOYMENT_STATUSES);
    const hireDate = faker.date.past({ years: 5 });

    const employee = {
      user_id: 900000 + i,
      employee_id: `EMP${String(i + 1).padStart(5, '0')}`,
      nik: generateNIK(),
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`,
      email: faker.internet.email({ firstName, lastName, provider: 'company.com' }).toLowerCase(),
      phone: faker.phone.number('+62 ### #### ####'),
      date_of_birth: faker.date.birthdate({ min: 22, max: 55, mode: 'age' }).toISOString().split('T')[0],
      hire_date: hireDate.toISOString().split('T')[0],
      department: department,
      position: position,
      grade: grade,
      branch_id: branch.id,
      branch_name: branch.name,
      employment_status: employmentStatus,
      manager_id: i > 5 ? 900000 + faker.number.int({ min: 0, max: 5 }) : null,
      bank_name: faker.helpers.arrayElement(['BCA', 'Mandiri', 'BNI', 'BRI', 'CIMB Niaga']),
      bank_account: faker.finance.accountNumber(10),
      npwp: faker.string.numeric(15),
      address: faker.location.streetAddress(true),
      city: branch.name.split(' ')[0],
      postal_code: faker.location.zipCode('#####'),
      marital_status: faker.helpers.arrayElement(['Single', 'Married', 'Divorced']),
      gender: faker.person.sex(),
      created_at: hireDate.toISOString(),
      updated_at: new Date().toISOString()
    };

    employees.push(employee);
  }

  return employees;
}

// Generate payroll for an employee
function generatePayrollForEmployee(employee, year, month) {
  const basicSalary = generateSalary(employee.grade);
  const transportAllowance = faker.number.int({ min: 500000, max: 1500000 });
  const mealAllowance = faker.number.int({ min: 300000, max: 800000 });
  const overtimeHours = faker.number.int({ min: 0, max: 20 });
  const overtimeRate = Math.round(basicSalary / 173); // Standard hours per month
  const overtimePay = overtimeHours * overtimeRate * 1.5;

  const grossSalary = basicSalary + transportAllowance + mealAllowance + overtimePay;
  const bpjsKesehatan = calculateBPJSKesehatan(grossSalary);
  const bpjsKetenagakerjaan = calculateBPJSKetenagakerjaan(grossSalary);
  const annualIncome = grossSalary * 12;
  const tax = calculatePPh21(annualIncome);

  const totalDeductions = bpjsKesehatan + bpjsKetenagakerjaan + tax;
  const netSalary = grossSalary - totalDeductions;

  return {
    payroll_id: `PAY${employee.user_id}${year}${String(month).padStart(2, '0')}`,
    user_id: employee.user_id,
    employee_id: employee.employee_id,
    year: year,
    month: month,
    period: `${year}-${String(month).padStart(2, '0')}`,
    period_name: new Date(year, month - 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' }),
    basic_salary: basicSalary,
    allowances: {
      transport: transportAllowance,
      meal: mealAllowance,
      overtime: overtimePay
    },
    overtime_hours: overtimeHours,
    gross_salary: grossSalary,
    deductions: {
      bpjs_kesehatan: bpjsKesehatan,
      bpjs_ketenagakerjaan: bpjsKetenagakerjaan,
      tax: tax
    },
    total_deductions: totalDeductions,
    net_salary: netSalary,
    payment_date: new Date(year, month, 1).toISOString().split('T')[0],
    status: 'paid',
    created_at: new Date(year, month - 1, 25).toISOString()
  };
}

// Generate all payroll data
function generatePayrollData(employees) {
  const payrolls = [];
  const currentDate = new Date();

  for (const employee of employees) {
    for (let i = 0; i < PAYROLL_MONTHS; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      // Only generate if employee was hired before this period
      const hireDate = new Date(employee.hire_date);
      const periodDate = new Date(year, month - 1, 1);

      if (hireDate <= periodDate) {
        const payroll = generatePayrollForEmployee(employee, year, month);
        payrolls.push(payroll);
      }
    }
  }

  return payrolls;
}

// Generate attendance data
function generateAttendanceData(employees) {
  const attendances = [];
  const daysBack = 30;

  for (const employee of employees) {
    for (let i = 0; i < daysBack; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      // 95% attendance rate
      if (Math.random() < 0.95) {
        const checkIn = new Date(date);
        checkIn.setHours(8, faker.number.int({ min: 0, max: 30 }), 0);

        const checkOut = new Date(date);
        checkOut.setHours(17, faker.number.int({ min: 0, max: 60 }), 0);

        attendances.push({
          user_id: employee.user_id,
          employee_id: employee.employee_id,
          date: date.toISOString().split('T')[0],
          check_in: checkIn.toISOString(),
          check_out: checkOut.toISOString(),
          status: 'present',
          work_hours: 9 + faker.number.float({ min: 0, max: 2, precision: 0.25 })
        });
      }
    }
  }

  return attendances;
}

// Generate organization structure
function generateOrganization() {
  return DEPARTMENTS.map((dept, index) => ({
    id: index + 1,
    name: dept,
    parent_id: null,
    level: 1,
    head_user_id: 900000 + index,
    created_at: new Date().toISOString()
  }));
}

// Generate branches
function generateBranches() {
  return BRANCHES.map(branch => ({
    ...branch,
    address: faker.location.streetAddress(true),
    city: branch.name.split(' ')[0],
    phone: faker.phone.number('+62 21 #### ####'),
    created_at: new Date().toISOString()
  }));
}

// Main function
function generateAllData() {
  console.log('🌱 Generating mock data...');

  const employees = generateEmployees();
  console.log(`✅ Generated ${employees.length} employees`);

  const payrolls = generatePayrollData(employees);
  console.log(`✅ Generated ${payrolls.length} payroll records`);

  const attendances = generateAttendanceData(employees);
  console.log(`✅ Generated ${attendances.length} attendance records`);

  const organization = generateOrganization();
  console.log(`✅ Generated ${organization.length} departments`);

  const branches = generateBranches();
  console.log(`✅ Generated ${branches.length} branches`);

  // Save to files
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(dataDir, 'employees.json'),
    JSON.stringify(employees, null, 2)
  );

  fs.writeFileSync(
    path.join(dataDir, 'payrolls.json'),
    JSON.stringify(payrolls, null, 2)
  );

  fs.writeFileSync(
    path.join(dataDir, 'attendances.json'),
    JSON.stringify(attendances, null, 2)
  );

  fs.writeFileSync(
    path.join(dataDir, 'organization.json'),
    JSON.stringify(organization, null, 2)
  );

  fs.writeFileSync(
    path.join(dataDir, 'branches.json'),
    JSON.stringify(branches, null, 2)
  );

  console.log(`\n✨ All data saved to ${dataDir}/`);
  console.log('\n📊 Summary:');
  console.log(`   Employees: ${employees.length}`);
  console.log(`   Payrolls: ${payrolls.length}`);
  console.log(`   Attendances: ${attendances.length}`);
  console.log(`   Departments: ${organization.length}`);
  console.log(`   Branches: ${branches.length}`);
}

// Run if called directly
if (require.main === module) {
  generateAllData();
}

module.exports = { generateAllData };
