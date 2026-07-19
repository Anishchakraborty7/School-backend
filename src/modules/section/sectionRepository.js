import { getPool } from '../../database/db.js';

class SectionRepository {
  async create(sec) {
    const pool = getPool();
    const query = 'INSERT INTO sections (class_id, section_name, capacity, room_number, status) VALUES (?, ?, ?, ?, ?)';
    const [result] = await pool.query(query, [sec.class_id, sec.section_name, sec.capacity || 40, sec.room_number || null, sec.status || 'active']);
    return result.insertId;
  }

  async findById(id) {
    const pool = getPool();
    const query = `
      SELECT s.*, c.class_name, c.academic_year_id,
             t.id as teacher_id, t.first_name as teacher_first_name, t.last_name as teacher_last_name, t.employee_id as teacher_employee_id
      FROM sections s 
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN class_teacher ct ON ct.class_id = s.class_id AND ct.section_id = s.id AND ct.academic_year_id = c.academic_year_id AND ct.status = 'active'
      LEFT JOIN teachers t ON ct.teacher_id = t.id
      WHERE s.id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0] || null;
  }

  async findByNameAndClass(section_name, class_id) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM sections WHERE section_name = ? AND class_id = ?', [section_name, class_id]);
    return rows[0] || null;
  }

  async update(id, data) {
    const pool = getPool();
    const keys = Object.keys(data);
    if (keys.length === 0) return 0;
    const sets = keys.map(k => `\`${k}\` = ?`).join(', ');
    const [result] = await pool.query(`UPDATE sections SET ${sets} WHERE id = ?`, [...Object.values(data), id]);
    return result.affectedRows;
  }

  async findAll(classId = null) {
    const pool = getPool();
    let query = `
      SELECT s.*, c.class_name, c.academic_year_id,
             t.id as teacher_id, t.first_name as teacher_first_name, t.last_name as teacher_last_name, t.employee_id as teacher_employee_id
      FROM sections s
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN class_teacher ct ON ct.class_id = s.class_id AND ct.section_id = s.id AND ct.academic_year_id = c.academic_year_id AND ct.status = 'active'
      LEFT JOIN teachers t ON ct.teacher_id = t.id
    `;
    const params = [];
    if (classId) {
      query += ' WHERE s.class_id = ?';
      params.push(classId);
    }
    query += ' ORDER BY c.display_order ASC, s.section_name ASC';
    const [rows] = await pool.query(query, params);
    return rows;
  }

  async delete(id) {
    const pool = getPool();
    const [result] = await pool.query('DELETE FROM sections WHERE id = ?', [id]);
    return result.affectedRows;
  }
}

export default new SectionRepository();
