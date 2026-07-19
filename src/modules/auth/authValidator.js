import userRepository from '../user/userRepository.js';
import response from '../../utils/response.js';

export const validateRegister = async (req, res, next) => {
  const { full_name, email, phone, password } = req.body;
  const errors = [];

  if (!full_name || typeof full_name !== 'string' || full_name.trim().length === 0) {
    errors.push('Full name is required');
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Valid email is required');
  }

  if (!phone || !/^\+?[1-9]\d{1,14}$/.test(phone.replace(/[\s-()]/g, ''))) {
    errors.push('Valid phone number is required');
  }

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one letter and one number');
  }

  if (errors.length > 0) {
    return response.sendError(res, 'Validation failed', errors, 400);
  }

  try {
    const emailExists = await userRepository.existsEmail(email);
    if (emailExists) {
      errors.push('Email is already registered');
    }

    const phoneExists = await userRepository.existsPhone(phone);
    if (phoneExists) {
      errors.push('Phone number is already registered');
    }

    if (errors.length > 0) {
      return response.sendError(res, 'Validation failed', errors, 400);
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Valid email is required');
  }
  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return response.sendError(res, 'Validation failed', errors, 400);
  }
  next();
};

export const validateForgotPassword = (req, res, next) => {
  const { email } = req.body;
  const errors = [];

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Valid email is required');
  }

  if (errors.length > 0) {
    return response.sendError(res, 'Validation failed', errors, 400);
  }
  next();
};

export const validateResetPassword = (req, res, next) => {
  const { token, password } = req.body;
  const errors = [];

  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    errors.push('Token is required');
  }
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one letter and one number');
  }

  if (errors.length > 0) {
    return response.sendError(res, 'Validation failed', errors, 400);
  }
  next();
};
