import teacherService from './teacherService.js';
import response from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { generateBarcodeSVG, generateQrCodeBase64 } from '../../helpers/idCardHelper.js';
import { renderTeacherCard, renderBulkTeachers } from '../../helpers/idCardTemplate.js';

export const addTeacher = asyncHandler(async (req, res) => {
  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const teacherData = { ...req.body };
  if (req.file) {
    teacherData.photo = req.file.path;
  }

  const result = await teacherService.addTeacher(teacherData, adminId, clientInfo);
  return response.sendSuccess(res, 'Teacher added successfully', result, 201);
});

export const editTeacher = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const teacherData = { ...req.body };
  if (req.file) {
    teacherData.photo = req.file.path;
  }

  const result = await teacherService.editTeacher(parseInt(id, 10), teacherData, adminId, clientInfo);
  return response.sendSuccess(res, 'Teacher updated successfully', result, 200);
});

export const deleteTeacher = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await teacherService.deleteTeacher(parseInt(id, 10), adminId, clientInfo);
  return response.sendSuccess(res, result.message, {}, 200);
});

export const restoreTeacher = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await teacherService.restoreTeacher(parseInt(id, 10), adminId, clientInfo);
  return response.sendSuccess(res, result.message, {}, 200);
});

export const getTeacherProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await teacherService.getTeacherProfile(parseInt(id, 10));
  return response.sendSuccess(res, 'Teacher profile retrieved successfully', result, 200);
});

export const addQualification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const qualData = {
    ...req.body,
    teacher_id: parseInt(id, 10)
  };

  const result = await teacherService.addQualification(qualData, adminId, clientInfo);
  return response.sendSuccess(res, result.message, {}, 201);
});

export const addExperience = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const expData = {
    ...req.body,
    teacher_id: parseInt(id, 10)
  };

  const result = await teacherService.addExperience(expData, adminId, clientInfo);
  return response.sendSuccess(res, result.message, {}, 201);
});

export const uploadTeacherDocEndpoint = asyncHandler(async (req, res) => {
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
    teacher_id: parseInt(id, 10),
    document_type,
    document_name: req.file.originalname,
    file_path: req.file.path,
    file_size: req.file.size,
    file_type: req.file.mimetype
  };

  const result = await teacherService.addDocument(docData, adminId, clientInfo);
  return response.sendSuccess(res, result.message, { file_path: docData.file_path }, 200);
});

export const assignSubjectsClasses = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { subject_ids, class_ids, confirm_overwrite } = req.body;
  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  try {
    const result = await teacherService.assignSubjectsAndClasses(
      parseInt(id, 10),
      subject_ids,
      class_ids,
      confirm_overwrite || false,
      adminId,
      clientInfo
    );
    return response.sendSuccess(res, 'Assignments updated successfully', result, 200);
  } catch (error) {
    if (error.code === 'MAPPING_CONFLICT') {
      return response.sendError(res, 'Conflict detected: A teacher is already mapped to the selected class and subject.', error.conflicts, 409);
    }
    throw error;
  }
});

export const getTeachers = asyncHandler(async (req, res) => {
  const { status, gender, department } = req.query;
  const result = await teacherService.getAllTeachers({ status, gender, department });
  return response.sendSuccess(res, 'Teachers list retrieved successfully', result, 200);
});

export const getTeacherIdCard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const profileDetails = await teacherService.getTeacherProfile(parseInt(id, 10));
  const teacher = profileDetails.profile;

  const qr = await generateQrCodeBase64(`TEACHER:${teacher.employee_id}`);
  const barcode = generateBarcodeSVG(teacher.employee_id);

  const html = renderTeacherCard(teacher, qr, barcode);

  res.setHeader('Content-Type', 'text/html');
  return res.send(html);
});

export const getBulkTeacherIdCards = asyncHandler(async (req, res) => {
  const teachers = await teacherService.getAllTeachers({ status: 'active' });

  if (teachers.length === 0) {
    return res.send(`<html><body><h2 style="text-align:center; margin-top:50px;">No active teachers found.</h2></body></html>`);
  }

  const list = [];
  for (const teacher of teachers) {
    const qr = await generateQrCodeBase64(`TEACHER:${teacher.employee_id}`);
    const barcode = generateBarcodeSVG(teacher.employee_id);
    list.push({ teacher, qr, barcode });
  }

  const html = renderBulkTeachers(list);

  res.setHeader('Content-Type', 'text/html');
  return res.send(html);
});
