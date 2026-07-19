import homeworkService from './homeworkService.js';
import response from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const createHomework = asyncHandler(async (req, res) => {
  const { academic_year_id, class_id, section_id, subject_id, title, description, due_date, priority } = req.body;
  if (!academic_year_id || !class_id || !section_id || !subject_id || !title || !description || !due_date) {
    return response.sendError(res, 'Validation failed', ['All fields except priority and attachment are required.'], 400);
  }

  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const attachmentPath = req.file ? `uploads/student_docs/${req.file.filename}` : null;

  const result = await homeworkService.createHomework(
    {
      academic_year_id: parseInt(academic_year_id, 10),
      class_id: parseInt(class_id, 10),
      section_id: parseInt(section_id, 10),
      subject_id: parseInt(subject_id, 10),
      title,
      description,
      due_date,
      priority
    },
    attachmentPath,
    req.user,
    clientInfo
  );

  return response.sendSuccess(res, 'Homework created successfully', result, 201);
});

export const getHomeworkList = asyncHandler(async (req, res) => {
  const { class_id, section_id, subject_id, year_id } = req.query;
  
  const result = await homeworkService.getHomeworkList(
    {
      class_id: class_id ? parseInt(class_id, 10) : null,
      section_id: section_id ? parseInt(section_id, 10) : null,
      subject_id: subject_id ? parseInt(subject_id, 10) : null,
      academic_year_id: year_id ? parseInt(year_id, 10) : null
    },
    req.user
  );

  return response.sendSuccess(res, 'Homework list retrieved successfully', result, 200);
});

export const submitHomework = asyncHandler(async (req, res) => {
  const { id } = req.params; // Homework ID
  const { submission_text } = req.body;

  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const filePath = req.file ? `uploads/student_docs/${req.file.filename}` : null;
  const fileSize = req.file ? req.file.size : null;
  const fileType = req.file ? req.file.mimetype : null;

  const result = await homeworkService.submitHomework(
    parseInt(id, 10),
    submission_text,
    filePath,
    fileSize,
    fileType,
    req.user,
    clientInfo
  );

  return response.sendSuccess(res, result.message, {}, 200);
});

export const getSubmissions = asyncHandler(async (req, res) => {
  const { id } = req.params; // Homework ID
  const result = await homeworkService.getSubmissions(parseInt(id, 10), req.user);
  return response.sendSuccess(res, 'Submissions retrieved successfully', result, 200);
});

export const reviewSubmission = asyncHandler(async (req, res) => {
  const { sub_id } = req.params;
  const { points_score, remarks } = req.body;

  if (points_score === undefined) {
    return response.sendError(res, 'Validation failed', ['points_score is required.'], 400);
  }

  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await homeworkService.reviewSubmission(
    parseInt(sub_id, 10),
    parseFloat(points_score),
    remarks,
    req.user,
    clientInfo
  );

  return response.sendSuccess(res, result.message, {}, 200);
});
