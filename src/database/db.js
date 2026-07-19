import mysql from 'mysql2/promise';
import { config } from '../config/env.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pool;

export async function initializeDatabase() {
  try {
    // 1. Create a connection without a database selected to ensure the database exists
    const connection = await mysql.createConnection({
      host: config.db.host,
      user: config.db.user,
      password: config.db.password,
      port: config.db.port,
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.db.name}\`;`);
    await connection.end();

    // 2. Create the main connection pool
    pool = mysql.createPool({
      host: config.db.host,
      user: config.db.user,
      password: config.db.password,
      database: config.db.name,
      port: config.db.port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Test connection
    const conn = await pool.getConnection();
    conn.release();

    // 3. Automatically create tables from schema.sql if they don't exist
    await bootstrapTables();
    
    // 4. Verify relationships (foreign keys)
    await verifyRelationships();

    console.log('✔ Academic Module Ready');
    console.log('✔ Database Ready');
  } catch (error) {
    console.error('Database connection or initialization failed:', error.message);
    throw error;
  }
}

async function verifyRelationships() {
  const pool = getPool();
  const [rows] = await pool.query(`
    SELECT CONSTRAINT_NAME 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME IS NOT NULL
  `, [config.db.name]);
  
  if (rows.length === 0) {
    throw new Error('Verification failed: No foreign keys detected.');
  }
  console.log('✔ Relationships Verified');
}

async function bootstrapTables() {
  try {
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Use multipleStatements: true for bootstrapping tables
    const bootstrapConnection = await mysql.createConnection({
      host: config.db.host,
      user: config.db.user,
      password: config.db.password,
      database: config.db.name,
      port: config.db.port,
      multipleStatements: true
    });

    await bootstrapConnection.query(schemaSql);
    await bootstrapConnection.end();

    // 4. Seed default roles
    await seedDefaultRoles();

    // 5. Seed default admin
    await seedDefaultAdmin();

    // 6. Seed academic default configurations
    await seedAcademicDefaults();

  } catch (error) {
    console.error('Error bootstrapping tables:', error);
    throw error;
  }
}

async function seedDefaultRoles() {
  const roles = [
    { name: 'visitor', desc: 'Default role for newly registered accounts' },
    { name: 'student', desc: 'Student role for school management access' },
    { name: 'teacher', desc: 'Teacher role for academic instruction and grading' },
    { name: 'admin', desc: 'Full school ERP administrator' }
  ];

  for (const role of roles) {
    const [rows] = await pool.query('SELECT id FROM roles WHERE role_name = ?', [role.name]);
    if (rows.length === 0) {
      await pool.query('INSERT INTO roles (role_name, description) VALUES (?, ?)', [role.name, role.desc]);
    }
  }
}

async function seedDefaultAdmin() {
  const [rows] = await pool.query('SELECT id FROM users LIMIT 1');
  if (rows.length === 0) {
    const [roleRows] = await pool.query('SELECT id FROM roles WHERE role_name = ?', ['admin']);
    if (roleRows.length > 0) {
      const adminRoleId = roleRows[0].id;
      const hashedPassword = await bcrypt.hash('AdminPassword123!', 12);
      await pool.query(
        `INSERT INTO users (full_name, email, phone, password, role_id, status, is_verified) 
         VALUES (?, ?, ?, ?, ?, 'active', true)`,
        ['System Administrator', 'admin@school.com', '1234567890', hashedPassword, adminRoleId]
      );
    }
  }
}

async function seedAcademicDefaults() {
  // 1. Seed Current Academic Year
  let yearId;
  const [yearRows] = await pool.query("SELECT id FROM academic_years WHERE year_name = '2026-2027'");
  if (yearRows.length === 0) {
    const [result] = await pool.query(
      `INSERT INTO academic_years (year_name, start_date, end_date, is_current, status) 
       VALUES ('2026-2027', '2026-06-01', '2027-04-30', true, 'active')`
    );
    yearId = result.insertId;
  } else {
    yearId = yearRows[0].id;
  }

  // 2. Seed Default Classes (Nursery through Class 12)
  const defaultClasses = [
    'Nursery', 'LKG', 'UKG', 
    'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'
  ];

  for (let i = 0; i < defaultClasses.length; i++) {
    const className = defaultClasses[i];
    let classId;
    const [classRows] = await pool.query('SELECT id FROM classes WHERE academic_year_id = ? AND class_name = ?', [yearId, className]);
    if (classRows.length === 0) {
      const [result] = await pool.query(
        'INSERT INTO classes (academic_year_id, class_name, display_order) VALUES (?, ?, ?)',
        [yearId, className, i + 1]
      );
      classId = result.insertId;
    } else {
      classId = classRows[0].id;
    }

    // Seed default sections A, B, C for this class
    const sections = ['A', 'B', 'C'];
    for (const sectionName of sections) {
      const [secRows] = await pool.query('SELECT id FROM sections WHERE class_id = ? AND section_name = ?', [classId, sectionName]);
      if (secRows.length === 0) {
        await pool.query(
          'INSERT INTO sections (class_id, section_name, capacity) VALUES (?, ?, 40)',
          [classId, sectionName]
        );
      }
    }
  }

  // 3. Seed Default Subjects
  const defaultSubjects = [
    { name: 'English', code: 'ENG' },
    { name: 'Math', code: 'MTH' },
    { name: 'Science', code: 'SCI' },
    { name: 'Computer', code: 'CMP' },
    { name: 'Hindi', code: 'HND' },
    { name: 'Geography', code: 'GEO' },
    { name: 'History', code: 'HST' },
    { name: 'EVS', code: 'EVS' }
  ];

  for (const subject of defaultSubjects) {
    const [subRows] = await pool.query('SELECT id FROM subjects WHERE subject_code = ?', [subject.code]);
    if (subRows.length === 0) {
      await pool.query(
        'INSERT INTO subjects (subject_name, subject_code) VALUES (?, ?)',
        [subject.name, subject.code]
      );
    }
  }

  // 4. Seed Default Grading Scales
  const defaultGrades = [
    { letter: 'A+', min: 90.00, max: 100.00, gpa: 4.00, desc: 'Outstanding' },
    { letter: 'A', min: 80.00, max: 89.99, gpa: 3.50, desc: 'Excellent' },
    { letter: 'B+', min: 70.00, max: 79.99, gpa: 3.00, desc: 'Very Good' },
    { letter: 'B', min: 60.00, max: 69.99, gpa: 2.50, desc: 'Good' },
    { letter: 'C', min: 50.00, max: 59.99, gpa: 2.00, desc: 'Satisfactory' },
    { letter: 'D', min: 40.00, max: 49.99, gpa: 1.00, desc: 'Passing' },
    { letter: 'Fail', min: 0.00, max: 39.99, gpa: 0.00, desc: 'Fail' }
  ];
  for (const grade of defaultGrades) {
    const [gradeRows] = await pool.query('SELECT id FROM grading_scales WHERE grade_letter = ?', [grade.letter]);
    if (gradeRows.length === 0) {
      await pool.query(
        'INSERT INTO grading_scales (grade_letter, min_percentage, max_percentage, gpa_value, description) VALUES (?, ?, ?, ?, ?)',
        [grade.letter, grade.min, grade.max, grade.gpa, grade.desc]
      );
    }
  }

  // 5. Seed Default School Periods
  const defaultPeriods = [
    { name: 'Period 1', start: '08:30:00', end: '09:15:00', lunch: false },
    { name: 'Period 2', start: '09:15:00', end: '10:00:00', lunch: false },
    { name: 'Period 3', start: '10:00:00', end: '10:45:00', lunch: false },
    { name: 'Recess', start: '10:45:00', end: '11:30:00', lunch: true },
    { name: 'Period 4', start: '11:30:00', end: '12:15:00', lunch: false },
    { name: 'Period 5', start: '12:15:00', end: '13:00:00', lunch: false },
    { name: 'Period 6', start: '13:00:00', end: '13:45:00', lunch: false }
  ];
  for (const period of defaultPeriods) {
    const [periodRows] = await pool.query('SELECT id FROM school_periods WHERE academic_year_id = ? AND period_name = ?', [yearId, period.name]);
    if (periodRows.length === 0) {
      await pool.query(
        'INSERT INTO school_periods (academic_year_id, period_name, start_time, end_time, is_lunch_break) VALUES (?, ?, ?, ?, ?)',
        [yearId, period.name, period.start, period.end, period.lunch]
      );
    }
  }
}

export function getPool() {
  if (!pool) {
    throw new Error('Database pool has not been initialized. Call initializeDatabase() first.');
  }
  return pool;
}
