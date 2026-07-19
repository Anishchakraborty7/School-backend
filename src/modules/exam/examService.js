import examRepository from './examRepository.js';
import studentRepository from '../student/studentRepository.js';
import auditLogRepository from '../admin/auditLogRepository.js';
import { getPool } from '../../database/db.js';

class ExamService {
  async createExam(examData, adminId, clientInfo = {}) {
    const examId = await examRepository.createExam(examData);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Created exam term ID ${examId} (${examData.exam_name})`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return examRepository.findExamById(examId);
  }

  async publishExam(examId, adminId, clientInfo = {}) {
    const exam = await examRepository.findExamById(examId);
    if (!exam) {
      throw new Error('Exam not found.');
    }

    await examRepository.updateExamStatus(examId, 'published');

    // Notify all students in the academic year about the scheduled exam
    const pool = getPool();
    const [students] = await pool.query('SELECT user_id FROM students WHERE academic_year_id = ? AND deleted_at IS NULL', [exam.academic_year_id]);
    for (const student of students) {
      if (student.user_id) {
        await pool.query(
          "INSERT INTO notifications (user_id, title, message, channel) VALUES (?, ?, ?, 'in_app')",
          [
            student.user_id,
            'Exam Scheduled',
            `The exam '${exam.exam_name}' has been scheduled and published.`
          ]
        );
      }
    }

    await auditLogRepository.create({
      user_id: adminId,
      action: `Published exam term ID ${examId}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: 'Exam published and notifications sent.' };
  }

  async lockExam(examId, adminId, clientInfo = {}) {
    const exam = await examRepository.findExamById(examId);
    if (!exam) {
      throw new Error('Exam not found.');
    }

    await examRepository.updateExamStatus(examId, 'completed');

    await auditLogRepository.create({
      user_id: adminId,
      action: `Completed and locked exam term ID ${examId}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: 'Exam completed and locked successfully.' };
  }

  async createSchedule(schData, adminId, clientInfo = {}) {
    const overlaps = await examRepository.findScheduleOverlap(schData);
    if (overlaps.length > 0) {
      throw new Error('Schedule Conflict: This class/section already has an exam scheduled during this date/time.');
    }

    const scheduleId = await examRepository.createSchedule(schData);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Scheduled exam subject ID ${schData.subject_id} for exam term ID ${schData.exam_id}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return examRepository.findScheduleById(scheduleId);
  }

  async enterMarks(marksList, teacherOrAdminId, clientInfo = {}) {
    if (marksList.length === 0) {
      throw new Error('No marks entries provided.');
    }

    // 1. Lock Validation check
    const schedule = await examRepository.findScheduleById(marksList[0].exam_schedule_id);
    if (!schedule) {
      throw new Error('Exam schedule not found.');
    }
    if (schedule.exam_status === 'completed') {
      throw new Error('Exam Lock: The exam has been completed and locked by administrators. Marks cannot be modified.');
    }

    // 1b. Teacher authorization validation check
    const teacherId = await examRepository.getTeacherIdByUserId(teacherOrAdminId);
    if (teacherId) {
      const isAuth = await examRepository.isTeacherAuthorizedForSchedule(teacherId, schedule.class_id, schedule.section_id, schedule.subject_id);
      if (!isAuth) {
        throw new Error('Access Denied: You are not authorized to update marks for this subject/class.');
      }
    }

    // 2. Marks validations and save
    const pool = getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      for (const entry of marksList) {
        if (entry.is_absent) {
          entry.marks_theory = 0.00;
          entry.marks_practical = 0.00;
          entry.marks_internal = 0.00;
          entry.total_marks = 0.00;
        } else {
          const total = (entry.marks_theory || 0.00) + (entry.marks_practical || 0.00) + (entry.marks_internal || 0.00);
          if (total > schedule.max_marks) {
            throw new Error(`Invalid Marks: Total marks (${total}) cannot exceed max marks of ${schedule.max_marks} for student ID ${entry.student_id}.`);
          }
          entry.total_marks = total;
        }

        await examRepository.saveMarks({
          ...entry,
          entered_by: teacherOrAdminId
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
      user_id: teacherOrAdminId,
      action: `Recorded exam marks for schedule ID ${marksList[0].exam_schedule_id}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: 'Marks updated successfully.' };
  }

  async getStudentReportData(studentId, examId = null) {
    const student = await studentRepository.findById(studentId);
    if (!student) {
      throw new Error('Student profile not found.');
    }

    const marks = await examRepository.findStudentMarks(studentId, examId);

    let totalMaxMarks = 0;
    let totalMarksObtained = 0;
    const subjectsReport = [];

    for (const m of marks) {
      const percentage = m.is_absent ? 0.00 : parseFloat(((m.total_marks / m.max_marks) * 100).toFixed(2));
      const grade = await examRepository.findGradingScale(percentage);

      totalMaxMarks += parseFloat(m.max_marks);
      totalMarksObtained += parseFloat(m.total_marks);

      subjectsReport.push({
        subject_name: m.subject_name,
        subject_code: m.subject_code,
        exam_name: m.exam_name,
        exam_type: m.exam_type,
        marks_theory: m.marks_theory,
        marks_practical: m.marks_practical,
        marks_internal: m.marks_internal,
        total_marks: m.total_marks,
        max_marks: m.max_marks,
        pass_marks: m.pass_marks,
        is_absent: m.is_absent,
        remarks: m.remarks,
        percentage,
        grade_letter: grade ? grade.grade_letter : (percentage >= 40 ? 'D' : 'Fail'),
        gpa_value: grade ? grade.gpa_value : 0.00
      });
    }

    const overallPercentage = totalMaxMarks > 0 ? parseFloat(((totalMarksObtained / totalMaxMarks) * 100).toFixed(2)) : 0.00;
    const overallGrade = await examRepository.findGradingScale(overallPercentage);

    return {
      student: {
        id: student.id,
        full_name: `${student.first_name} ${student.last_name}`,
        admission_number: student.admission_number,
        roll_number: student.roll_number,
        class_name: student.class_name,
        section_name: student.section_name,
        year_name: student.year_name
      },
      marks: subjectsReport,
      summary: {
        total_max_marks: totalMaxMarks,
        total_obtained_marks: totalMarksObtained,
        overall_percentage: overallPercentage,
        overall_grade: overallGrade ? overallGrade.grade_letter : (overallPercentage >= 40 ? 'D' : 'Fail'),
        overall_gpa: overallGrade ? overallGrade.gpa_value : 0.00
      }
    };
  }

  async getExams(yearId, user = null) {
    const exams = await examRepository.findAllExams(yearId);
    if (user && user.role_name === 'teacher') {
      const teacherId = await examRepository.getTeacherIdByUserId(user.id);
      if (teacherId) {
        const pool = getPool();
        const filtered = [];
        for (const exam of exams) {
          const [schedules] = await pool.query(
            'SELECT class_id, section_id, subject_id FROM exam_schedules WHERE exam_id = ?',
            [exam.id]
          );
          let isAuthorized = false;
          for (const s of schedules) {
            const hasAccess = await examRepository.isTeacherAuthorizedForSchedule(teacherId, s.class_id, s.section_id, s.subject_id);
            if (hasAccess) {
              isAuthorized = true;
              break;
            }
          }
          if (isAuthorized) {
            filtered.push(exam);
          }
        }
        return filtered;
      }
      return [];
    } else if (user && user.role_name === 'student') {
      const student = await examRepository.getStudentByUserId(user.id);
      if (student) {
        const pool = getPool();
        const filtered = [];
        for (const exam of exams) {
          const [schedules] = await pool.query(
            'SELECT class_id, section_id FROM exam_schedules WHERE exam_id = ?',
            [exam.id]
          );
          const hasAccess = schedules.some(s => s.class_id === student.class_id && s.section_id === student.section_id);
          if (hasAccess) {
            filtered.push(exam);
          }
        }
        return filtered;
      }
      return [];
    }
    return exams;
  }

  async getSchedules(examId, user = null) {
    const schedules = await examRepository.getScheduleList(examId);
    if (user && user.role_name === 'teacher') {
      const teacherId = await examRepository.getTeacherIdByUserId(user.id);
      if (teacherId) {
        const filtered = [];
        for (const s of schedules) {
          const isAuth = await examRepository.isTeacherAuthorizedForSchedule(teacherId, s.class_id, s.section_id, s.subject_id);
          if (isAuth) {
            filtered.push(s);
          }
        }
        return filtered;
      }
      return [];
    } else if (user && user.role_name === 'student') {
      const student = await examRepository.getStudentByUserId(user.id);
      if (student) {
        return schedules.filter(s => s.class_id === student.class_id && s.section_id === student.section_id);
      }
      return [];
    }
    return schedules;
  }

  async getScheduleById(id) {
    return examRepository.findScheduleById(id);
  }

  async createGradingScale(scale, adminId, clientInfo = {}) {
    await examRepository.createGradingScale(scale);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Created/Updated grading scale letter: ${scale.grade_letter}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: 'Grading scale configuration updated successfully.' };
  }

  async getGradingScales() {
    return examRepository.getGradingScales();
  }

  async updateGradingScale(id, scale, adminId, clientInfo = {}) {
    const existing = await examRepository.findGradingScaleById(id);
    if (!existing) {
      throw new Error('Grading scale not found.');
    }
    await examRepository.updateGradingScale(id, scale);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Updated grading scale ID ${id} (${scale.grade_letter})`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: 'Grading scale updated successfully.' };
  }

  async deleteGradingScale(id, adminId, clientInfo = {}) {
    const existing = await examRepository.findGradingScaleById(id);
    if (!existing) {
      throw new Error('Grading scale not found.');
    }
    await examRepository.deleteGradingScale(id);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Deleted grading scale ID ${id} (${existing.grade_letter})`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: 'Grading scale deleted successfully.' };
  }

  async getMarksBySchedule(scheduleId) {
    return examRepository.findMarksByScheduleId(scheduleId);
  }

  async getTeacherIdByUserId(userId) {
    return examRepository.getTeacherIdByUserId(userId);
  }

  async isTeacherAuthorizedForSchedule(teacherId, classId, sectionId, subjectId) {
    return examRepository.isTeacherAuthorizedForSchedule(teacherId, classId, sectionId, subjectId);
  }
}

export default new ExamService();
