import transferService from './transferService.js';
import response from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const transferStudent = asyncHandler(async (req, res) => {
  const { student_id, to_academic_year_id, to_class_id, to_section_id, to_roll_number, transfer_type, reason } = req.body;
  if (!student_id || !to_academic_year_id || !to_class_id || !to_section_id || !to_roll_number || !transfer_type) {
    return response.sendError(res, 'Validation failed', ['All transfer fields (student_id, to_academic_year_id, to_class_id, to_section_id, to_roll_number, transfer_type) are required.'], 400);
  }

  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await transferService.transferStudent({
    student_id: parseInt(student_id, 10),
    to_academic_year_id: parseInt(to_academic_year_id, 10),
    to_class_id: parseInt(to_class_id, 10),
    to_section_id: parseInt(to_section_id, 10),
    to_roll_number: parseInt(to_roll_number, 10),
    transfer_type,
    reason
  }, adminId, clientInfo);

  return response.sendSuccess(res, result.message, {}, 200);
});
