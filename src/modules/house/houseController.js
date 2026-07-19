import houseService from './houseService.js';
import response from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const createHouse = asyncHandler(async (req, res) => {
  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await houseService.createHouse(req.body, adminId, clientInfo);
  return response.sendSuccess(res, 'School house created successfully', result, 201);
});

export const updateHouse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await houseService.updateHouse(parseInt(id, 10), req.body, adminId, clientInfo);
  return response.sendSuccess(res, 'School house updated successfully', result, 200);
});

export const deleteHouse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await houseService.deleteHouse(parseInt(id, 10), adminId, clientInfo);
  return response.sendSuccess(res, result.message, {}, 200);
});

export const getHouses = asyncHandler(async (req, res) => {
  const result = await houseService.getAllHouses();
  return response.sendSuccess(res, 'School houses retrieved successfully', result, 200);
});
