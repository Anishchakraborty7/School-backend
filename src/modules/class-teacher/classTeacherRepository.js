import { getPool } from '../../database/db.js';

class ClassTeacherRepository {
  async assign(data) {
    const pool = getPool();
    const query = `
      INSERT INTO class_teacher (teacher_id, class_id, section_id, academic_year_id, status)
      VALUES (?, ?, ?, ?, 'active')
      ON DUPLICATE KEY UPDATE teacher_id = VALUES(teacher_id), status = VALUES(status)
    `;
    const [result] = await pool.query(query, [data.teacher_id, data.class_id, data.section_id, data.academic_year_id]);
    return result.insertId;
  }

  async findBySection(classId, sectionId, academicYearId) {
    const pool = getPool();
    const query = `
      SELECT ct.*, t.first_name, t.last_name, t.employee_id 
      FROM class_teacher ct
      JOIN teachers t ON ct.teacher_id = t.id
      WHERE ct.class_id = ? AND ct.section_id = ? AND ct.academic_year_id = ? AND ct.status = 'active'
    `;
    const [rows] = await pool.query(query, [classId, sectionId, academicYearId]);
    return rows[0] || null;
  }

  async findByTeacherAndYear(teacherId, academicYearId) {
    const pool = getPool();
    const query = `
      SELECT ct.*, c.class_name, s.section_name 
      FROM class_teacher ct
      JOIN classes c ON ct.class_id = c.id
      JOIN sections s ON ct.section_id = s.id
      WHERE ct.teacher_id = ? AND ct.academic_year_id = ? AND ct.status = 'active'
    `;
    const [rows] = await pool.query(query, [teacherId, academicYearId]);
    return rows[0] || null;
  }

  async removeAssignment(classId, sectionId, academicYearId) {
    const pool = getPool();
    await pool.query(
      "UPDATE class_teacher SET status = 'inactive' WHERE class_id = ? AND section_id = ? AND academic_year_id = ?",
      [classId, sectionId, academicYearId]
    );
  }

  async findTeacherResponsibilities(teacherId) {
    const pool = getPool();
    const query = `
      SELECT ct.*, c.class_name, s.section_name, y.year_name
      FROM class_teacher ct
      JOIN classes c ON ct.class_id = c.id
      JOIN sections s ON ct.section_id = s.id
      JOIN academic_years y ON ct.academic_year_id = y.id
      WHERE ct.teacher_id = ? AND ct.status = 'active'
    `;
    const [rows] = await pool.query(query, [teacherId]);
    return rows;
  }
}

export default new ClassTeacherRepository();
