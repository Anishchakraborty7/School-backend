import timetableService from './timetableService.js';
import response from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const createPeriod = asyncHandler(async (req, res) => {
  const { academic_year_id, period_name, start_time, end_time, is_lunch_break } = req.body;
  if (!academic_year_id || !period_name || !start_time || !end_time) {
    return response.sendError(res, 'Validation failed', ['academic_year_id, period_name, start_time, and end_time are required.'], 400);
  }

  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await timetableService.createPeriod({
    academic_year_id: parseInt(academic_year_id, 10),
    period_name,
    start_time,
    end_time,
    is_lunch_break: !!is_lunch_break
  }, adminId, clientInfo);

  return response.sendSuccess(res, 'Period slot created successfully', result, 201);
});

export const getPeriods = asyncHandler(async (req, res) => {
  const { year_id } = req.query;
  if (!year_id) {
    return response.sendError(res, 'Validation failed', ['year_id query parameter is required.'], 400);
  }

  const result = await timetableService.getPeriods(parseInt(year_id, 10));
  return response.sendSuccess(res, 'Periods retrieved successfully', result, 200);
});

export const createTimetableEntry = asyncHandler(async (req, res) => {
  const { academic_year_id, class_id, section_id, period_id, subject_id, teacher_id, room_number, day_of_week } = req.body;
  if (
    !academic_year_id || !class_id || !section_id || !period_id ||
    !subject_id || !teacher_id || !room_number || !day_of_week
  ) {
    return response.sendError(res, 'Validation failed', ['All timetable fields are required.'], 400);
  }

  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await timetableService.createTimetableEntry({
    academic_year_id: parseInt(academic_year_id, 10),
    class_id: parseInt(class_id, 10),
    section_id: parseInt(section_id, 10),
    period_id: parseInt(period_id, 10),
    subject_id: parseInt(subject_id, 10),
    teacher_id: parseInt(teacher_id, 10),
    room_number,
    day_of_week
  }, adminId, clientInfo);

  return response.sendSuccess(res, result.message, result, 201);
});

export const getTimetableForSection = asyncHandler(async (req, res) => {
  const { class_id, section_id, year_id } = req.query;
  if (!class_id || !section_id || !year_id) {
    return response.sendError(res, 'Validation failed', ['class_id, section_id, and year_id query parameters are required.'], 400);
  }

  const result = await timetableService.getTimetableForSection(
    parseInt(class_id, 10),
    parseInt(section_id, 10),
    parseInt(year_id, 10)
  );

  return response.sendSuccess(res, 'Timetable for section retrieved successfully', result, 200);
});

export const getTimetableForTeacher = asyncHandler(async (req, res) => {
  const { teacher_id, year_id } = req.query;
  if (!teacher_id || !year_id) {
    return response.sendError(res, 'Validation failed', ['teacher_id and year_id query parameters are required.'], 400);
  }

  const result = await timetableService.getTimetableForTeacher(
    parseInt(teacher_id, 10),
    parseInt(year_id, 10)
  );

  return response.sendSuccess(res, 'Timetable for teacher retrieved successfully', result, 200);
});

export const updateTimetableEntry = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { academic_year_id, class_id, section_id, period_id, subject_id, teacher_id, room_number, day_of_week } = req.body;

  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const payload = {};
  if (academic_year_id !== undefined) payload.academic_year_id = parseInt(academic_year_id, 10);
  if (class_id !== undefined) payload.class_id = parseInt(class_id, 10);
  if (section_id !== undefined) payload.section_id = parseInt(section_id, 10);
  if (period_id !== undefined) payload.period_id = parseInt(period_id, 10);
  if (subject_id !== undefined) payload.subject_id = parseInt(subject_id, 10);
  if (teacher_id !== undefined) payload.teacher_id = parseInt(teacher_id, 10);
  if (room_number !== undefined) payload.room_number = room_number.trim();
  if (day_of_week !== undefined) payload.day_of_week = day_of_week;

  const result = await timetableService.updateTimetableEntry(parseInt(id, 10), payload, adminId, clientInfo);
  return response.sendSuccess(res, result.message, result, 200);
});

export const deleteTimetableEntry = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await timetableService.deleteTimetableEntry(parseInt(id, 10), adminId, clientInfo);
  return response.sendSuccess(res, result.message, result, 200);
});

export const getTimetableEntry = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await timetableService.getTimetableEntry(parseInt(id, 10));
  if (!result) {
    return response.sendError(res, 'Not found', ['Timetable entry not found.'], 404);
  }
  return response.sendSuccess(res, 'Timetable entry retrieved successfully', result, 200);
});

export const updatePeriod = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { period_name, start_time, end_time, is_lunch_break } = req.body;

  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const payload = {};
  if (period_name !== undefined) payload.period_name = period_name.trim();
  if (start_time !== undefined) payload.start_time = start_time;
  if (end_time !== undefined) payload.end_time = end_time;
  if (is_lunch_break !== undefined) payload.is_lunch_break = !!is_lunch_break;

  const result = await timetableService.updatePeriod(parseInt(id, 10), payload, adminId, clientInfo);
  return response.sendSuccess(res, result.message, result, 200);
});

export const deletePeriod = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await timetableService.deletePeriod(parseInt(id, 10), adminId, clientInfo);
  return response.sendSuccess(res, result.message, result, 200);
});
