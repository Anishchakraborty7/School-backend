import { getPool } from '../../database/db.js';

class UserRepository {
  async create(user) {
    const pool = getPool();
    const query = `
      INSERT INTO users (full_name, email, phone, password, role_id, status, is_verified, profile_image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      user.full_name,
      user.email,
      user.phone,
      user.password,
      user.role_id,
      user.status || 'pending',
      user.is_verified || false,
      user.profile_image || null
    ];
    const [result] = await pool.query(query, params);
    return result.insertId;
  }

  async findByEmail(email) {
    const pool = getPool();
    const query = `
      SELECT u.*, r.role_name 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.email = ? AND u.deleted_at IS NULL
    `;
    const [rows] = await pool.query(query, [email]);
    return rows[0] || null;
  }

  async findByPhone(phone) {
    const pool = getPool();
    const query = `
      SELECT u.*, r.role_name 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.phone = ? AND u.deleted_at IS NULL
    `;
    const [rows] = await pool.query(query, [phone]);
    return rows[0] || null;
  }

  async findById(id) {
    const pool = getPool();
    const query = `
      SELECT u.*, r.role_name 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ? AND u.deleted_at IS NULL
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0] || null;
  }

  async update(id, updateData) {
    const pool = getPool();
    const keys = Object.keys(updateData);
    if (keys.length === 0) return 0;

    const setClauses = keys.map(key => `\`${key}\` = ?`).join(', ');
    const params = [...Object.values(updateData), id];
    const query = `UPDATE users SET ${setClauses} WHERE id = ? AND deleted_at IS NULL`;
    const [result] = await pool.query(query, params);
    return result.affectedRows;
  }

  async updateLastLogin(id) {
    const pool = getPool();
    const query = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL';
    const [result] = await pool.query(query, [id]);
    return result.affectedRows;
  }

  async softDelete(id) {
    const pool = getPool();
    const query = 'UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL';
    const [result] = await pool.query(query, [id]);
    return result.affectedRows;
  }

  async findAll(filters = {}) {
    const pool = getPool();
    let query = `
      SELECT u.id, u.full_name, u.email, u.phone, u.role_id, r.role_name, 
             u.status, u.is_verified, u.profile_image, u.last_login, u.created_at, u.updated_at
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.deleted_at IS NULL
    `;
    const params = [];

    if (filters.status) {
      query += ' AND u.status = ?';
      params.push(filters.status);
    }
    if (filters.role_id) {
      query += ' AND u.role_id = ?';
      params.push(filters.role_id);
    }
    if (filters.role_name) {
      query += ' AND r.role_name = ?';
      params.push(filters.role_name);
    }

    query += ' ORDER BY u.created_at DESC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  async existsEmail(email, excludeUserId = null) {
    const pool = getPool();
    let query = 'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL';
    const params = [email];
    if (excludeUserId) {
      query += ' AND id != ?';
      params.push(excludeUserId);
    }
    const [rows] = await pool.query(query, params);
    return rows.length > 0;
  }

  async existsPhone(phone, excludeUserId = null) {
    const pool = getPool();
    let query = 'SELECT id FROM users WHERE phone = ? AND deleted_at IS NULL';
    const params = [phone];
    if (excludeUserId) {
      query += ' AND id != ?';
      params.push(excludeUserId);
    }
    const [rows] = await pool.query(query, params);
    return rows.length > 0;
  }
}

export default new UserRepository();
