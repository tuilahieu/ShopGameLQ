import { errorResponse } from "../utils/response.util.js";
import { User } from "../../modules/users/user.model.js";
import { validAdminSession } from "../../modules/auth/admin-security.service.js";

export function adminRoleMiddleware(req, res, next) {
  if (Number(req.user.level) !== 99) {
    return errorResponse(res, "Bạn không có quyền quản trị hệ thống", 403);
  }
  next();
}

export async function requireAdminSession(req, res, next) {
  res.setHeader("Cache-Control", "no-store");
  if (Number(req.user.level) !== 99) return errorResponse(res, "Bạn không có quyền quản trị hệ thống", 403);
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ["admin_second_password_hash", "admin_session_hash", "admin_session_expires_at"],
    });
    if (!user?.admin_second_password_hash) {
      return errorResponse(res, "Cần thiết lập mật khẩu cấp 2 cho admin", 403, "ADMIN_SECOND_FACTOR_SETUP_REQUIRED", req);
    }
    if (!validAdminSession(user, req.get("x-admin-session"))) {
      return errorResponse(res, "Cần xác minh mật khẩu cấp 2", 403, "ADMIN_SECOND_FACTOR_REQUIRED", req);
    }
    req.adminSessionExpiresAt = user.admin_session_expires_at;
    return next();
  } catch (error) {
    return next(error);
  }
}

export function adminMiddleware(req, res, next) {
  if (Number(req.user.level) !== 99) return errorResponse(res, "Bạn không có quyền quản trị hệ thống", 403);
  return requireAdminSession(req, res, next);
}

export function adminSessionIfAdmin(req, res, next) {
  return Number(req.user.level) === 99 ? requireAdminSession(req, res, next) : next();
}
