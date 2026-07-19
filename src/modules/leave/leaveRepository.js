import { getPool } from '../../database/db.js';

class LeaveRepository {
  async create(req) {
    const pool = getPool();
    const query = `
      INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, reason, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `;
    const [result] = await pool.query(query, [
      req.user_id, req.leave_type, req.start_date, req.end_date, req.reason
    ]);
    return result.insertId;
  }

  async findById(id) {
    const pool = getPool();
    const query = `
      SELECT lr.*, u.full_name, u.email, r.role_name
      FROM leave_requests lr
      JOIN users u ON lr.user_id = u.id
      JOIN roles r ON u.role_id = r.id
      WHERE lr.id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0] || null;
  }

  async findAll(filters = {}) {
    const pool = getPool();
    let query = `
      SELECT lr.*, u.full_name, u.email, r.role_name
      FROM leave_requests lr
      JOIN users u ON lr.user_id = u.id
      JOIN roles r ON u.role_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.user_id) {
      query += ' AND lr.user_id = ?';
      params.push(filters.user_id);
    }
    if (filters.status) {
      query += ' AND lr.status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY lr.created_at DESC';
    const [rows] = await pool.query(query, params);
    return rows;
  }

  async updateStatus(id, update) {
    const pool = getPool();
    await pool.query(
      'UPDATE leave_requests SET status = ?, remarks = ?, processed_by = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?',
      [update.status, update.remarks, update.processed_by, id]
    );
  }
}

export default new LeaveRepository();
