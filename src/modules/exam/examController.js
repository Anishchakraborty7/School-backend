import examService from './examService.js';
import response from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const createExam = asyncHandler(async (req, res) => {
  const { academic_year_id, exam_type, exam_name } = req.body;
  if (!academic_year_id || !exam_type || !exam_name) {
    return response.sendError(res, 'Validation failed', ['academic_year_id, exam_type, and exam_name are required.'], 400);
  }

  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await examService.createExam({
    academic_year_id: parseInt(academic_year_id, 10),
    exam_type,
    exam_name
  }, adminId, clientInfo);

  return response.sendSuccess(res, 'Exam term created successfully', result, 201);
});

export const publishExam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await examService.publishExam(parseInt(id, 10), adminId, clientInfo);
  return response.sendSuccess(res, result.message, {}, 200);
});

export const lockExam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await examService.lockExam(parseInt(id, 10), adminId, clientInfo);
  return response.sendSuccess(res, result.message, {}, 200);
});

export const createSchedule = asyncHandler(async (req, res) => {
  const { exam_id, subject_id, class_id, section_id, exam_date, start_time, end_time, room_number, max_marks, pass_marks } = req.body;
  if (
    !exam_id || !subject_id || !class_id || !section_id || !exam_date ||
    !start_time || !end_time || !room_number || !max_marks || !pass_marks
  ) {
    return response.sendError(res, 'Validation failed', ['All schedule fields are required.'], 400);
  }

  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await examService.createSchedule({
    exam_id: parseInt(exam_id, 10),
    subject_id: parseInt(subject_id, 10),
    class_id: parseInt(class_id, 10),
    section_id: parseInt(section_id, 10),
    exam_date,
    start_time,
    end_time,
    room_number,
    max_marks: parseFloat(max_marks),
    pass_marks: parseFloat(pass_marks)
  }, adminId, clientInfo);

  return response.sendSuccess(res, 'Exam scheduled successfully', result, 201);
});

export const getExams = asyncHandler(async (req, res) => {
  const { year_id } = req.query;
  const resolvedYearId = year_id ? parseInt(year_id, 10) : 1;

  const result = await examService.getExams(resolvedYearId, req.user);
  return response.sendSuccess(res, 'Exams retrieved successfully', result, 200);
});

export const getSchedules = asyncHandler(async (req, res) => {
  const { exam_id } = req.query;
  const resolvedExamId = exam_id ? parseInt(exam_id, 10) : null;

  const result = await examService.getSchedules(resolvedExamId, req.user);
  return response.sendSuccess(res, 'Exam schedules retrieved successfully', result, 200);
});

export const enterMarks = asyncHandler(async (req, res) => {
  const { records } = req.body;
  if (!records || !Array.isArray(records) || records.length === 0) {
    return response.sendError(res, 'Validation failed', ['records list is required.'], 400);
  }

  const teacherOrAdminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await examService.enterMarks(records, teacherOrAdminId, clientInfo);
  return response.sendSuccess(res, result.message, {}, 200);
});

export const getReportData = asyncHandler(async (req, res) => {
  const { student_id } = req.params;
  const { exam_id } = req.query;

  const result = await examService.getStudentReportData(
    parseInt(student_id, 10),
    exam_id ? parseInt(exam_id, 10) : null
  );

  return response.sendSuccess(res, 'Student exam report retrieved successfully', result, 200);
});

export const createGradingScale = asyncHandler(async (req, res) => {
  const { grade_letter, min_percentage, max_percentage, gpa_value, description } = req.body;
  if (!grade_letter || min_percentage === undefined || max_percentage === undefined || gpa_value === undefined) {
    return response.sendError(res, 'Validation failed', ['grade_letter, min_percentage, max_percentage, and gpa_value are required.'], 400);
  }

  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await examService.createGradingScale({
    grade_letter,
    min_percentage: parseFloat(min_percentage),
    max_percentage: parseFloat(max_percentage),
    gpa_value: parseFloat(gpa_value),
    description
  }, adminId, clientInfo);

  return response.sendSuccess(res, result.message, {}, 200);
});

export const getGradingScales = asyncHandler(async (req, res) => {
  const result = await examService.getGradingScales();
  return response.sendSuccess(res, 'Grading scales retrieved successfully', result, 200);
});

export const updateGradingScale = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { grade_letter, min_percentage, max_percentage, gpa_value, description } = req.body;
  if (!grade_letter || min_percentage === undefined || max_percentage === undefined || gpa_value === undefined) {
    return response.sendError(res, 'Validation failed', ['grade_letter, min_percentage, max_percentage, and gpa_value are required.'], 400);
  }

  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await examService.updateGradingScale(parseInt(id, 10), {
    grade_letter,
    min_percentage: parseFloat(min_percentage),
    max_percentage: parseFloat(max_percentage),
    gpa_value: parseFloat(gpa_value),
    description
  }, adminId, clientInfo);

  return response.sendSuccess(res, result.message, {}, 200);
});

export const deleteGradingScale = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await examService.deleteGradingScale(parseInt(id, 10), adminId, clientInfo);
  return response.sendSuccess(res, result.message, {}, 200);
});

export const getMarksBySchedule = asyncHandler(async (req, res) => {
  const { scheduleId } = req.params;
  const user = req.user;
  if (user && user.role_name === 'teacher') {
    const teacherId = await examService.getTeacherIdByUserId(user.id);
    if (teacherId) {
      const schedule = await examService.getScheduleById(parseInt(scheduleId, 10));
      if (!schedule) {
        return response.sendError(res, 'Not Found', ['Exam schedule not found.'], 404);
      }
      const isAuth = await examService.isTeacherAuthorizedForSchedule(teacherId, schedule.class_id, schedule.section_id, schedule.subject_id);
      if (!isAuth) {
        return response.sendError(res, 'Forbidden', ['You are not authorized to access marks for this subject/class.'], 403);
      }
    } else {
      return response.sendError(res, 'Forbidden', ['Teacher profile not found.'], 403);
    }
  }
  const result = await examService.getMarksBySchedule(parseInt(scheduleId, 10));
  return response.sendSuccess(res, 'Marks retrieved successfully', result, 200);
});
