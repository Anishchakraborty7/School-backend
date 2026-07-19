import calendarService from './calendarService.js';
import response from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const createHoliday = asyncHandler(async (req, res) => {
  const { academic_year_id, holiday_name, holiday_date, holiday_type, description } = req.body;
  if (!academic_year_id || !holiday_name || !holiday_date || !holiday_type) {
    return response.sendError(res, 'Validation failed', ['academic_year_id, holiday_name, holiday_date, and holiday_type are required.'], 400);
  }

  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await calendarService.createHoliday({
    academic_year_id: parseInt(academic_year_id, 10),
    holiday_name,
    holiday_date,
    holiday_type,
    description
  }, adminId, clientInfo);

  return response.sendSuccess(res, 'Holiday scheduled successfully', result, 201);
});

export const getHolidays = asyncHandler(async (req, res) => {
  const { year_id } = req.query;
  if (!year_id) {
    return response.sendError(res, 'Validation failed', ['year_id query parameter is required.'], 400);
  }

  const result = await calendarService.getHolidays(parseInt(year_id, 10));
  return response.sendSuccess(res, 'Holidays list retrieved successfully', result, 200);
});

export const createEvent = asyncHandler(async (req, res) => {
  const { academic_year_id, title, description, event_type, start_date, end_date, visibility } = req.body;
  if (!academic_year_id || !title || !description || !event_type || !start_date || !end_date) {
    return response.sendError(res, 'Validation failed', ['academic_year_id, title, description, event_type, start_date, and end_date are required.'], 400);
  }

  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await calendarService.createEvent({
    academic_year_id: parseInt(academic_year_id, 10),
    title,
    description,
    event_type,
    start_date,
    end_date,
    visibility
  }, adminId, clientInfo);

  return response.sendSuccess(res, 'Calendar event created successfully', result, 201);
});

export const getEvents = asyncHandler(async (req, res) => {
  const { year_id } = req.query;
  if (!year_id) {
    return response.sendError(res, 'Validation failed', ['year_id query parameter is required.'], 400);
  }

  const result = await calendarService.getEvents(parseInt(year_id, 10));
  return response.sendSuccess(res, 'Events list retrieved successfully', result, 200);
});
