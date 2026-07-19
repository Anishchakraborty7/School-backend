import classTeacherService from './classTeacherService.js';
import response from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const assignClassTeacher = asyncHandler(async (req, res) => {
  const { teacher_id, class_id, section_id, academic_year_id } = req.body;
  if (!teacher_id || !class_id || !section_id || !academic_year_id) {
    return response.sendError(res, 'Validation failed', ['teacher_id, class_id, section_id, and academic_year_id are required.'], 400);
  }

  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await classTeacherService.assignClassTeacher({
    teacher_id: parseInt(teacher_id, 10),
    class_id: parseInt(class_id, 10),
    section_id: parseInt(section_id, 10),
    academic_year_id: parseInt(academic_year_id, 10)
  }, adminId, clientInfo);

  return response.sendSuccess(res, 'Class teacher assigned successfully', result, 200);
});

export const removeClassTeacher = asyncHandler(async (req, res) => {
  const { class_id, section_id, academic_year_id } = req.body;
  if (!class_id || !section_id || !academic_year_id) {
    return response.sendError(res, 'Validation failed', ['class_id, section_id, and academic_year_id are required.'], 400);
  }

  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  await classTeacherService.removeClassTeacher({
    class_id: parseInt(class_id, 10),
    section_id: parseInt(section_id, 10),
    academic_year_id: parseInt(academic_year_id, 10)
  }, adminId, clientInfo);

  return response.sendSuccess(res, 'Class teacher removed successfully', {}, 200);
});
