import academicYearService from './academicYearService.js';
import response from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const createYear = asyncHandler(async (req, res) => {
  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await academicYearService.createAcademicYear(req.body, adminId, clientInfo);
  return response.sendSuccess(res, 'Academic year created successfully', result, 201);
});

export const updateYear = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await academicYearService.updateAcademicYear(parseInt(id, 10), req.body, adminId, clientInfo);
  return response.sendSuccess(res, 'Academic year updated successfully', result, 200);
});

export const getYears = asyncHandler(async (req, res) => {
  const result = await academicYearService.getAllAcademicYears();
  return response.sendSuccess(res, 'Academic years retrieved successfully', result, 200);
});

export const deleteYear = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  await academicYearService.deleteAcademicYear(parseInt(id, 10), adminId, clientInfo);
  return response.sendSuccess(res, 'Academic year deleted successfully', {}, 200);
});
