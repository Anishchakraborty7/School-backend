import { getPool } from '../../database/db.js';

class AssignmentRepository {
  async create(assign) {
    const pool = getPool();
    const query = `
      INSERT INTO assignments (academic_year_id, class_id, section_id, subject_id, teacher_id, title, description, attachment_path, max_marks, due_date, submission_deadline, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
      assign.academic_year_id, assign.class_id, assign.section_id, assign.subject_id, assign.teacher_id,
      assign.title, assign.description, assign.attachment_path || null, assign.max_marks,
      assign.due_date, assign.submission_deadline, assign.status || 'draft'
    ]);
    return result.insertId;
  }

  async findById(id) {
    const pool = getPool();
    const query = `
      SELECT a.*, s.subject_name, s.subject_code, c.class_name, sec.section_name
      FROM assignments a
      JOIN subjects s ON a.subject_id = s.id
      JOIN classes c ON a.class_id = c.id
      JOIN sections sec ON a.section_id = sec.id
      WHERE a.id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0] || null;
  }

  async findAll(filters = {}) {
    const pool = getPool();
    let query = `
      SELECT a.*, s.subject_name, s.subject_code, c.class_name, sec.section_name
      FROM assignments a
      JOIN subjects s ON a.subject_id = s.id
      JOIN classes c ON a.class_id = c.id
      JOIN sections sec ON a.section_id = sec.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.class_id) {
      query += ' AND a.class_id = ?';
      params.push(filters.class_id);
    }
    if (filters.section_id) {
      query += ' AND a.section_id = ?';
      params.push(filters.section_id);
    }
    if (filters.teacher_id) {
      query += ' AND a.teacher_id = ?';
      params.push(filters.teacher_id);
    }
    if (filters.status) {
      query += ' AND a.status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY a.due_date ASC, a.created_at DESC';
    const [rows] = await pool.query(query, params);
    return rows;
  }

  async findSubmission(assignmentId, studentId) {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT * FROM assignment_submissions WHERE assignment_id = ? AND student_id = ?',
      [assignmentId, studentId]
    );
    return rows[0] || null;
  }

  async createSubmission(sub) {
    const pool = getPool();
    const query = `
      INSERT INTO assignment_submissions (assignment_id, student_id, is_late, status, remarks, marks_obtained)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
      sub.assignment_id, sub.student_id, sub.is_late || false, sub.status || 'submitted',
      sub.remarks || null, sub.marks_obtained || null
    ]);
    return result.insertId;
  }

  async updateSubmission(id, sub) {
    const pool = getPool();
    const keys = Object.keys(sub);
    if (keys.length === 0) return;
    const sets = keys.map(k => `\`${k}\` = ?`).join(', ');
    await pool.query(`UPDATE assignment_submissions SET ${sets} WHERE id = ?`, [...Object.values(sub), id]);
  }

  async saveSubmissionFiles(submissionId, files) {
    const pool = getPool();
    for (const f of files) {
      await pool.query(
        'INSERT INTO assignment_submission_files (submission_id, file_path, file_size, file_type) VALUES (?, ?, ?, ?)',
        [submissionId, f.file_path, f.file_size, f.file_type]
      );
    }
  }

  async getSubmissionFiles(submissionId) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM assignment_submission_files WHERE submission_id = ?', [submissionId]);
    return rows;
  }

  async findSubmissionsByAssignment(assignmentId) {
    const pool = getPool();
    const query = `
      SELECT asub.*, s.first_name, s.last_name, s.roll_number
      FROM assignment_submissions asub
      JOIN students s ON asub.student_id = s.id
      WHERE asub.assignment_id = ?
    `;
    const [rows] = await pool.query(query, [assignmentId]);
    return rows;
  }

  async findSubmissionById(id) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM assignment_submissions WHERE id = ?', [id]);
    return rows[0] || null;
  }
}

export default new AssignmentRepository();
