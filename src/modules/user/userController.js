import response from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import studentRepository from '../student/studentRepository.js';
import teacherRepository from '../teacher/teacherRepository.js';
import classTeacherRepository from '../class-teacher/classTeacherRepository.js';
import subjectRepository from '../subject/subjectRepository.js';
import { getPool } from '../../database/db.js';

export const getMe = asyncHandler(async (req, res) => {
  const user = req.user;
  const data = {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role_name,
    status: user.status,
    is_verified: user.is_verified,
    profile_image: user.profile_image,
    last_login: user.last_login,
    created_at: user.created_at
  };

  if (user.role_name === 'student') {
    const student = await studentRepository.findByUserId(user.id);
    if (student) {
      data.student_profile = {
        student_id: student.id,
        admission_number: student.admission_number,
        roll_number: student.roll_number,
        class_id: student.class_id,
        section_id: student.section_id,
        academic_year_id: student.academic_year_id,
        class_name: student.class_name,
        section_name: student.section_name,
        house_name: student.house_name,
        academic_year: student.year_name,
        photo: student.photo
      };
    }
  } else if (user.role_name === 'teacher') {
    const teacher = await teacherRepository.findByUserId(user.id);
    if (teacher) {
      const qualifications = await teacherRepository.getQualifications(teacher.id);
      const experience = await teacherRepository.getExperience(teacher.id);
      const assignedClasses = await teacherRepository.findAssignedClasses(teacher.id);
      const assignedSubjects = await teacherRepository.findAssignedSubjects(teacher.id);
      data.teacher_profile = {
        teacher_id: teacher.id,
        employee_id: teacher.employee_id,
        joining_date: teacher.joining_date,
        designation: teacher.designation,
        department: teacher.department,
        salary: teacher.salary,
        photo: teacher.photo,
        qualifications,
        experience,
        assignedClasses,
        assignedSubjects
      };
    }
  }

  return response.sendSuccess(res, 'User profile retrieved successfully', data, 200);
});

export const getDashboard = asyncHandler(async (req, res) => {
  const role = req.user.role_name;
  const pool = getPool();
  const todayDate = new Date().toISOString().split('T')[0];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDay = dayNames[new Date().getDay()];

  if (role === 'visitor') {
    return response.sendError(res, 'Access Denied: Visitors cannot access the dashboard', [
      'Your account is currently in visitor status. Please wait for an administrator to review and assign your role.'
    ], 403);
  }

  if (role === 'student') {
    const student = await studentRepository.findByUserId(req.user.id);
    if (!student) {
      const basicDashboard = {
        role: 'student',
        profile: {
          full_name: req.user.full_name,
        },
        message: 'Welcome to the School Management System. Your student profile is pending linkage by the administrator.'
      };
      return response.sendSuccess(res, 'Welcome to the Student Dashboard (Pending Profile Linkage)', basicDashboard, 200);
    }

    const classTeacher = await classTeacherRepository.findBySection(student.class_id, student.section_id, student.academic_year_id);
    
    // Today's Classes
    const [classesRows] = await pool.query(
      `SELECT t.*, p.period_name, p.start_time, p.end_time, s.subject_name
       FROM timetable t
       JOIN school_periods p ON t.period_id = p.id
       JOIN subjects s ON t.subject_id = s.id
       WHERE t.class_id = ? AND t.section_id = ? AND t.day_of_week = ? AND t.academic_year_id = ?
       ORDER BY p.start_time ASC`,
      [student.class_id, student.section_id, todayDay, student.academic_year_id]
    );

    // Homework
    const [homeworkRows] = await pool.query(
      `SELECT h.*, s.subject_name FROM homework h
       JOIN subjects s ON h.subject_id = s.id
       WHERE h.class_id = ? AND h.section_id = ? AND h.status = 'active' AND h.due_date >= ?`,
      [student.class_id, student.section_id, todayDate]
    );

    // Assignments
    const [assignmentsRows] = await pool.query(
      `SELECT a.*, s.subject_name FROM assignments a
       JOIN subjects s ON a.subject_id = s.id
       WHERE a.class_id = ? AND a.section_id = ? AND a.status = 'published' AND a.due_date >= ?`,
      [student.class_id, student.section_id, todayDate]
    );

    // Attendance rate
    const [attRows] = await pool.query(
      `SELECT status, COUNT(*) as count FROM student_attendance WHERE student_id = ? GROUP BY status`,
      [student.id]
    );
    let present = 0;
    let total = 0;
    for (const r of attRows) {
      total += r.count;
      if (r.status === 'present' || r.status === 'late' || r.status === 'medical_leave' || r.status === 'authorized_leave') {
        present += r.count;
      } else if (r.status === 'half_day') {
        present += r.count * 0.5;
      }
    }
    const attendancePercentage = total > 0 ? parseFloat(((present / total) * 100).toFixed(2)) : 100.00;

    // Upcoming Exams
    const [examsRows] = await pool.query(
      `SELECT es.*, e.exam_name, s.subject_name
       FROM exam_schedules es
       JOIN exams e ON es.exam_id = e.id
       JOIN subjects s ON es.subject_id = s.id
       WHERE es.class_id = ? AND es.section_id = ? AND es.exam_date >= ? AND es.status = 'active'
       ORDER BY es.exam_date ASC`,
      [student.class_id, student.section_id, todayDate]
    );

    // Announcements
    const [announcementsRows] = await pool.query(
      `SELECT * FROM announcements 
       WHERE visibility = 'all'
          OR (visibility = 'students' AND (target_class_id IS NULL OR target_class_id = ?) AND (target_section_id IS NULL OR target_section_id = ?))
          OR (visibility = 'class' AND target_class_id = ?)
          OR (visibility = 'section' AND target_class_id = ? AND target_section_id = ?)
       ORDER BY created_at DESC LIMIT 5`,
      [student.class_id, student.section_id, student.class_id, student.class_id, student.section_id]
    );

    const studentDashboard = {
      role: 'student',
      profile: {
        full_name: req.user.full_name,
        admission_number: student.admission_number,
        roll_number: student.roll_number,
        gender: student.gender,
        photo: student.photo
      },
      class: student.class_name,
      section: student.section_name,
      academic_year: student.year_name,
      house: student.house_name || 'None Assigned',
      class_teacher: classTeacher ? `${classTeacher.first_name} ${classTeacher.last_name}` : 'Not Assigned',
      attendance_percentage: attendancePercentage,
      today_classes: classesRows,
      active_homework: homeworkRows,
      active_assignments: assignmentsRows,
      upcoming_exams: examsRows,
      announcements: announcementsRows
    };

    return response.sendSuccess(res, 'Welcome to the Student Dashboard', studentDashboard, 200);
  }

  if (role === 'teacher') {
    const teacher = await teacherRepository.findByUserId(req.user.id);
    if (!teacher) {
      const basicDashboard = {
        role: 'teacher',
        profile: {
          full_name: req.user.full_name,
        },
        message: 'Welcome to the School Management System. Your teacher profile is pending linkage by the administrator.'
      };
      return response.sendSuccess(res, 'Welcome to the Teacher Dashboard (Pending Profile Linkage)', basicDashboard, 200);
    }

    // Today's Timetable
    const [timetableRows] = await pool.query(
      `SELECT t.*, p.period_name, p.start_time, p.end_time, s.subject_name, c.class_name, sec.section_name
       FROM timetable t
       JOIN school_periods p ON t.period_id = p.id
       JOIN subjects s ON t.subject_id = s.id
       JOIN classes c ON t.class_id = c.id
       JOIN sections sec ON t.section_id = sec.id
       WHERE t.teacher_id = ? AND t.day_of_week = ?
       ORDER BY p.start_time ASC`,
      [teacher.id, todayDay]
    );

    // Homework Pending
    const [homeworkRows] = await pool.query(
      `SELECT h.*, c.class_name, sec.section_name, s.subject_name
       FROM homework h
       JOIN classes c ON h.class_id = c.id
       JOIN sections sec ON h.section_id = sec.id
       JOIN subjects s ON h.subject_id = s.id
       WHERE h.teacher_id = ? AND h.due_date >= ? AND h.status = 'active'`,
      [teacher.id, todayDate]
    );

    // Assignments to Review
    const [assignmentsRows] = await pool.query(
      `SELECT sub.*, a.title, s.first_name, s.last_name
       FROM assignment_submissions sub
       JOIN assignments a ON sub.assignment_id = a.id
       JOIN students s ON sub.student_id = s.id
       WHERE a.teacher_id = ? AND sub.status = 'submitted'`,
      [teacher.id]
    );

    // Leave Status
    const [leaveRows] = await pool.query(
      `SELECT * FROM leave_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 5`,
      [req.user.id]
    );

    // Attendance missing classes count (e.g. today's timetable count without attendance taken)
    const attendancePendingCount = timetableRows.length; // Simplified metric

    const teacherDashboard = {
      role: 'teacher',
      profile: {
        full_name: req.user.full_name,
        employee_id: teacher.employee_id,
        designation: teacher.designation || 'Teacher',
        photo: teacher.photo
      },
      today_timetable: timetableRows,
      attendance_pending_count: attendancePendingCount,
      homework_pending: homeworkRows,
      assignments_to_review: assignmentsRows,
      leave_requests: leaveRows
    };

    return response.sendSuccess(res, 'Welcome to the Teacher Dashboard', teacherDashboard, 200);
  }

  if (role === 'admin') {
    // Today's Attendance stats
    const [attStats] = await pool.query(
      `SELECT status, COUNT(*) as count FROM student_attendance WHERE attendance_date = ? GROUP BY status`,
      [todayDate]
    );
    let present = 0;
    let absent = 0;
    for (const s of attStats) {
      if (s.status === 'present' || s.status === 'late') present += s.count;
      else if (s.status === 'absent') absent += s.count;
    }

    // Today's classes scheduled count
    const [timetableCount] = await pool.query(
      `SELECT COUNT(*) as count FROM timetable WHERE day_of_week = ?`,
      [todayDay]
    );

    // Pending Leaves
    const [leaveCount] = await pool.query(
      `SELECT COUNT(*) as count FROM leave_requests WHERE status = 'pending'`
    );

    // Upcoming Exams
    const [examsRows] = await pool.query(
      `SELECT es.*, e.exam_name, s.subject_name, c.class_name, sec.section_name
       FROM exam_schedules es
       JOIN exams e ON es.exam_id = e.id
       JOIN subjects s ON es.subject_id = s.id
       JOIN classes c ON es.class_id = c.id
       JOIN sections sec ON es.section_id = sec.id
       WHERE es.exam_date >= ? AND es.status = 'active'
       ORDER BY es.exam_date ASC LIMIT 5`,
      [todayDate]
    );

    // Today's Homework list
    const [homeworkRows] = await pool.query(
      `SELECT h.*, s.subject_name, c.class_name, sec.section_name
       FROM homework h
       JOIN subjects s ON h.subject_id = s.id
       JOIN classes c ON h.class_id = c.id
       JOIN sections sec ON h.section_id = sec.id
       WHERE h.due_date = ? LIMIT 5`,
      [todayDate]
    );

    // Announcements & Events
    const [announcementsRows] = await pool.query(
      `SELECT * FROM announcements ORDER BY created_at DESC LIMIT 5`
    );
    const [eventsRows] = await pool.query(
      `SELECT * FROM calendar_events WHERE start_date >= ? ORDER BY start_date ASC LIMIT 5`,
      [todayDate]
    );

    const adminDashboard = {
      role: 'admin',
      message: 'Welcome to the Administrator Dashboard',
      allowed_modules: ['users', 'roles', 'audit_logs', 'system_settings', 'all_academic_records'],
      today_stats: {
        attendance_present: present,
        attendance_absent: absent,
        today_classes_count: timetableCount[0].count,
        pending_leaves_count: leaveCount[0].count
      },
      upcoming_exams: examsRows,
      today_homework: homeworkRows,
      announcements: announcementsRows,
      upcoming_events: eventsRows
    };

    return response.sendSuccess(res, 'Welcome to the Admin Dashboard', adminDashboard, 200);
  }

  return response.sendError(res, 'Access Denied', ['Role not recognized.'], 403);
});

export const updateMyPhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    return response.sendError(res, 'Validation failed', ['No photo file provided'], 400);
  }

  const role = req.user.role_name;
  const userId = req.user.id;
  const pool = getPool();

  let photoPath = '';
  if (role === 'student') {
    photoPath = req.file.path;
    await pool.query('UPDATE students SET photo = ? WHERE user_id = ?', [photoPath, userId]);
  } else if (role === 'teacher') {
    photoPath = req.file.path;
    await pool.query('UPDATE teachers SET photo = ? WHERE user_id = ?', [photoPath, userId]);
  } else {
    return response.sendError(res, 'Access Denied', ['Only student or teacher profiles support photo updates.'], 400);
  }

  return response.sendSuccess(res, 'Profile photo updated successfully', { photo: photoPath }, 200);
});
