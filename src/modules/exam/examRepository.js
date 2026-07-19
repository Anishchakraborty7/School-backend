import { getPool } from '../../database/db.js';

class ExamRepository {
  async createExam(exam) {
    const pool = getPool();
    const query = 'INSERT INTO exams (academic_year_id, exam_type, exam_name, status) VALUES (?, ?, ?, ?)';
    const [result] = await pool.query(query, [
      exam.academic_year_id, exam.exam_type, exam.exam_name, exam.status || 'draft'
    ]);
    return result.insertId;
  }

  async findExamById(id) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM exams WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async updateExamStatus(id, status) {
    const pool = getPool();
    await pool.query('UPDATE exams SET status = ? WHERE id = ?', [status, id]);
  }

  async findAllExams(yearId) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM exams WHERE academic_year_id = ? ORDER BY created_at DESC', [yearId]);
    return rows;
  }

  async createSchedule(sch) {
    const pool = getPool();
    const query = `
      INSERT INTO exam_schedules (exam_id, subject_id, class_id, section_id, exam_date, start_time, end_time, room_number, max_marks, pass_marks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
      sch.exam_id, sch.subject_id, sch.class_id, sch.section_id, sch.exam_date,
      sch.start_time, sch.end_time, sch.room_number, sch.max_marks, sch.pass_marks
    ]);
    return result.insertId;
  }

  async findScheduleById(id) {
    const pool = getPool();
    const query = `
      SELECT es.*, e.exam_name, e.exam_type, e.status as exam_status,
             s.subject_name, s.subject_code, c.class_name, sec.section_name
      FROM exam_schedules es
      JOIN exams e ON es.exam_id = e.id
      JOIN subjects s ON es.subject_id = s.id
      JOIN classes c ON es.class_id = c.id
      JOIN sections sec ON es.section_id = sec.id
      WHERE es.id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0] || null;
  }

  async findScheduleOverlap(sch) {
    const pool = getPool();
    const query = `
      SELECT id FROM exam_schedules 
      WHERE class_id = ? AND section_id = ? AND exam_date = ? 
        AND ((start_time <= ? AND end_time >= ?) OR (start_time <= ? AND end_time >= ?))
        AND status = 'active'
    `;
    const [rows] = await pool.query(query, [
      sch.class_id, sch.section_id, sch.exam_date,
      sch.start_time, sch.start_time, sch.end_time, sch.end_time
    ]);
    return rows;
  }

  async saveMarks(marks) {
    const pool = getPool();
    const query = `
      INSERT INTO exam_marks (exam_schedule_id, student_id, marks_theory, marks_practical, marks_internal, total_marks, is_absent, remarks, entered_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        marks_theory = VALUES(marks_theory), 
        marks_practical = VALUES(marks_practical), 
        marks_internal = VALUES(marks_internal), 
        total_marks = VALUES(total_marks), 
        is_absent = VALUES(is_absent), 
        remarks = VALUES(remarks), 
        entered_by = VALUES(entered_by), 
        entered_at = CURRENT_TIMESTAMP
    `;
    await pool.query(query, [
      marks.exam_schedule_id, marks.student_id, marks.marks_theory || 0.00,
      marks.marks_practical || 0.00, marks.marks_internal || 0.00, marks.total_marks || 0.00,
      marks.is_absent || false, marks.remarks || null, marks.entered_by
    ]);
  }

  async getScheduleList(examId) {
    const pool = getPool();
    let query = `
      SELECT es.*, s.subject_name, s.subject_code, c.class_name, sec.section_name, e.exam_name
      FROM exam_schedules es
      JOIN exams e ON es.exam_id = e.id
      JOIN subjects s ON es.subject_id = s.id
      JOIN classes c ON es.class_id = c.id
      JOIN sections sec ON es.section_id = sec.id
      WHERE es.status = 'active'
    `;
    const params = [];
    if (examId !== null && examId !== undefined) {
      query += ' AND es.exam_id = ?';
      params.push(examId);
    }
    const [rows] = await pool.query(query, params);
    return rows;
  }

  async findStudentMarks(studentId, examId = null) {
    const pool = getPool();
    let query = `
      SELECT em.*, es.exam_date, es.max_marks, es.pass_marks,
             s.subject_name, s.subject_code,
             e.exam_name, e.exam_type
      FROM exam_marks em
      JOIN exam_schedules es ON em.exam_schedule_id = es.id
      JOIN exams e ON es.exam_id = e.id
      JOIN subjects s ON es.subject_id = s.id
      WHERE em.student_id = ?
    `;
    const params = [studentId];
    if (examId) {
      query += ' AND es.exam_id = ?';
      params.push(examId);
    }
    const [rows] = await pool.query(query, params);
    return rows;
  }

  async findGradingScale(percentage) {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT * FROM grading_scales WHERE ? BETWEEN min_percentage AND max_percentage LIMIT 1',
      [percentage]
    );
    return rows[0] || null;
  }

  async getGradingScales() {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM grading_scales ORDER BY min_percentage DESC');
    return rows;
  }

  async createGradingScale(scale) {
    const pool = getPool();
    const query = `
      INSERT INTO grading_scales (grade_letter, min_percentage, max_percentage, gpa_value, description)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        min_percentage = VALUES(min_percentage), 
        max_percentage = VALUES(max_percentage), 
        gpa_value = VALUES(gpa_value), 
        description = VALUES(description)
    `;
    await pool.query(query, [scale.grade_letter, scale.min_percentage, scale.max_percentage, scale.gpa_value, scale.description]);
  }

  async findGradingScaleById(id) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM grading_scales WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async updateGradingScale(id, scale) {
    const pool = getPool();
    const query = `
      UPDATE grading_scales 
      SET grade_letter = ?, min_percentage = ?, max_percentage = ?, gpa_value = ?, description = ?
      WHERE id = ?
    `;
    await pool.query(query, [scale.grade_letter, scale.min_percentage, scale.max_percentage, scale.gpa_value, scale.description, id]);
  }

  async deleteGradingScale(id) {
    const pool = getPool();
    await pool.query('DELETE FROM grading_scales WHERE id = ?', [id]);
  }

  async findMarksByScheduleId(scheduleId) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM exam_marks WHERE exam_schedule_id = ?', [scheduleId]);
    return rows;
  }

  async getTeacherIdByUserId(userId) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT id FROM teachers WHERE user_id = ? AND deleted_at IS NULL', [userId]);
    return rows[0] ? rows[0].id : null;
  }

  async isTeacherAuthorizedForSchedule(teacherId, classId, sectionId, subjectId) {
    const pool = getPool();
    
    // Check 1: Timetable mapping
    const [timetableRows] = await pool.query(
      'SELECT 1 FROM timetable WHERE teacher_id = ? AND class_id = ? AND section_id = ? AND subject_id = ? LIMIT 1',
      [teacherId, classId, sectionId, subjectId]
    );
    if (timetableRows.length > 0) return true;

    // Check 2: Junction tables mapping
    const [junctionRows] = await pool.query(
      `SELECT 1 FROM teacher_subjects ts 
       JOIN teacher_classes tc ON ts.teacher_id = tc.teacher_id 
       WHERE ts.teacher_id = ? AND ts.subject_id = ? AND tc.class_id = ? LIMIT 1`,
      [teacherId, subjectId, classId]
    );
    if (junctionRows.length > 0) return true;

    // Check 3: Class teacher mapping
    const [classTeacherRows] = await pool.query(
      'SELECT 1 FROM class_teacher WHERE teacher_id = ? AND class_id = ? AND section_id = ? LIMIT 1',
      [teacherId, classId, sectionId]
    );
    if (classTeacherRows.length > 0) return true;

    return false;
  }

  async getStudentByUserId(userId) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT id, class_id, section_id FROM students WHERE user_id = ? AND deleted_at IS NULL', [userId]);
    return rows[0] || null;
  }
}

export default new ExamRepository();
