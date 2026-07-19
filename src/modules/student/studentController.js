import studentService from './studentService.js';
import studentRepository from './studentRepository.js';
import response from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { generateBarcodeSVG, generateQrCodeBase64 } from '../../helpers/idCardHelper.js';
import { renderStudentCard, renderBulkStudents } from '../../helpers/idCardTemplate.js';

export const admitStudent = asyncHandler(async (req, res) => {
  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  let studentData = {};
  let guardianData = {};

  try {
    studentData = typeof req.body.student === 'string' ? JSON.parse(req.body.student) : req.body.student;
    guardianData = typeof req.body.guardian === 'string' ? JSON.parse(req.body.guardian) : req.body.guardian;
  } catch (err) {
    studentData = req.body;
    guardianData = req.body;
  }

  if (!studentData || !guardianData) {
    return response.sendError(res, 'Validation failed', ['Student and Guardian structures are required.'], 400);
  }

  if (req.file) {
    studentData.photo = req.file.path;
  }

  const result = await studentService.admitStudent(studentData, guardianData, adminId, clientInfo);
  return response.sendSuccess(res, 'Student admitted successfully', result, 201);
});

export const editStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  let studentData = {};
  let guardianData = {};

  try {
    studentData = typeof req.body.student === 'string' ? JSON.parse(req.body.student) : req.body.student || {};
    guardianData = typeof req.body.guardian === 'string' ? JSON.parse(req.body.guardian) : req.body.guardian || {};
  } catch (err) {
    studentData = req.body;
    guardianData = req.body;
  }

  if (req.file) {
    studentData.photo = req.file.path;
  }

  const result = await studentService.editStudent(parseInt(id, 10), studentData, guardianData, adminId, clientInfo);
  return response.sendSuccess(res, 'Student profile updated successfully', result, 200);
});

export const deleteStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await studentService.deleteStudent(parseInt(id, 10), adminId, clientInfo);
  return response.sendSuccess(res, result.message, {}, 200);
});

export const restoreStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await studentService.restoreStudent(parseInt(id, 10), adminId, clientInfo);
  return response.sendSuccess(res, result.message, {}, 200);
});

export const getStudentProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await studentService.getStudentProfile(parseInt(id, 10));
  return response.sendSuccess(res, 'Student profile retrieved successfully', result, 200);
});

export const uploadStudentDocEndpoint = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { document_type } = req.body;

  if (!req.file) {
    return response.sendError(res, 'Validation failed', ['No document file provided'], 400);
  }
  if (!document_type) {
    return response.sendError(res, 'Validation failed', ['document_type is required'], 400);
  }

  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const docData = {
    student_id: parseInt(id, 10),
    document_type,
    document_name: req.file.originalname,
    file_path: req.file.path,
    file_size: req.file.size,
    file_type: req.file.mimetype
  };

  const result = await studentService.addStudentDocument(docData, adminId, clientInfo);
  return response.sendSuccess(res, result.message, { file_path: docData.file_path }, 200);
});

export const getStudents = asyncHandler(async (req, res) => {
  const { class_id, section_id, academic_year_id, status, gender, q } = req.query;
  const result = await studentService.getAllStudents({
    class_id: class_id ? parseInt(class_id, 10) : null,
    section_id: section_id ? parseInt(section_id, 10) : null,
    academic_year_id: academic_year_id ? parseInt(academic_year_id, 10) : null,
    status,
    gender,
    search_query: q
  });
  return response.sendSuccess(res, 'Students retrieved successfully', result, 200);
});

export const getStudentIdCard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const student = await studentRepository.findById(parseInt(id, 10));
  if (!student) {
    return response.sendError(res, 'Student not found', ['Student profile does not exist'], 404);
  }

  const qr = await generateQrCodeBase64(`STUDENT:${student.admission_number}`);
  const barcode = generateBarcodeSVG(student.admission_number);

  const html = renderStudentCard(student, qr, barcode);

  res.setHeader('Content-Type', 'text/html');
  return res.send(html);
});

export const getBulkStudentIdCards = asyncHandler(async (req, res) => {
  const { class_id, section_id } = req.query;
  if (!class_id || !section_id) {
    return response.sendError(res, 'Validation failed', ['class_id and section_id query parameters are required.'], 400);
  }

  const students = await studentRepository.findAll({
    class_id: parseInt(class_id, 10),
    section_id: parseInt(section_id, 10),
    status: 'active'
  });

  if (students.length === 0) {
    return res.send(`<html><body><h2 style="text-align:center; margin-top:50px;">No active students found in this section.</h2></body></html>`);
  }

  const list = [];
  for (const student of students) {
    const qr = await generateQrCodeBase64(`STUDENT:${student.admission_number}`);
    const barcode = generateBarcodeSVG(student.admission_number);
    list.push({ student, qr, barcode });
  }

  const html = renderBulkStudents(list);

  res.setHeader('Content-Type', 'text/html');
  return res.send(html);
});

export const getNextAdmissionNumber = asyncHandler(async (req, res) => {
  const result = await studentService.getNextAdmissionNumber();
  return response.sendSuccess(res, 'Next admission number retrieved successfully', { admission_number: result }, 200);
});
