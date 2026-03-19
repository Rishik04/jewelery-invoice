export const successResponse = (res, statusCode, message, data) => {
  res.status(statusCode).json({
    status: "success",
    message,
    data,
  });
};

export const errorResponse = (res, statusCode, message, error) => {
  res.status(statusCode).json({
    status: "error",
    message,
    error,
  });
};
