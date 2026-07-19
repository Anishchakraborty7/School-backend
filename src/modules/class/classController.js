import classService from './classService.js';
import response from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const createClass = asyncHandler(async (req, res) => {
  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await classService.createClass(req.body, adminId, clientInfo);
  return response.sendSuccess(res, 'Class created successfully', result, 201);
});

export const updateClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await classService.updateClass(parseInt(id, 10), req.body, adminId, clientInfo);
  return response.sendSuccess(res, 'Class updated successfully', result, 200);
});

export const getClasses = asyncHandler(async (req, res) => {
  const { academic_year_id } = req.query;
  const result = await classService.getAllClasses(academic_year_id ? parseInt(academic_year_id, 10) : null);
  return response.sendSuccess(res, 'Classes retrieved successfully', result, 200);
});

export const deleteClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  await classService.deleteClass(parseInt(id, 10), adminId, clientInfo);
  return response.sendSuccess(res, 'Class deleted successfully', {}, 200);
});
