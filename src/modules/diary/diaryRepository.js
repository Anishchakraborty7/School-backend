import { getPool } from '../../database/db.js';

class DiaryRepository {
  async saveTeacherDiary(diary) {
    const pool = getPool();
    const query = `
      INSERT INTO teacher_diaries (teacher_id, date, class_id, section_id, subject_id, topics_covered, homework_given, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
      diary.teacher_id, diary.date, diary.class_id, diary.section_id,
      diary.subject_id, diary.topics_covered, diary.homework_given || null, diary.remarks || null
    ]);
    return result.insertId;
  }

  async findTeacherDiaries(teacherId) {
    const pool = getPool();
    const query = `
      SELECT td.*, c.class_name, sec.section_name, s.subject_name, s.subject_code
      FROM teacher_diaries td
      JOIN classes c ON td.class_id = c.id
      JOIN sections sec ON td.section_id = sec.id
      JOIN subjects s ON td.subject_id = s.id
      WHERE td.teacher_id = ?
      ORDER BY td.date DESC, td.created_at DESC
    `;
    const [rows] = await pool.query(query, [teacherId]);
    return rows;
  }

  async saveStudentDiary(diary) {
    const pool = getPool();
    const query = `
      INSERT INTO student_diaries (student_id, date, diary_notes, parent_notes)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
      diary.student_id, diary.date, diary.diary_notes, diary.parent_notes || null
    ]);
    return result.insertId;
  }

  async findStudentDiaries(studentId) {
    const pool = getPool();
    const query = `
      SELECT * FROM student_diaries 
      WHERE student_id = ? 
      ORDER BY date DESC, created_at DESC
    `;
    const [rows] = await pool.query(query, [studentId]);
    return rows;
  }

  async findTeacherDiaryById(id) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM teacher_diaries WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async findStudentDiaryById(id) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM student_diaries WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async findAllTeacherDiaries() {
    const pool = getPool();
    const query = `
      SELECT td.*, c.class_name, sec.section_name, s.subject_name, s.subject_code, CONCAT(t.first_name, ' ', t.last_name) AS teacher_name
      FROM teacher_diaries td
      JOIN classes c ON td.class_id = c.id
      JOIN sections sec ON td.section_id = sec.id
      JOIN subjects s ON td.subject_id = s.id
      JOIN teachers t ON td.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY td.date DESC, td.created_at DESC
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  async findAllStudentDiaries() {
    const pool = getPool();
    const query = `
      SELECT sd.*, CONCAT(s.first_name, ' ', s.last_name) AS student_name, c.class_name, sec.section_name
      FROM student_diaries sd
      JOIN students s ON sd.student_id = s.id
      LEFT JOIN users u ON s.user_id = u.id
      JOIN classes c ON s.class_id = c.id
      JOIN sections sec ON s.section_id = sec.id
      ORDER BY sd.date DESC, sd.created_at DESC
    `;
    const [rows] = await pool.query(query);
    return rows;
  }
}

export default new DiaryRepository();
