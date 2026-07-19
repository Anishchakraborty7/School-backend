class ApiResponse {
  sendSuccess(res, message = 'Success', data = {}, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      errors: null
    });
  }

  sendError(res, message = 'Error occurred', errors = null, statusCode = 500) {
    const errorList = Array.isArray(errors) ? errors : (errors ? [errors] : []);
    return res.status(statusCode).json({
      success: false,
      message,
      data: null,
      errors: errorList
    });
  }
}

export default new ApiResponse();
