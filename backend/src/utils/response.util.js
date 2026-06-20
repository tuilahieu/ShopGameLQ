export function successResponse(
  res,
  message = "Thành công",
  data = null,
  status = 200,
) {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
}

export function errorResponse(res, message = "Có lỗi xảy ra", status = 400) {
  return res.status(status).json({
    success: false,
    message,
  });
}
