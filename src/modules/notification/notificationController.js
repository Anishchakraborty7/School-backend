import notificationService from './notificationService.js';
import response from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getNotifications(req.user.id);
  return response.sendSuccess(res, 'Notifications retrieved successfully', result, 200);
});

export const markRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await notificationService.markRead(parseInt(id, 10), req.user.id);
  return response.sendSuccess(res, result.message, {}, 200);
});
