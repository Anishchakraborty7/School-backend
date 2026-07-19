import { getPool } from '../../database/db.js';

class NotificationRepository {
  async getNotifications(userId) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return rows;
  }

  async markAsRead(id, userId) {
    const pool = getPool();
    await pool.query("UPDATE notifications SET status = 'read' WHERE id = ? AND user_id = ?", [id, userId]);
  }
}

export default new NotificationRepository();
