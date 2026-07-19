import { getPool } from '../../database/db.js';

class TeacherRepository {
  async create(teacher) {
    const pool = getPool();
    const query = `
      INSERT INTO teachers (
        user_id, employee_id, joining_date, first_name, middle_name, last_name, 
        gender, dob, phone, email, qualification, experience, department, 
        designation, salary, blood_group, photo, address, city, state, country, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      teacher.user_id || null, teacher.employee_id, teacher.joining_date,
      teacher.first_name, teacher.middle_name || null, teacher.last_name,
      teacher.gender, teacher.dob, teacher.phone, teacher.email,
      teacher.qualification || null, teacher.experience || null, teacher.department || null,
      teacher.designation || null, teacher.salary || null, teacher.blood_group || null,
      teacher.photo || null, teacher.address || null, teacher.city || null,
      teacher.state || null, teacher.country || null, teacher.status || 'active'
    ];
    const [result] = await pool.query(query, params);
    return result.insertId;
  }

  async findById(id) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM teachers WHERE id = ? AND deleted_at IS NULL', [id]);
    return rows[0] || null;
  }

  async findByUserId(userId) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM teachers WHERE user_id = ? AND deleted_at IS NULL', [userId]);
    return rows[0] || null;
  }

  async findByEmployeeId(empId) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM teachers WHERE employee_id = ? AND deleted_at IS NULL', [empId]);
    return rows[0] || null;
  }

  async update(id, data) {
    const pool = getPool();
    const keys = Object.keys(data);
    if (keys.length === 0) return 0;
    const sets = keys.map(k => `\`${k}\` = ?`).join(', ');
    const [result] = await pool.query(`UPDATE teachers SET ${sets} WHERE id = ? AND deleted_at IS NULL`, [...Object.values(data), id]);
    return result.affectedRows;
  }

  async softDelete(id) {
    const pool = getPool();
    const [result] = await pool.query('UPDATE teachers SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL', [id]);
    return result.affectedRows;
  }

  async restore(id) {
    const pool = getPool();
    const [result] = await pool.query('UPDATE teachers SET deleted_at = NULL WHERE id = ? AND deleted_at IS NOT NULL', [id]);
    return result.affectedRows;
  }

  async existsEmployeeId(empId, excludeId = null) {
    const pool = getPool();
    let query = 'SELECT id FROM teachers WHERE employee_id = ? AND deleted_at IS NULL';
    const params = [empId];
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    const [rows] = await pool.query(query, params);
    return rows.length > 0;
  }

  async existsEmail(email, excludeId = null) {
    const pool = getPool();
    let query = 'SELECT id FROM teachers WHERE email = ? AND deleted_at IS NULL';
    const params = [email];
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    const [rows] = await pool.query(query, params);
    return rows.length > 0;
  }

  async findByEmail(email) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM teachers WHERE email = ? AND deleted_at IS NULL', [email]);
    return rows[0] || null;
  }

  async findAll(filters = {}) {
    const pool = getPool();
    let query = 'SELECT * FROM teachers WHERE deleted_at IS NULL';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters.gender) {
      query += ' AND gender = ?';
      params.push(filters.gender);
    }
    if (filters.department) {
      query += ' AND department = ?';
      params.push(filters.department);
    }

    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(query, params);
    return rows;
  }

  // === Qualifications ===
  async addQualification(qual) {
    const pool = getPool();
    await pool.query(
      'INSERT INTO teacher_qualifications (teacher_id, degree, institution, passing_year, percentage_cgpa) VALUES (?, ?, ?, ?, ?)',
      [qual.teacher_id, qual.degree, qual.institution, qual.passing_year, qual.percentage_cgpa || null]
    );
  }

  async getQualifications(teacherId) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM teacher_qualifications WHERE teacher_id = ?', [teacherId]);
    return rows;
  }

  // === Experience ===
  async addExperience(exp) {
    const pool = getPool();
    await pool.query(
      'INSERT INTO teacher_experience (teacher_id, organization, designation, start_date, end_date) VALUES (?, ?, ?, ?, ?)',
      [exp.teacher_id, exp.organization, exp.designation, exp.start_date, exp.end_date]
    );
  }

  async getExperience(teacherId) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM teacher_experience WHERE teacher_id = ?', [teacherId]);
    return rows;
  }

  // === Documents ===
  async addDocument(doc) {
    const pool = getPool();
    await pool.query(
      'INSERT INTO teacher_documents (teacher_id, document_type, document_name, file_path, file_size, file_type) VALUES (?, ?, ?, ?, ?, ?)',
      [doc.teacher_id, doc.document_type, doc.document_name, doc.file_path, doc.file_size, doc.file_type]
    );
  }

  async getDocuments(teacherId) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM teacher_documents WHERE teacher_id = ?', [teacherId]);
    return rows;
  }

  // === Subject Teacher Assignments ===
  async assignSubject(teacherId, subjectId) {
    const pool = getPool();
    await pool.query('INSERT IGNORE INTO teacher_subjects (teacher_id, subject_id) VALUES (?, ?)', [teacherId, subjectId]);
  }

  async clearSubjects(teacherId) {
    const pool = getPool();
    await pool.query('DELETE FROM teacher_subjects WHERE teacher_id = ?', [teacherId]);
  }

  async findAssignedSubjects(teacherId) {
    const pool = getPool();
    const query = `
      SELECT s.* 
      FROM subjects s
      JOIN teacher_subjects ts ON s.id = ts.subject_id
      WHERE ts.teacher_id = ?
    `;
    const [rows] = await pool.query(query, [teacherId]);
    return rows;
  }

  // === Class Teacher Assignments ===
  async assignClass(teacherId, classId) {
    const pool = getPool();
    await pool.query('INSERT IGNORE INTO teacher_classes (teacher_id, class_id) VALUES (?, ?)', [teacherId, classId]);
  }

  async clearClasses(teacherId) {
    const pool = getPool();
    await pool.query('DELETE FROM teacher_classes WHERE teacher_id = ?', [teacherId]);
  }

  async findAssignedClasses(teacherId) {
    const pool = getPool();
    const query = `
      SELECT c.* 
      FROM classes c
      JOIN teacher_classes tc ON c.id = tc.class_id
      WHERE tc.teacher_id = ?
    `;
    const [rows] = await pool.query(query, [teacherId]);
    return rows;
  }
}

export default new TeacherRepository();
