import { getPool } from '../../database/db.js';

class SubjectRepository {
  async create(sub) {
    const pool = getPool();
    const query = 'INSERT INTO subjects (subject_name, subject_code, description, is_optional, status) VALUES (?, ?, ?, ?, ?)';
    const [result] = await pool.query(query, [sub.subject_name, sub.subject_code, sub.description || null, sub.is_optional || false, sub.status || 'active']);
    return result.insertId;
  }

  async findById(id) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM subjects WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async findByCode(code) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM subjects WHERE subject_code = ?', [code]);
    return rows[0] || null;
  }

  async update(id, data) {
    const pool = getPool();
    const keys = Object.keys(data);
    if (keys.length === 0) return 0;
    const sets = keys.map(k => `\`${k}\` = ?`).join(', ');
    const [result] = await pool.query(`UPDATE subjects SET ${sets} WHERE id = ?`, [...Object.values(data), id]);
    return result.affectedRows;
  }

  async findAll() {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM subjects ORDER BY subject_name ASC');
    return rows;
  }

  // Junction table links
  async linkClassSubject(classId, subjectId) {
    const pool = getPool();
    await pool.query('INSERT IGNORE INTO class_subjects (class_id, subject_id) VALUES (?, ?)', [classId, subjectId]);
  }

  async unlinkClassSubject(classId, subjectId) {
    const pool = getPool();
    await pool.query('DELETE FROM class_subjects WHERE class_id = ? AND subject_id = ?', [classId, subjectId]);
  }

  async findSubjectsByClass(classId) {
    const pool = getPool();
    const query = `
      SELECT s.* 
      FROM subjects s
      JOIN class_subjects cs ON s.id = cs.subject_id
      WHERE cs.class_id = ?
    `;
    const [rows] = await pool.query(query, [classId]);
    return rows;
  }
}

export default new SubjectRepository();
