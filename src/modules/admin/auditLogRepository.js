import { getPool } from '../../database/db.js';

class AuditLogRepository {
  async create(log) {
    const pool = getPool();
    const query = `
      INSERT INTO audit_logs (user_id, action, ip, device, browser)
      VALUES (?, ?, ?, ?, ?)
    `;
    const params = [
      log.user_id || null,
      log.action,
      log.ip || null,
      log.device || null,
      log.browser || null
    ];
    const [result] = await pool.query(query, params);
    return result.insertId;
  }

  async findByUserId(userId) {
    const pool = getPool();
    const query = 'SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC';
    const [rows] = await pool.query(query, [userId]);
    return rows;
  }

  async findAll(limit = 100) {
    const pool = getPool();
    const query = 'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?';
    const [rows] = await pool.query(query, [limit]);
    return rows;
  }
}

export default new AuditLogRepository();
