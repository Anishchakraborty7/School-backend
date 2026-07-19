import subjectService from './subjectService.js';
import response from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const createSubject = asyncHandler(async (req, res) => {
  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await subjectService.createSubject(req.body, adminId, clientInfo);
  return response.sendSuccess(res, 'Subject created successfully', result, 201);
});

export const updateSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await subjectService.updateSubject(parseInt(id, 10), req.body, adminId, clientInfo);
  return response.sendSuccess(res, 'Subject updated successfully', result, 200);
});

export const getSubjects = asyncHandler(async (req, res) => {
  const result = await subjectService.getAllSubjects();
  return response.sendSuccess(res, 'Subjects retrieved successfully', result, 200);
});

export const assignClassSubjects = asyncHandler(async (req, res) => {
  const { class_id, subject_ids } = req.body;
  if (!class_id || !Array.isArray(subject_ids)) {
    return response.sendError(res, 'Validation failed', ['class_id and subject_ids (array) are required'], 400);
  }

  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await subjectService.linkSubjectsToClass(class_id, subject_ids, adminId, clientInfo);
  return response.sendSuccess(res, result.message, {}, 200);
});

export const getClassSubjects = asyncHandler(async (req, res) => {
  const { class_id } = req.params;
  const result = await subjectService.getSubjectsByClass(parseInt(class_id, 10));
  return response.sendSuccess(res, 'Class subjects retrieved successfully', result, 200);
});
