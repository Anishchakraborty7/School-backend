import { getPool } from '../../database/db.js';

class TimetableRepository {
  async createPeriod(period) {
    const pool = getPool();
    const query = `
      INSERT INTO school_periods (academic_year_id, period_name, start_time, end_time, is_lunch_break)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
      period.academic_year_id, period.period_name, period.start_time, period.end_time, period.is_lunch_break || false
    ]);
    return result.insertId;
  }

  async getPeriods(yearId) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM school_periods WHERE academic_year_id = ? ORDER BY start_time ASC', [yearId]);
    return rows;
  }

  async findPeriodById(id) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM school_periods WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async createEntry(entry) {
    const pool = getPool();
    const query = `
      INSERT INTO timetable (academic_year_id, class_id, section_id, period_id, subject_id, teacher_id, room_number, day_of_week)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
      entry.academic_year_id, entry.class_id, entry.section_id, entry.period_id,
      entry.subject_id, entry.teacher_id, entry.room_number, entry.day_of_week
    ]);
    return result.insertId;
  }

  async findEntry(academicYearId, filters = {}) {
    const pool = getPool();
    let query = 'SELECT * FROM timetable WHERE academic_year_id = ?';
    const params = [academicYearId];

    if (filters.teacher_id) {
      query += ' AND teacher_id = ?';
      params.push(filters.teacher_id);
    }
    if (filters.room_number) {
      query += ' AND room_number = ?';
      params.push(filters.room_number);
    }
    if (filters.class_id && filters.section_id) {
      query += ' AND class_id = ? AND section_id = ?';
      params.push(filters.class_id, filters.section_id);
    }
    if (filters.day_of_week) {
      query += ' AND day_of_week = ?';
      params.push(filters.day_of_week);
    }
    if (filters.period_id) {
      query += ' AND period_id = ?';
      params.push(filters.period_id);
    }

    const [rows] = await pool.query(query, params);
    return rows;
  }

  async findTimetableForSection(classId, sectionId, yearId) {
    const pool = getPool();
    const query = `
      SELECT t.*, p.period_name, p.start_time, p.end_time, p.is_lunch_break,
             s.subject_name, s.subject_code,
             tc.first_name as teacher_first, tc.last_name as teacher_last
      FROM timetable t
      JOIN school_periods p ON t.period_id = p.id
      JOIN subjects s ON t.subject_id = s.id
      JOIN teachers tc ON t.teacher_id = tc.id
      WHERE t.class_id = ? AND t.section_id = ? AND t.academic_year_id = ?
      ORDER BY FIELD(t.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), p.start_time ASC
    `;
    const [rows] = await pool.query(query, [classId, sectionId, yearId]);
    return rows;
  }

  async findTimetableForTeacher(teacherId, yearId) {
    const pool = getPool();
    const query = `
      SELECT t.*, p.period_name, p.start_time, p.end_time, p.is_lunch_break,
             s.subject_name, s.subject_code,
             c.class_name, sec.section_name
      FROM timetable t
      JOIN school_periods p ON t.period_id = p.id
      JOIN subjects s ON t.subject_id = s.id
      JOIN classes c ON t.class_id = c.id
      JOIN sections sec ON t.section_id = sec.id
      WHERE t.teacher_id = ? AND t.academic_year_id = ?
      ORDER BY FIELD(t.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), p.start_time ASC
    `;
    const [rows] = await pool.query(query, [teacherId, yearId]);
    return rows;
  }

  async findEntryById(id) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM timetable WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async deleteEntry(id) {
    const pool = getPool();
    const [result] = await pool.query('DELETE FROM timetable WHERE id = ?', [id]);
    return result.affectedRows;
  }

  async updateEntry(id, data) {
    const pool = getPool();
    const keys = Object.keys(data);
    if (keys.length === 0) return 0;
    const sets = keys.map(k => `\`${k}\` = ?`).join(', ');
    const [result] = await pool.query(`UPDATE timetable SET ${sets} WHERE id = ?`, [...Object.values(data), id]);
    return result.affectedRows;
  }

  async deletePeriod(id) {
    const pool = getPool();
    const [result] = await pool.query('DELETE FROM school_periods WHERE id = ?', [id]);
    return result.affectedRows;
  }

  async updatePeriod(id, data) {
    const pool = getPool();
    const keys = Object.keys(data);
    if (keys.length === 0) return 0;
    const sets = keys.map(k => `\`${k}\` = ?`).join(', ');
    const [result] = await pool.query(`UPDATE school_periods SET ${sets} WHERE id = ?`, [...Object.values(data), id]);
    return result.affectedRows;
  }
}

export default new TimetableRepository();
