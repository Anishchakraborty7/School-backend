import { getPool } from '../../database/db.js';

class CalendarRepository {
  async createHoliday(h) {
    const pool = getPool();
    const query = `
      INSERT INTO holidays (academic_year_id, holiday_name, holiday_date, holiday_type, description)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
      h.academic_year_id, h.holiday_name, h.holiday_date, h.holiday_type, h.description || null
    ]);
    return result.insertId;
  }

  async findHolidayByDate(date, yearId) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM holidays WHERE holiday_date = ? AND academic_year_id = ?', [date, yearId]);
    return rows[0] || null;
  }

  async checkDateIsHoliday(date) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM holidays WHERE holiday_date = ?', [date]);
    return rows[0] || null;
  }

  async getHolidays(yearId) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM holidays WHERE academic_year_id = ? ORDER BY holiday_date ASC', [yearId]);
    return rows;
  }

  async createEvent(e) {
    const pool = getPool();
    const query = `
      INSERT INTO calendar_events (academic_year_id, title, description, event_type, start_date, end_date, visibility)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
      e.academic_year_id, e.title, e.description, e.event_type, e.start_date, e.end_date, e.visibility || 'all'
    ]);
    return result.insertId;
  }

  async getEvents(yearId) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM calendar_events WHERE academic_year_id = ? ORDER BY start_date ASC', [yearId]);
    return rows;
  }

  async findHolidayById(id) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM holidays WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async findEventById(id) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM calendar_events WHERE id = ?', [id]);
    return rows[0] || null;
  }
}

export default new CalendarRepository();
