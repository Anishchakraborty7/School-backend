import promotionService from './promotionService.js';
import response from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const promoteSingle = asyncHandler(async (req, res) => {
  const { student_id, to_academic_year_id, to_class_id, to_section_id, to_roll_number } = req.body;
  if (!student_id || !to_academic_year_id || !to_class_id || !to_section_id || !to_roll_number) {
    return response.sendError(res, 'Validation failed', ['All promotion fields are required.'], 400);
  }

  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await promotionService.promoteSingleStudent({
    student_id: parseInt(student_id, 10),
    to_academic_year_id: parseInt(to_academic_year_id, 10),
    to_class_id: parseInt(to_class_id, 10),
    to_section_id: parseInt(to_section_id, 10),
    to_roll_number: parseInt(to_roll_number, 10)
  }, adminId, clientInfo);

  return response.sendSuccess(res, result.message, {}, 200);
});

export const promoteClassBulk = asyncHandler(async (req, res) => {
  const { from_class_id, to_class_id, to_academic_year_id } = req.body;
  if (!from_class_id || !to_class_id || !to_academic_year_id) {
    return response.sendError(res, 'Validation failed', ['from_class_id, to_class_id, and to_academic_year_id are required.'], 400);
  }

  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await promotionService.promoteClass({
    from_class_id: parseInt(from_class_id, 10),
    to_class_id: parseInt(to_class_id, 10),
    to_academic_year_id: parseInt(to_academic_year_id, 10)
  }, adminId, clientInfo);

  return response.sendSuccess(res, result.message, {}, 200);
});
