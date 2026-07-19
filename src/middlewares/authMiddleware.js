import cryptoHelper from '../helpers/cryptoHelper.js';
import userRepository from '../modules/user/userRepository.js';
import response from '../utils/response.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return response.sendError(res, 'Authentication token required', ['Access token is missing or invalid'], 401);
    }

    const payload = cryptoHelper.verifyToken(token, false);

    if (!payload) {
      return response.sendError(res, 'Invalid or expired token', ['Token verification failed'], 401);
    }

    // Fetch latest user details from the database
    const user = await userRepository.findById(payload.id);
    if (!user) {
      return response.sendError(res, 'User not found', ['The user associated with this token does not exist'], 401);
    }

    // Check account status
    if (user.status === 'blocked') {
      return response.sendError(res, 'Access Denied', ['Your account has been blocked by the administrator'], 403);
    }
    if (user.status === 'suspended') {
      return response.sendError(res, 'Access Denied', ['Your account has been suspended by the administrator'], 403);
    }

    // Attach user details to the request object
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return response.sendError(res, 'Authentication required', ['You must be logged in to perform this action'], 401);
    }

    const hasRole = allowedRoles.includes(req.user.role_name);
    if (!hasRole) {
      return response.sendError(res, 'Access Denied', [`This action requires one of the following roles: ${allowedRoles.join(', ')}`], 403);
    }

    next();
  };
};
