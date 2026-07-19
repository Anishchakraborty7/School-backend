// Repository file
import { getPool } from '../../database/db.js';

class AcademicYearRepository {
  async create(year) {
    const pool = getPool();
    const query = 'INSERT INTO academic_years (year_name, start_date, end_date, is_current, status) VALUES (?, ?, ?, ?, ?)';
    const [result] = await pool.query(query, [year.year_name, year.start_date, year.end_date, year.is_current || false, year.status || 'active']);
    return result.insertId;
  }

  async findById(id) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM academic_years WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async findByName(yearName) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM academic_years WHERE year_name = ?', [yearName]);
    return rows[0] || null;
  }

  async getCurrent() {
    const pool = getPool();
    const [rows] = await pool.query("SELECT * FROM academic_years WHERE is_current = true AND status = 'active'");
    return rows[0] || null;
  }

  async unsetCurrent() {
    const pool = getPool();
    await pool.query('UPDATE academic_years SET is_current = false');
  }

  async update(id, data) {
    const pool = getPool();
    const keys = Object.keys(data);
    if (keys.length === 0) return 0;
    const sets = keys.map(k => `\`${k}\` = ?`).join(', ');
    const [result] = await pool.query(`UPDATE academic_years SET ${sets} WHERE id = ?`, [...Object.values(data), id]);
    return result.affectedRows;
  }

  async findAll() {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM academic_years ORDER BY start_date DESC');
    return rows;
  }

  async delete(id) {
    const pool = getPool();
    const [result] = await pool.query('DELETE FROM academic_years WHERE id = ?', [id]);
    return result.affectedRows;
  }
}

export default new AcademicYearRepository();
