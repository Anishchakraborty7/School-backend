import { getPool } from '../../database/db.js';

class AnnouncementRepository {
  async create(ann) {
    const pool = getPool();
    const query = `
      INSERT INTO announcements (title, content, author_id, visibility, target_class_id, target_section_id, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
      ann.title, ann.content, ann.author_id, ann.visibility || 'all',
      ann.target_class_id || null, ann.target_section_id || null, ann.priority || 'normal'
    ]);
    return result.insertId;
  }

  async findById(id) {
    const pool = getPool();
    const query = `
      SELECT a.*, u.full_name as author_name 
      FROM announcements a
      JOIN users u ON a.author_id = u.id
      WHERE a.id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0] || null;
  }

  async findAll(filters = {}) {
    const pool = getPool();
    let query = `
      SELECT a.*, u.full_name as author_name 
      FROM announcements a
      JOIN users u ON a.author_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.visibility === 'students') {
      query += ` AND (
        a.visibility = 'all'
        OR (a.visibility = 'students' AND (a.target_class_id = ? OR a.target_class_id IS NULL) AND (a.target_section_id = ? OR a.target_section_id IS NULL))
        OR (a.visibility = 'class' AND a.target_class_id = ?)
        OR (a.visibility = 'section' AND a.target_class_id = ? AND a.target_section_id = ?)
      )`;
      params.push(
        filters.target_class_id, filters.target_section_id,
        filters.target_class_id,
        filters.target_class_id, filters.target_section_id
      );
    } else {
      if (filters.visibility) {
        query += ' AND (a.visibility = ? OR a.visibility = \'all\')';
        params.push(filters.visibility);
      }
      if (filters.target_class_id) {
        query += ' AND (a.target_class_id = ? OR a.target_class_id IS NULL)';
        params.push(filters.target_class_id);
      }
      if (filters.target_section_id) {
        query += ' AND (a.target_section_id = ? OR a.target_section_id IS NULL)';
        params.push(filters.target_section_id);
      }
    }

    query += ' ORDER BY a.created_at DESC';
    const [rows] = await pool.query(query, params);
    return rows;
  }
}

export default new AnnouncementRepository();
