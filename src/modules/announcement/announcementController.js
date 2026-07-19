import announcementService from './announcementService.js';
import response from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, content, visibility, target_class_id, target_section_id, priority } = req.body;
  if (!title || !content) {
    return response.sendError(res, 'Validation failed', ['title and content are required.'], 400);
  }

  const authorId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await announcementService.createAnnouncement({
    title,
    content,
    visibility,
    target_class_id: target_class_id ? parseInt(target_class_id, 10) : null,
    target_section_id: target_section_id ? parseInt(target_section_id, 10) : null,
    priority
  }, authorId, clientInfo);

  return response.sendSuccess(res, 'Announcement created successfully', result, 201);
});

export const getAnnouncements = asyncHandler(async (req, res) => {
  const result = await announcementService.getAnnouncementsForUser(req.user);
  return response.sendSuccess(res, 'Announcements retrieved successfully', result, 200);
});
