import { getPool } from '../../database/db.js';

class StudentRepository {
  async create(student) {
    const pool = getPool();
    const query = `
      INSERT INTO students (
        user_id, admission_number, roll_number, first_name, middle_name, last_name, 
        gender, date_of_birth, blood_group, email, phone, address, city, state, country, 
        pin_code, photo, aadhaar_number, admission_date, academic_year_id, class_id, 
        section_id, house_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      student.user_id || null, student.admission_number, student.roll_number,
      student.first_name, student.middle_name || null, student.last_name,
      student.gender, student.date_of_birth, student.blood_group || null,
      student.email || null, student.phone || null, student.address || null,
      student.city || null, student.state || null, student.country || null,
      student.pin_code || null, student.photo || null, student.aadhaar_number || null,
      student.admission_date, student.academic_year_id, student.class_id,
      student.section_id, student.house_id || null, student.status || 'active'
    ];
    const [result] = await pool.query(query, params);
    return result.insertId;
  }

  async findById(id) {
    const pool = getPool();
    const query = `
      SELECT s.*, 
             c.class_name, 
             sec.section_name, 
             y.year_name, 
             h.house_name, 
             h.color_code as house_color
      FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN sections sec ON s.section_id = sec.id
      JOIN academic_years y ON s.academic_year_id = y.id
      LEFT JOIN school_houses h ON s.house_id = h.id
      WHERE s.id = ? AND s.deleted_at IS NULL
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0] || null;
  }

  async findByUserId(userId) {
    const pool = getPool();
    const query = `
      SELECT s.*, 
             c.class_name, 
             sec.section_name, 
             y.year_name, 
             h.house_name, 
             h.color_code as house_color
      FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN sections sec ON s.section_id = sec.id
      JOIN academic_years y ON s.academic_year_id = y.id
      LEFT JOIN school_houses h ON s.house_id = h.id
      WHERE s.user_id = ? AND s.deleted_at IS NULL
    `;
    const [rows] = await pool.query(query, [userId]);
    return rows[0] || null;
  }

  async findByAdmissionNumber(admNum) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM students WHERE admission_number = ? AND deleted_at IS NULL', [admNum]);
    return rows[0] || null;
  }

  async findByEmail(email) {
    const pool = getPool();
    const query = `
      SELECT s.*, 
             c.class_name, 
             sec.section_name, 
             y.year_name, 
             h.house_name, 
             h.color_code as house_color
      FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN sections sec ON s.section_id = sec.id
      JOIN academic_years y ON s.academic_year_id = y.id
      LEFT JOIN school_houses h ON s.house_id = h.id
      WHERE s.email = ? AND s.deleted_at IS NULL
    `;
    const [rows] = await pool.query(query, [email]);
    return rows[0] || null;
  }

  async update(id, data) {
    const pool = getPool();
    const keys = Object.keys(data);
    if (keys.length === 0) return 0;
    const sets = keys.map(k => `\`${k}\` = ?`).join(', ');
    const [result] = await pool.query(`UPDATE students SET ${sets} WHERE id = ? AND deleted_at IS NULL`, [...Object.values(data), id]);
    return result.affectedRows;
  }

  async softDelete(id) {
    const pool = getPool();
    const [result] = await pool.query('UPDATE students SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL', [id]);
    return result.affectedRows;
  }

  async restore(id) {
    const pool = getPool();
    const [result] = await pool.query('UPDATE students SET deleted_at = NULL WHERE id = ? AND deleted_at IS NOT NULL', [id]);
    return result.affectedRows;
  }

  async existsAdmissionNumber(admNum, excludeId = null) {
    const pool = getPool();
    let query = 'SELECT id FROM students WHERE admission_number = ? AND deleted_at IS NULL';
    const params = [admNum];
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    const [rows] = await pool.query(query, params);
    return rows.length > 0;
  }

  async existsRollNumber(rollNum, classId, sectionId, yearId, excludeId = null) {
    const pool = getPool();
    let query = `
      SELECT id FROM students 
      WHERE roll_number = ? 
        AND class_id = ? 
        AND section_id = ? 
        AND academic_year_id = ? 
        AND deleted_at IS NULL
    `;
    const params = [rollNum, classId, sectionId, yearId];
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    const [rows] = await pool.query(query, params);
    return rows.length > 0;
  }

  async findAll(filters = {}) {
    const pool = getPool();
    let query = `
      SELECT s.*, c.class_name, sec.section_name, y.year_name, h.house_name
      FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN sections sec ON s.section_id = sec.id
      JOIN academic_years y ON s.academic_year_id = y.id
      LEFT JOIN school_houses h ON s.house_id = h.id
      WHERE s.deleted_at IS NULL
    `;
    const params = [];

    if (filters.class_id) {
      query += ' AND s.class_id = ?';
      params.push(filters.class_id);
    }
    if (filters.section_id) {
      query += ' AND s.section_id = ?';
      params.push(filters.section_id);
    }
    if (filters.academic_year_id) {
      query += ' AND s.academic_year_id = ?';
      params.push(filters.academic_year_id);
    }
    if (filters.status) {
      query += ' AND s.status = ?';
      params.push(filters.status);
    }
    if (filters.gender) {
      query += ' AND s.gender = ?';
      params.push(filters.gender);
    }
    if (filters.search_query) {
      query += ' AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.admission_number LIKE ? OR REPLACE(s.admission_number, \'_\', \'-\') LIKE ? OR s.email LIKE ? OR s.phone LIKE ?)';
      const sq = `%${filters.search_query}%`;
      params.push(sq, sq, sq, sq, sq, sq);
    }

    query += ' ORDER BY c.display_order ASC, sec.section_name ASC, s.roll_number ASC';
    const [rows] = await pool.query(query, params);
    return rows;
  }

  // === Guardian ===
  async addGuardian(guardian) {
    const pool = getPool();
    const query = `
      INSERT INTO guardians (
        student_id, father_name, mother_name, guardian_name, relationship, 
        occupation, phone, email, address, annual_income
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      guardian.student_id, guardian.father_name || null, guardian.mother_name || null,
      guardian.guardian_name, guardian.relationship, guardian.occupation || null,
      guardian.phone, guardian.email || null, guardian.address || null, guardian.annual_income || null
    ];
    await pool.query(query, params);
  }

  async getGuardian(studentId) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM guardians WHERE student_id = ?', [studentId]);
    return rows[0] || null;
  }

  async updateGuardian(studentId, guardianData) {
    const pool = getPool();
    const keys = Object.keys(guardianData);
    if (keys.length === 0) return 0;
    const sets = keys.map(k => `\`${k}\` = ?`).join(', ');
    const [result] = await pool.query(`UPDATE guardians SET ${sets} WHERE student_id = ?`, [...Object.values(guardianData), studentId]);
    return result.affectedRows;
  }

  // === Documents ===
  async addDocument(doc) {
    const pool = getPool();
    await pool.query(
      'INSERT INTO student_documents (student_id, document_type, document_name, file_path, file_size, file_type) VALUES (?, ?, ?, ?, ?, ?)',
      [doc.student_id, doc.document_type, doc.document_name, doc.file_path, doc.file_size, doc.file_type]
    );
  }

  async getDocuments(studentId) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM student_documents WHERE student_id = ?', [studentId]);
    return rows;
  }

  async getLatestAdmissionNumber() {
    const pool = getPool();
    const query = `
      SELECT admission_number 
      FROM students 
      WHERE admission_number LIKE 'T_ADM_%' 
      ORDER BY CAST(SUBSTRING(admission_number, 7) AS UNSIGNED) DESC 
      LIMIT 1
    `;
    const [rows] = await pool.query(query);
    return rows[0] ? rows[0].admission_number : null;
  }
}

export default new StudentRepository();
