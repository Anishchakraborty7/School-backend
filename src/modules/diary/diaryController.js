import diaryService from './diaryService.js';
import response from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const addTeacherDiary = asyncHandler(async (req, res) => {
  const { date, class_id, section_id, subject_id, topics_covered, homework_given, remarks } = req.body;
  if (!date || !class_id || !section_id || !subject_id || !topics_covered) {
    return response.sendError(res, 'Validation failed', ['date, class_id, section_id, subject_id, and topics_covered are required.'], 400);
  }

  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await diaryService.addTeacherDiary({
    date,
    class_id: parseInt(class_id, 10),
    section_id: parseInt(section_id, 10),
    subject_id: parseInt(subject_id, 10),
    topics_covered,
    homework_given,
    remarks
  }, req.user, clientInfo);

  return response.sendSuccess(res, 'Teacher diary entry created successfully', result, 201);
});

export const getTeacherDiaries = asyncHandler(async (req, res) => {
  const result = await diaryService.getTeacherDiaries(req.user);
  return response.sendSuccess(res, 'Teacher diaries retrieved successfully', result, 200);
});

export const addStudentDiary = asyncHandler(async (req, res) => {
  const { date, diary_notes, parent_notes, student_id } = req.body;
  if (!date || !diary_notes) {
    return response.sendError(res, 'Validation failed', ['date and diary_notes are required.'], 400);
  }

  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await diaryService.addStudentDiary({
    date,
    diary_notes,
    parent_notes,
    student_id: student_id ? parseInt(student_id, 10) : null
  }, req.user, clientInfo);

  return response.sendSuccess(res, 'Student diary entry created successfully', result, 201);
});

export const getStudentDiaries = asyncHandler(async (req, res) => {
  const result = await diaryService.getStudentDiaries(req.user);
  return response.sendSuccess(res, 'Student diaries retrieved successfully', result, 200);
});
