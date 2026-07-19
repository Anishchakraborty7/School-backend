import assignmentService from './assignmentService.js';
import response from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const createAssignment = asyncHandler(async (req, res) => {
  const { academic_year_id, class_id, section_id, subject_id, title, description, max_marks, due_date, submission_deadline, status } = req.body;
  if (!academic_year_id || !class_id || !section_id || !subject_id || !title || !description || !max_marks || !due_date || !submission_deadline) {
    return response.sendError(res, 'Validation failed', ['All assignment fields are required.'], 400);
  }

  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const attachmentPath = req.file ? req.file.path : null;

  const result = await assignmentService.createAssignment(
    {
      academic_year_id: parseInt(academic_year_id, 10),
      class_id: parseInt(class_id, 10),
      section_id: parseInt(section_id, 10),
      subject_id: parseInt(subject_id, 10),
      title,
      description,
      max_marks: parseFloat(max_marks),
      due_date,
      submission_deadline,
      status
    },
    attachmentPath,
    req.user,
    clientInfo
  );

  return response.sendSuccess(res, 'Assignment created successfully', result, 201);
});

export const getAssignments = asyncHandler(async (req, res) => {
  const { class_id, section_id, subject_id, status } = req.query;

  const result = await assignmentService.getAssignmentsList(
    {
      class_id: class_id ? parseInt(class_id, 10) : null,
      section_id: section_id ? parseInt(section_id, 10) : null,
      subject_id: subject_id ? parseInt(subject_id, 10) : null,
      status
    },
    req.user
  );

  return response.sendSuccess(res, 'Assignments list retrieved successfully', result, 200);
});

export const submitAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params; // Assignment ID
  const { status } = req.body; // 'draft' or 'submitted'

  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await assignmentService.submitAssignment(
    parseInt(id, 10),
    status,
    req.files || [],
    req.user,
    clientInfo
  );

  return response.sendSuccess(res, result.message, {}, 200);
});

export const getSubmissions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await assignmentService.getSubmissions(parseInt(id, 10), req.user);
  return response.sendSuccess(res, 'Submissions retrieved successfully', result, 200);
});

export const reviewSubmission = asyncHandler(async (req, res) => {
  const { sub_id } = req.params;
  const { marks_obtained, remarks, status } = req.body; // status: 'reviewed' or 'correction_required'

  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await assignmentService.reviewSubmission(
    parseInt(sub_id, 10),
    marks_obtained !== undefined ? parseFloat(marks_obtained) : undefined,
    remarks,
    status,
    req.user,
    clientInfo
  );

  return response.sendSuccess(res, result.message, {}, 200);
});
