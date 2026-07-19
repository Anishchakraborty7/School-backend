import adminService from './adminService.js';
import response from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getAllUsers = asyncHandler(async (req, res) => {
  const { status, role } = req.query;
  const filters = {};
  if (status) filters.status = status;
  if (role) filters.role_name = role;

  const users = await adminService.getAllUsers(filters);
  return response.sendSuccess(res, 'Users retrieved successfully', users, 200);
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role_name } = req.body;
  
  if (!role_name) {
    return response.sendError(res, 'Validation failed', ['role_name is required in request body'], 400);
  }

  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await adminService.updateUserRole(parseInt(id, 10), role_name, req.user.id, clientInfo);
  return response.sendSuccess(res, result.message, {}, 200);
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return response.sendError(res, 'Validation failed', ['status is required in request body'], 400);
  }

  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await adminService.updateUserStatus(parseInt(id, 10), status, req.user.id, clientInfo);
  return response.sendSuccess(res, result.message, {}, 200);
});

export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await adminService.deleteUser(parseInt(id, 10), req.user.id, clientInfo);
  return response.sendSuccess(res, result.message, {}, 200);
});

export const resetUserPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password || password.length < 8) {
    return response.sendError(res, 'Validation failed', ['Password must be at least 8 characters long'], 400);
  }

  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await adminService.resetUserPassword(parseInt(id, 10), password, req.user.id, clientInfo);
  return response.sendSuccess(res, result.message, {}, 200);
});

import auditLogRepository from './auditLogRepository.js';

export const getAuditLogs = asyncHandler(async (req, res) => {
  const logs = await auditLogRepository.findAll(100);
  return response.sendSuccess(res, 'Audit logs retrieved successfully', logs, 200);
});
