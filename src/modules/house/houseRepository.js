import { getPool } from '../../database/db.js';

class HouseRepository {
  async create(house) {
    const pool = getPool();
    const query = 'INSERT INTO school_houses (house_name, description, color_code) VALUES (?, ?, ?)';
    const [result] = await pool.query(query, [house.house_name, house.description || null, house.color_code || null]);
    return result.insertId;
  }

  async findById(id) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM school_houses WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async findByName(houseName) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM school_houses WHERE house_name = ?', [houseName]);
    return rows[0] || null;
  }

  async update(id, data) {
    const pool = getPool();
    const keys = Object.keys(data);
    if (keys.length === 0) return 0;
    const sets = keys.map(k => `\`${k}\` = ?`).join(', ');
    const [result] = await pool.query(`UPDATE school_houses SET ${sets} WHERE id = ?`, [...Object.values(data), id]);
    return result.affectedRows;
  }

  async delete(id) {
    const pool = getPool();
    const [result] = await pool.query('DELETE FROM school_houses WHERE id = ?', [id]);
    return result.affectedRows;
  }

  async findAll() {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM school_houses ORDER BY house_name ASC');
    return rows;
  }
}

export default new HouseRepository();
