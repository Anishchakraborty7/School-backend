import { getPool } from '../../database/db.js';

class ClassRepository {
  async create(cls) {
    const pool = getPool();
    const query = 'INSERT INTO classes (academic_year_id, class_name, display_order, description, status) VALUES (?, ?, ?, ?, ?)';
    const [result] = await pool.query(query, [cls.academic_year_id, cls.class_name, cls.display_order || 0, cls.description || null, cls.status || 'active']);
    return result.insertId;
  }

  async findById(id) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM classes WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async findByNameAndYear(class_name, academic_year_id) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM classes WHERE class_name = ? AND academic_year_id = ?', [class_name, academic_year_id]);
    return rows[0] || null;
  }

  async update(id, data) {
    const pool = getPool();
    const keys = Object.keys(data);
    if (keys.length === 0) return 0;
    const sets = keys.map(k => `\`${k}\` = ?`).join(', ');
    const [result] = await pool.query(`UPDATE classes SET ${sets} WHERE id = ?`, [...Object.values(data), id]);
    return result.affectedRows;
  }

  async findAll(academicYearId = null) {
    const pool = getPool();
    let query = 'SELECT * FROM classes';
    const params = [];
    if (academicYearId) {
      query += ' WHERE academic_year_id = ?';
      params.push(academicYearId);
    }
    query += ' ORDER BY display_order ASC, class_name ASC';
    const [rows] = await pool.query(query, params);
    return rows;
  }

  async delete(id) {
    const pool = getPool();
    const [result] = await pool.query('DELETE FROM classes WHERE id = ?', [id]);
    return result.affectedRows;
  }
}

export default new ClassRepository();
