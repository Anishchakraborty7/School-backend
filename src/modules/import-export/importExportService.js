import studentRepository from '../student/studentRepository.js';
import teacherRepository from '../teacher/teacherRepository.js';
import auditLogRepository from '../admin/auditLogRepository.js';
import { getPool } from '../../database/db.js';

class ImportExportService {
  async importStudents(csvText, adminId, clientInfo = {}) {
    const lines = csvText.split(/\r?\n/);
    if (lines.length <= 1) {
      throw new Error('CSV file is empty or only contains headers.');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const idx = (name) => headers.indexOf(name);
    
    const required = ['admission_number', 'roll_number', 'first_name', 'last_name', 'gender', 'date_of_birth', 'admission_date', 'academic_year_id', 'class_id', 'section_id'];
    for (const req of required) {
      if (idx(req) === -1) {
        throw new Error(`Missing required CSV header: ${req}`);
      }
    }

    const pool = getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
        const getVal = (colName) => cols[idx(colName)] || null;

        const student = {
          admission_number: getVal('admission_number'),
          roll_number: parseInt(getVal('roll_number'), 10),
          first_name: getVal('first_name'),
          last_name: getVal('last_name'),
          gender: getVal('gender'),
          date_of_birth: getVal('date_of_birth'),
          admission_date: getVal('admission_date'),
          academic_year_id: parseInt(getVal('academic_year_id'), 10),
          class_id: parseInt(getVal('class_id'), 10),
          section_id: parseInt(getVal('section_id'), 10),
          phone: getVal('phone'),
          email: getVal('email'),
          address: getVal('address'),
          city: getVal('city'),
          state: getVal('state'),
          country: getVal('country'),
          pin_code: getVal('pin_code'),
          aadhaar_number: getVal('aadhaar_number')
        };

        const [admCheck] = await conn.query('SELECT id FROM students WHERE admission_number = ? AND deleted_at IS NULL', [student.admission_number]);
        if (admCheck.length > 0) {
          throw new Error(`Line ${i + 1}: Admission number '${student.admission_number}' is already registered.`);
        }

        const [rollCheck] = await conn.query(
          'SELECT id FROM students WHERE roll_number = ? AND class_id = ? AND section_id = ? AND academic_year_id = ? AND deleted_at IS NULL',
          [student.roll_number, student.class_id, student.section_id, student.academic_year_id]
        );
        if (rollCheck.length > 0) {
          throw new Error(`Line ${i + 1}: Roll number '${student.roll_number}' is already taken in Class ${student.class_id} Section ${student.section_id}.`);
        }

        await conn.query(`
          INSERT INTO students (
            admission_number, roll_number, first_name, last_name, gender, date_of_birth,
            admission_date, academic_year_id, class_id, section_id, phone, email,
            address, city, state, country, pin_code, aadhaar_number, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
        `, [
          student.admission_number, student.roll_number, student.first_name, student.last_name, student.gender, student.date_of_birth,
          student.admission_date, student.academic_year_id, student.class_id, student.section_id, student.phone, student.email,
          student.address, student.city, student.state, student.country, student.pin_code, student.aadhaar_number
        ]);
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    await auditLogRepository.create({
      user_id: adminId,
      action: `Bulk imported students via CSV (${lines.length - 1} records)`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: 'Students imported successfully.' };
  }

  async importTeachers(csvText, adminId, clientInfo = {}) {
    const lines = csvText.split(/\r?\n/);
    if (lines.length <= 1) {
      throw new Error('CSV file is empty.');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const idx = (name) => headers.indexOf(name);
    
    const required = ['employee_id', 'joining_date', 'first_name', 'last_name', 'gender', 'dob', 'phone', 'email'];
    for (const req of required) {
      if (idx(req) === -1) {
        throw new Error(`Missing required CSV header: ${req}`);
      }
    }

    const pool = getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
        const getVal = (colName) => cols[idx(colName)] || null;

        const teacher = {
          employee_id: getVal('employee_id'),
          joining_date: getVal('joining_date'),
          first_name: getVal('first_name'),
          last_name: getVal('last_name'),
          gender: getVal('gender'),
          dob: getVal('dob'),
          phone: getVal('phone'),
          email: getVal('email'),
          qualification: getVal('qualification'),
          experience: getVal('experience'),
          department: getVal('department'),
          designation: getVal('designation'),
          salary: getVal('salary') ? parseFloat(getVal('salary')) : null
        };

        const [empCheck] = await conn.query('SELECT id FROM teachers WHERE employee_id = ? AND deleted_at IS NULL', [teacher.employee_id]);
        if (empCheck.length > 0) {
          throw new Error(`Line ${i + 1}: Employee ID '${teacher.employee_id}' is already registered.`);
        }

        const [emailCheck] = await conn.query('SELECT id FROM teachers WHERE email = ? AND deleted_at IS NULL', [teacher.email]);
        if (emailCheck.length > 0) {
          throw new Error(`Line ${i + 1}: Email '${teacher.email}' is already registered.`);
        }

        await conn.query(`
          INSERT INTO teachers (
            employee_id, joining_date, first_name, last_name, gender, dob, phone, email,
            qualification, experience, department, designation, salary, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
        `, [
          teacher.employee_id, teacher.joining_date, teacher.first_name, teacher.last_name, teacher.gender, teacher.dob, teacher.phone, teacher.email,
          teacher.qualification, teacher.experience, teacher.department, teacher.designation, teacher.salary
        ]);
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    await auditLogRepository.create({
      user_id: adminId,
      action: `Bulk imported teachers via CSV (${lines.length - 1} records)`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: 'Teachers imported successfully.' };
  }

  async exportStudents() {
    const students = await studentRepository.findAll();
    const headers = ['admission_number', 'roll_number', 'first_name', 'last_name', 'gender', 'date_of_birth', 'email', 'phone', 'class_name', 'section_name', 'house_name', 'status'];
    
    let csv = headers.join(',') + '\n';
    for (const s of students) {
      const row = [
        s.admission_number, s.roll_number, s.first_name, s.last_name, s.gender, s.date_of_birth, s.email || '', s.phone || '', s.class_name, s.section_name, s.house_name || '', s.status
      ];
      csv += row.map(val => `"${val}"`).join(',') + '\n';
    }
    return csv;
  }

  async exportTeachers() {
    const teachers = await teacherRepository.findAll();
    const headers = ['employee_id', 'first_name', 'last_name', 'gender', 'joining_date', 'email', 'phone', 'designation', 'department', 'salary', 'status'];
    
    let csv = headers.join(',') + '\n';
    for (const t of teachers) {
      const row = [
        t.employee_id, t.first_name, t.last_name, t.gender, t.joining_date, t.email, t.phone, t.designation || '', t.department || '', t.salary || '', t.status
      ];
      csv += row.map(val => `"${val}"`).join(',') + '\n';
    }
    return csv;
  }
}

export default new ImportExportService();
