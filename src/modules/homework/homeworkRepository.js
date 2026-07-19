import { getPool } from '../../database/db.js';

class HomeworkRepository {
  async create(hw) {
    const pool = getPool();
    const query = `
      INSERT INTO homework (academic_year_id, class_id, section_id, subject_id, teacher_id, title, description, attachment, due_date, status, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
      hw.academic_year_id, hw.class_id, hw.section_id, hw.subject_id, hw.teacher_id,
      hw.title, hw.description, hw.attachment || null, hw.due_date, hw.status || 'active', hw.priority || 'normal'
    ]);
    return result.insertId;
  }

  async findById(id) {
    const pool = getPool();
    const query = `
      SELECT h.*, s.subject_name, s.subject_code, c.class_name, sec.section_name
      FROM homework h
      JOIN subjects s ON h.subject_id = s.id
      JOIN classes c ON h.class_id = c.id
      JOIN sections sec ON h.section_id = sec.id
      WHERE h.id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0] || null;
  }

  async findAll(filters = {}) {
    const pool = getPool();
    let query = `
      SELECT h.*, s.subject_name, s.subject_code, c.class_name, sec.section_name
      FROM homework h
      JOIN subjects s ON h.subject_id = s.id
      JOIN classes c ON h.class_id = c.id
      JOIN sections sec ON h.section_id = sec.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.class_id) {
      query += ' AND h.class_id = ?';
      params.push(filters.class_id);
    }
    if (filters.section_id) {
      query += ' AND h.section_id = ?';
      params.push(filters.section_id);
    }
    if (filters.teacher_id) {
      query += ' AND h.teacher_id = ?';
      params.push(filters.teacher_id);
    }
    if (filters.academic_year_id) {
      query += ' AND h.academic_year_id = ?';
      params.push(filters.academic_year_id);
    }

    query += ' ORDER BY h.due_date ASC, h.created_at DESC';
    const [rows] = await pool.query(query, params);
    return rows;
  }

  async saveSubmission(sub) {
    const pool = getPool();
    const query = `
      INSERT INTO homework_submissions (homework_id, student_id, submission_text, file_path, file_size, file_type, status)
      VALUES (?, ?, ?, ?, ?, ?, 'submitted')
      ON DUPLICATE KEY UPDATE 
        submission_text = VALUES(submission_text), 
        file_path = VALUES(file_path), 
        file_size = VALUES(file_size), 
        file_type = VALUES(file_type), 
        submitted_at = CURRENT_TIMESTAMP, 
        status = 'submitted'
    `;
    const [result] = await pool.query(query, [
      sub.homework_id, sub.student_id, sub.submission_text || null,
      sub.file_path || null, sub.file_size || null, sub.file_type || null
    ]);
    return result;
  }

  async findSubmissionsByHomework(homeworkId) {
    const pool = getPool();
    const query = `
      SELECT hs.*, s.first_name, s.last_name, s.roll_number
      FROM homework_submissions hs
      JOIN students s ON hs.student_id = s.id
      WHERE hs.homework_id = ?
    `;
    const [rows] = await pool.query(query, [homeworkId]);
    return rows;
  }

  async findSubmissionById(id) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM homework_submissions WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async updateSubmissionReview(id, review) {
    const pool = getPool();
    await pool.query(
      'UPDATE homework_submissions SET status = ?, remarks = ?, points_score = ? WHERE id = ?',
      [review.status, review.remarks, review.points_score, id]
    );
  }
}

export default new HomeworkRepository();
