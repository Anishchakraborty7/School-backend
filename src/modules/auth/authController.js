import authService from './authService.js';
import response from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const register = asyncHandler(async (req, res) => {
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const result = await authService.register(req.body, clientInfo);
  return response.sendSuccess(res, 'User registered successfully. Status is pending administrator approval.', result, 201);
});

export const login = asyncHandler(async (req, res) => {
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const { email, password } = req.body;
  const result = await authService.login(email, password, clientInfo);
  return response.sendSuccess(res, 'Login successful', result, 200);
});

export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  await authService.logout(refreshToken);
  return response.sendSuccess(res, 'Logout successful', {}, 200);
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return response.sendError(res, 'Refresh token required', ['refreshToken field is missing in request body'], 400);
  }
  const result = await authService.refresh(refreshToken);
  return response.sendSuccess(res, 'Token refreshed successfully', result, 200);
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const { email } = req.body;
  const result = await authService.forgotPassword(email, clientInfo);
  return response.sendSuccess(res, result.message, { token: result.token }, 200);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  const { token, password } = req.body;
  const result = await authService.resetPassword(token, password, clientInfo);
  return response.sendSuccess(res, result.message, {}, 200);
});
