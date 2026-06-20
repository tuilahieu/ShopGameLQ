import { errorResponse } from "../utils/response.util.js";

export function ctvMiddleware(req, res, next) {
  const level = Number(req.user.level);

  if (level !== 1 && level !== 99) {
    return errorResponse(res, "Bạn không có quyền cộng tác viên", 403);
  }

  next();
}
