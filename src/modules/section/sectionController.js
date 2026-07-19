import sectionService from './sectionService.js';
import response from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const createSection = asyncHandler(async (req, res) => {
  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await sectionService.createSection(req.body, adminId, clientInfo);
  return response.sendSuccess(res, 'Section created successfully', result, 201);
});

export const updateSection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await sectionService.updateSection(parseInt(id, 10), req.body, adminId, clientInfo);
  return response.sendSuccess(res, 'Section updated successfully', result, 200);
});

export const getSections = asyncHandler(async (req, res) => {
  const { class_id } = req.query;
  const result = await sectionService.getAllSections(class_id ? parseInt(class_id, 10) : null);
  return response.sendSuccess(res, 'Sections retrieved successfully', result, 200);
});

export const deleteSection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  await sectionService.deleteSection(parseInt(id, 10), adminId, clientInfo);
  return response.sendSuccess(res, 'Section deleted successfully', {}, 200);
});
