import { getPool } from '../../database/db.js';

class RoleRepository {
  async getRoleByName(roleName) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM roles WHERE role_name = ?', [roleName]);
    return rows[0] || null;
  }

  async getRoleById(roleId) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM roles WHERE id = ?', [roleId]);
    return rows[0] || null;
  }

  async getAll() {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM roles ORDER BY id ASC');
    return rows;
  }
}

export default new RoleRepository();
