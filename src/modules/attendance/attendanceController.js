import attendanceService from './attendanceService.js';
import response from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const takeStudentAttendance = asyncHandler(async (req, res) => {
  const { records, class_id, section_id, date } = req.body;
  if (!records || !class_id || !section_id || !date) {
    return response.sendError(res, 'Validation failed', ['records array, class_id, section_id, and date are required.'], 400);
  }

  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await attendanceService.takeStudentAttendance(
    records,
    parseInt(class_id, 10),
    parseInt(section_id, 10),
    date,
    req.user,
    clientInfo
  );

  return response.sendSuccess(res, result.message, {}, 200);
});

export const getStudentAttendance = asyncHandler(async (req, res) => {
  const { class_id, section_id, date } = req.query;
  if (!class_id || !section_id || !date) {
    return response.sendError(res, 'Validation failed', ['class_id, section_id, and date parameters are required.'], 400);
  }

  const result = await attendanceService.getStudentAttendance(
    parseInt(class_id, 10),
    parseInt(section_id, 10),
    date
  );

  return response.sendSuccess(res, 'Student attendance retrieved successfully', result, 200);
});

export const lockAttendance = asyncHandler(async (req, res) => {
  const { class_id, section_id, date } = req.body;
  if (!class_id || !section_id || !date) {
    return response.sendError(res, 'Validation failed', ['class_id, section_id, and date are required.'], 400);
  }

  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await attendanceService.lockAttendance(
    parseInt(class_id, 10),
    parseInt(section_id, 10),
    date,
    adminId,
    clientInfo
  );

  return response.sendSuccess(res, result.message, {}, 200);
});

export const unlockAttendance = asyncHandler(async (req, res) => {
  const { class_id, section_id, date } = req.body;
  if (!class_id || !section_id || !date) {
    return response.sendError(res, 'Validation failed', ['class_id, section_id, and date are required.'], 400);
  }

  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await attendanceService.unlockAttendance(
    parseInt(class_id, 10),
    parseInt(section_id, 10),
    date,
    adminId,
    clientInfo
  );

  return response.sendSuccess(res, result.message, {}, 200);
});

export const getAttendanceAnalytics = asyncHandler(async (req, res) => {
  const { student_id, year, month } = req.query;
  if (!student_id || !year) {
    return response.sendError(res, 'Validation failed', ['student_id and year are required.'], 400);
  }

  const result = await attendanceService.getAttendanceAnalytics(
    parseInt(student_id, 10),
    parseInt(year, 10),
    month ? parseInt(month, 10) : null
  );

  return response.sendSuccess(res, 'Attendance analytics retrieved successfully', result, 200);
});

export const takeTeacherAttendance = asyncHandler(async (req, res) => {
  const { records, date } = req.body;
  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  // Check if bulk records list is provided
  if (records && Array.isArray(records)) {
    if (!date) {
      return response.sendError(res, 'Validation failed', ['date is required for bulk attendance.'], 400);
    }
    const result = await attendanceService.takeBulkTeacherAttendance(records, date, adminId, clientInfo);
    return response.sendSuccess(res, result.message, {}, 200);
  }

  // Fallback to single record save
  const { teacher_id, date: singleDate, status, remarks } = req.body;
  if (!teacher_id || !singleDate || !status) {
    return response.sendError(res, 'Validation failed', ['teacher_id, date, and status are required.'], 400);
  }

  const result = await attendanceService.takeTeacherAttendance({
    teacher_id: parseInt(teacher_id, 10),
    attendance_date: singleDate,
    status,
    remarks
  }, adminId, clientInfo);

  return response.sendSuccess(res, result.message, {}, 200);
});

export const getTeacherAttendance = asyncHandler(async (req, res) => {
  const { date } = req.query;
  if (!date) {
    return response.sendError(res, 'Validation failed', ['date query parameter is required.'], 400);
  }

  const result = await attendanceService.getTeacherAttendance(date);
  return response.sendSuccess(res, 'Teacher attendance retrieved successfully', result, 200);
});

export const getStudentMonthlyAttendance = asyncHandler(async (req, res) => {
  const { year, month, class_id, section_id, search } = req.query;
  if (!year || !month) {
    return response.sendError(res, 'Validation failed', ['year and month parameters are required.'], 400);
  }

  const result = await attendanceService.getStudentMonthlyAttendance(
    parseInt(year, 10),
    parseInt(month, 10),
    class_id ? parseInt(class_id, 10) : null,
    section_id ? parseInt(section_id, 10) : null,
    search || null
  );

  return response.sendSuccess(res, 'Student monthly attendance retrieved successfully', result, 200);
});

export const getTeacherMonthlyAttendance = asyncHandler(async (req, res) => {
  const { year, month, search } = req.query;
  if (!year || !month) {
    return response.sendError(res, 'Validation failed', ['year and month parameters are required.'], 400);
  }

  const result = await attendanceService.getTeacherMonthlyAttendance(
    parseInt(year, 10),
    parseInt(month, 10),
    search || null
  );

  return response.sendSuccess(res, 'Teacher monthly attendance retrieved successfully', result, 200);
});

export const patchStudentAttendance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, remarks } = req.body;
  if (!status) {
    return response.sendError(res, 'Validation failed', ['status is required.'], 400);
  }

  const result = await attendanceService.patchStudentAttendance(
    parseInt(id, 10),
    status,
    remarks || '',
    req.user.id
  );

  return response.sendSuccess(res, 'Student attendance updated successfully', result, 200);
});

export const patchTeacherAttendance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, remarks } = req.body;
  if (!status) {
    return response.sendError(res, 'Validation failed', ['status is required.'], 400);
  }

  const result = await attendanceService.patchTeacherAttendance(
    parseInt(id, 10),
    status,
    remarks || '',
    req.user.id
  );

  return response.sendSuccess(res, 'Teacher attendance updated successfully', result, 200);
});
