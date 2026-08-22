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
    requestId: res.req?.requestId,
  });
}

export function errorResponse(res, message = "Có lỗi xảy ra", status = 400, code = undefined, req = undefined) {
  return res.status(status).json({
    success: false,
    message,
    ...(code && { code }),
    requestId: req?.requestId || res.req?.requestId,
  });
}
