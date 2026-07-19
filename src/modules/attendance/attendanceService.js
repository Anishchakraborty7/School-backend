import attendanceRepository from './attendanceRepository.js';
import auditLogRepository from '../admin/auditLogRepository.js';
import { getPool } from '../../database/db.js';

class AttendanceService {
  async takeStudentAttendance(records, classId, sectionId, date, user, clientInfo = {}) {
    const isLocked = await attendanceRepository.isLocked(classId, sectionId, date);
    if (isLocked) {
      throw new Error('Attendance for this date, class, and section is locked by an administrator.');
    }

    const pool = getPool();

    // Block teachers if attendance has already been completed today
    if (user.role_name === 'teacher') {
      const [existing] = await pool.query(
        'SELECT id FROM student_attendance WHERE class_id = ? AND section_id = ? AND attendance_date = ? LIMIT 1',
        [classId, sectionId, date]
      );
      if (existing.length > 0) {
        throw new Error('Attendance has already been recorded for this class and section today. Only administrators can modify it.');
      }
    }

    const today = new Date().toISOString().split('T')[0];
    if (user.role_name === 'teacher' && date !== today) {
      throw new Error('Teachers can only submit or edit same-day attendance.');
    }

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      for (const rec of records) {
        await attendanceRepository.saveStudentAttendance({
          attendance_date: date,
          student_id: rec.student_id,
          class_id: classId,
          section_id: sectionId,
          subject_id: rec.subject_id || null,
          status: rec.status,
          remarks: rec.remarks || null,
          taken_by: user.id
        }, conn);
      }

      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }

    await auditLogRepository.create({
      user_id: user.id,
      action: `Took student attendance for class ID ${classId}, section ID ${sectionId} on ${date}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: 'Attendance recorded successfully.' };
  }

  async lockAttendance(classId, sectionId, date, adminId, clientInfo = {}) {
    await attendanceRepository.lock(classId, sectionId, date, adminId);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Locked attendance for class ID ${classId}, section ID ${sectionId} on ${date}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: 'Attendance locked successfully.' };
  }

  async unlockAttendance(classId, sectionId, date, adminId, clientInfo = {}) {
    await attendanceRepository.unlock(classId, sectionId, date);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Unlocked attendance for class ID ${classId}, section ID ${sectionId} on ${date}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: 'Attendance unlocked successfully.' };
  }

  async getStudentAttendance(classId, sectionId, date) {
    const records = await attendanceRepository.findStudentAttendance(classId, sectionId, date);
    const isLocked = await attendanceRepository.isLocked(classId, sectionId, date);
    return {
      isLocked,
      records
    };
  }

  async getAttendanceAnalytics(studentId, year, month) {
    const records = month 
      ? await attendanceRepository.getMonthlyAnalytics(studentId, year, month)
      : await attendanceRepository.getYearlyAnalytics(studentId, year);

    let present = 0;
    let absent = 0;
    let late = 0;
    let halfDay = 0;
    let medical = 0;
    let authorized = 0;
    let unauthorized = 0;

    for (const r of records) {
      if (r.status === 'present') present += r.count;
      else if (r.status === 'absent') absent += r.count;
      else if (r.status === 'late') late += r.count;
      else if (r.status === 'half_day') halfDay += r.count;
      else if (r.status === 'medical_leave') medical += r.count;
      else if (r.status === 'authorized_leave') authorized += r.count;
      else if (r.status === 'unauthorized_leave') unauthorized += r.count;
    }

    const total = present + absent + late + halfDay + medical + authorized + unauthorized;
    const presentTotal = present + late + (halfDay * 0.5) + medical + authorized; // half days are 0.5 attendance
    const attendancePercentage = total > 0 ? parseFloat(((presentTotal / total) * 100).toFixed(2)) : 0.00;

    return {
      total_days: total,
      attendance_percentage: attendancePercentage,
      present_count: present,
      absent_count: absent,
      late_count: late,
      half_day_count: halfDay,
      medical_leave_count: medical,
      authorized_leave_count: authorized,
      unauthorized_leave_count: unauthorized
    };
  }

  async takeBulkTeacherAttendance(records, date, adminId, clientInfo = {}) {
    const pool = getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const rec of records) {
        await conn.query(`
          INSERT INTO teacher_attendance (teacher_id, attendance_date, status, remarks, taken_by)
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE status = VALUES(status), remarks = VALUES(remarks), taken_by = VALUES(taken_by)
        `, [rec.teacher_id, date, rec.status, rec.remarks || null, adminId]);
      }
      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }

    await auditLogRepository.create({
      user_id: adminId,
      action: `Recorded bulk teacher attendance on ${date}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: 'Teacher attendance recorded successfully.' };
  }

  async takeTeacherAttendance(attendance, adminId, clientInfo = {}) {
    await attendanceRepository.saveTeacherAttendance({
      ...attendance,
      taken_by: adminId
    });

    await auditLogRepository.create({
      user_id: adminId,
      action: `Recorded teacher attendance for teacher ID ${attendance.teacher_id} on ${attendance.attendance_date}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: 'Teacher attendance recorded successfully.' };
  }

  async getTeacherAttendance(date) {
    return attendanceRepository.findTeacherAttendance(date);
  }

  async getStudentMonthlyAttendance(year, month, classId, sectionId, search) {
    return attendanceRepository.getStudentMonthlyAttendance(year, month, classId, sectionId, search);
  }

  async getTeacherMonthlyAttendance(year, month, search) {
    return attendanceRepository.getTeacherMonthlyAttendance(year, month, search);
  }

  async patchStudentAttendance(id, status, remarks, adminId) {
    const record = await attendanceRepository.findStudentAttendanceById(id);
    if (!record) {
      throw new Error('Attendance record not found.');
    }
    await attendanceRepository.updateStudentAttendance(id, { status, remarks });
    return { id, status, remarks };
  }

  async patchTeacherAttendance(id, status, remarks, adminId) {
    const record = await attendanceRepository.findTeacherAttendanceById(id);
    if (!record) {
      throw new Error('Attendance record not found.');
    }
    await attendanceRepository.updateTeacherAttendance(id, { status, remarks });
    return { id, status, remarks };
  }
}

export default new AttendanceService();
