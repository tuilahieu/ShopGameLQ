import { errorResponse } from "../utils/response.util.js";

export function adminMiddleware(req, res, next) {
  if (Number(req.user.level) !== 99) {
    return errorResponse(res, "Bạn không có quyền quản trị hệ thống", 403);
  }

  next();
}
