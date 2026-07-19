import response from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  // Log details for debugging
  console.error('Error occurred in request processing:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred';
  const errors = err.errors || [err.message || 'Internal Server Error'];

  return response.sendError(res, message, errors, statusCode);
};
