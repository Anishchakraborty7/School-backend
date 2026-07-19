import { getPool } from '../../database/db.js';

class TokenRepository {
  // === Refresh Token Management ===

  async createRefreshToken(userId, token, expiresAt) {
    const pool = getPool();
    const query = 'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)';
    const [result] = await pool.query(query, [userId, token, expiresAt]);
    return result.insertId;
  }

  async findRefreshToken(token) {
    const pool = getPool();
    const query = 'SELECT * FROM refresh_tokens WHERE token = ?';
    const [rows] = await pool.query(query, [token]);
    return rows[0] || null;
  }

  async deleteRefreshToken(token) {
    const pool = getPool();
    const query = 'DELETE FROM refresh_tokens WHERE token = ?';
    const [result] = await pool.query(query, [token]);
    return result.affectedRows;
  }

  async deleteUserRefreshTokens(userId) {
    const pool = getPool();
    const query = 'DELETE FROM refresh_tokens WHERE user_id = ?';
    const [result] = await pool.query(query, [userId]);
    return result.affectedRows;
  }

  // === Password Reset Token Management ===

  async createPasswordResetToken(userId, token, expiresAt) {
    const pool = getPool();
    const query = 'INSERT INTO password_reset_tokens (user_id, token, expires_at, used) VALUES (?, ?, ?, false)';
    const [result] = await pool.query(query, [userId, token, expiresAt]);
    return result.insertId;
  }

  async findPasswordResetToken(token) {
    const pool = getPool();
    const query = 'SELECT * FROM password_reset_tokens WHERE token = ?';
    const [rows] = await pool.query(query, [token]);
    return rows[0] || null;
  }

  async markPasswordResetTokenUsed(token) {
    const pool = getPool();
    const query = 'UPDATE password_reset_tokens SET used = true WHERE token = ?';
    const [result] = await pool.query(query, [token]);
    return result.affectedRows;
  }

  async invalidateUserResetTokens(userId) {
    const pool = getPool();
    const query = 'UPDATE password_reset_tokens SET used = true WHERE user_id = ?';
    const [result] = await pool.query(query, [userId]);
    return result.affectedRows;
  }
}

export default new TokenRepository();
