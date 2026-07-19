import leaveService from './leaveService.js';
import response from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const requestLeave = asyncHandler(async (req, res) => {
  const { leave_type, start_date, end_date, reason } = req.body;
  if (!leave_type || !start_date || !end_date || !reason) {
    return response.sendError(res, 'Validation failed', ['leave_type, start_date, end_date, and reason are required.'], 400);
  }

  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await leaveService.requestLeave(
    { leave_type, start_date, end_date, reason },
    req.user,
    clientInfo
  );

  return response.sendSuccess(res, 'Leave request submitted successfully', result, 201);
});

export const getLeaveRequests = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const result = await leaveService.getLeaveRequests({ status }, req.user);
  return response.sendSuccess(res, 'Leave requests retrieved successfully', result, 200);
});

export const processLeaveRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, remarks } = req.body; // status: 'approved' or 'rejected'

  if (!status || !['approved', 'rejected'].includes(status)) {
    return response.sendError(res, 'Validation failed', ['status must be either approved or rejected.'], 400);
  }

  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await leaveService.processLeaveRequest(
    parseInt(id, 10),
    status,
    remarks,
    adminId,
    clientInfo
  );

  return response.sendSuccess(res, result.message, {}, 200);
});
