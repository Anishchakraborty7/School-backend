import { getPool } from '../../database/db.js';

class AttendanceRepository {
  async saveStudentAttendance(attendance, conn = null) {
    const db = conn || getPool();
    const query = `
      INSERT INTO student_attendance (attendance_date, student_id, class_id, section_id, subject_id, status, remarks, taken_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE status = VALUES(status), remarks = VALUES(remarks), taken_by = VALUES(taken_by)
    `;
    const [result] = await db.query(query, [
      attendance.attendance_date, attendance.student_id, attendance.class_id,
      attendance.section_id, attendance.subject_id || null, attendance.status,
      attendance.remarks || null, attendance.taken_by
    ]);
    return result;
  }

  async isLocked(classId, sectionId, date) {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT id FROM attendance_locks WHERE class_id = ? AND section_id = ? AND attendance_date = ? AND is_locked = TRUE',
      [classId, sectionId, date]
    );
    return rows.length > 0;
  }

  async lock(classId, sectionId, date, adminId) {
    const pool = getPool();
    await pool.query(
      `INSERT INTO attendance_locks (class_id, section_id, attendance_date, is_locked, locked_by)
       VALUES (?, ?, ?, TRUE, ?)
       ON DUPLICATE KEY UPDATE is_locked = TRUE, locked_by = VALUES(locked_by)`,
      [classId, sectionId, date, adminId]
    );
  }

  async unlock(classId, sectionId, date) {
    const pool = getPool();
    await pool.query(
      'UPDATE attendance_locks SET is_locked = FALSE WHERE class_id = ? AND section_id = ? AND attendance_date = ?',
      [classId, sectionId, date]
    );
  }

  async findStudentAttendance(classId, sectionId, date) {
    const pool = getPool();
    const query = `
      SELECT sa.*, s.first_name, s.last_name, s.roll_number, u.full_name as taken_by_name
      FROM student_attendance sa
      JOIN students s ON sa.student_id = s.id
      LEFT JOIN users u ON sa.taken_by = u.id
      WHERE sa.class_id = ? AND sa.section_id = ? AND sa.attendance_date = ?
    `;
    const [rows] = await pool.query(query, [classId, sectionId, date]);
    return rows;
  }

  async saveTeacherAttendance(attendance) {
    const pool = getPool();
    const query = `
      INSERT INTO teacher_attendance (attendance_date, teacher_id, status, remarks, taken_by)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE status = VALUES(status), remarks = VALUES(remarks), taken_by = VALUES(taken_by)
    `;
    await pool.query(query, [
      attendance.attendance_date, attendance.teacher_id, attendance.status,
      attendance.remarks || null, attendance.taken_by
    ]);
  }

  async findTeacherAttendance(date) {
    const pool = getPool();
    const query = `
      SELECT ta.*, t.first_name, t.last_name, t.employee_id
      FROM teacher_attendance ta
      JOIN teachers t ON ta.teacher_id = t.id
      WHERE ta.attendance_date = ?
    `;
    const [rows] = await pool.query(query, [date]);
    return rows;
  }

  async getStudentAnalytics(studentId) {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT status, COUNT(*) as count FROM student_attendance WHERE student_id = ? GROUP BY status',
      [studentId]
    );
    return rows;
  }

  async getClassAnalytics(classId, sectionId) {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT status, COUNT(*) as count FROM student_attendance WHERE class_id = ? AND section_id = ? GROUP BY status',
      [classId, sectionId]
    );
    return rows;
  }

  async getMonthlyAnalytics(studentId, year, month) {
    const pool = getPool();
    const query = `
      SELECT status, COUNT(*) as count 
      FROM student_attendance 
      WHERE student_id = ? AND YEAR(attendance_date) = ? AND MONTH(attendance_date) = ?
      GROUP BY status
    `;
    const [rows] = await pool.query(query, [studentId, year, month]);
    return rows;
  }

  async getYearlyAnalytics(studentId, year) {
    const pool = getPool();
    const query = `
      SELECT status, COUNT(*) as count 
      FROM student_attendance 
      WHERE student_id = ? AND YEAR(attendance_date) = ?
      GROUP BY status
    `;
    const [rows] = await pool.query(query, [studentId, year]);
    return rows;
  }

  async getStudentMonthlyAttendance(year, month, classId, sectionId, search) {
    const pool = getPool();
    let query = `
      SELECT sa.*, s.roll_number, CONCAT(s.first_name, ' ', s.last_name) AS student_name, c.class_name, sec.section_name
      FROM student_attendance sa
      JOIN students s ON sa.student_id = s.id
      LEFT JOIN users u ON s.user_id = u.id
      JOIN classes c ON sa.class_id = c.id
      JOIN sections sec ON sa.section_id = sec.id
      WHERE YEAR(sa.attendance_date) = ? AND MONTH(sa.attendance_date) = ?
    `;
    const params = [year, month];

    if (classId) {
      query += ' AND sa.class_id = ?';
      params.push(classId);
    }
    if (sectionId) {
      query += ' AND sa.section_id = ?';
      params.push(sectionId);
    }
    if (search) {
      query += ' AND (CONCAT(s.first_name, \' \', s.last_name) LIKE ? OR s.roll_number LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY sa.attendance_date DESC, s.roll_number ASC';
    const [rows] = await pool.query(query, params);
    return rows;
  }

  async getTeacherMonthlyAttendance(year, month, search) {
    const pool = getPool();
    let query = `
      SELECT ta.*, t.employee_id, CONCAT(t.first_name, ' ', t.last_name) AS teacher_name
      FROM teacher_attendance ta
      JOIN teachers t ON ta.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE YEAR(ta.attendance_date) = ? AND MONTH(ta.attendance_date) = ?
    `;
    const params = [year, month];

    if (search) {
      query += ' AND (CONCAT(t.first_name, \' \', t.last_name) LIKE ? OR t.employee_id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY ta.attendance_date DESC, CONCAT(t.first_name, \' \', t.last_name) ASC';
    const [rows] = await pool.query(query, params);
    return rows;
  }

  async findStudentAttendanceById(id) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM student_attendance WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async updateStudentAttendance(id, data) {
    const pool = getPool();
    await pool.query('UPDATE student_attendance SET status = ?, remarks = ? WHERE id = ?', [data.status, data.remarks || null, id]);
  }

  async findTeacherAttendanceById(id) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM teacher_attendance WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async updateTeacherAttendance(id, data) {
    const pool = getPool();
    await pool.query('UPDATE teacher_attendance SET status = ?, remarks = ? WHERE id = ?', [data.status, data.remarks || null, id]);
  }
}

export default new AttendanceRepository();
