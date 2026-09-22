import bcrypt from "bcryptjs";
import { sequelize } from "../config/database.js";
import { User } from "../models/user.model.js";
import { writeLog } from "../utils/log.util.js";
import { errorResponse, successResponse } from "../utils/response.util.js";
import { ADMIN_LOCK_MS, ADMIN_MAX_ATTEMPTS, createAdminSession, validSecondPassword } from "../services/admin-security.service.js";

function badRequest(res, req) {
  return errorResponse(res, "Mật khẩu cấp 2 cần ít nhất 12 ký tự, tối đa 72 byte và khác mật khẩu đăng nhập", 400, "INVALID_ADMIN_SECOND_PASSWORD", req);
}

function lockSeconds(user) {
  const until = new Date(user.admin_second_locked_until || 0).getTime();
  return until > Date.now() ? Math.ceil((until - Date.now()) / 1000) : 0;
}

async function recordFailedAttempt(user, transaction) {
  const previousLock = new Date(user.admin_second_locked_until || 0).getTime();
  const attempts = previousLock > 0 && previousLock <= Date.now()
    ? 1 : Number(user.admin_second_attempts || 0) + 1;
  const locked = attempts >= ADMIN_MAX_ATTEMPTS;
  await user.update({
    admin_second_attempts: locked ? 0 : attempts,
    admin_second_locked_until: locked ? new Date(Date.now() + ADMIN_LOCK_MS) : null,
  }, { transaction });
  return { status: locked ? "locked" : "invalid", retryAfter: locked ? ADMIN_LOCK_MS / 1000 : undefined };
}

function lockedResponse(res, req, retryAfter) {
  res.setHeader("Retry-After", retryAfter);
  return errorResponse(res, "Đã thử quá nhiều lần, vui lòng thử lại sau", 429, "ADMIN_SECOND_FACTOR_LOCKED", req);
}

export async function adminSecurityStatus(req, res, next) {
  try {
    const user = await User.findByPk(req.user.id, { attributes: ["admin_second_password_hash"] });
    return successResponse(res, "Trạng thái bảo mật admin", { configured: Boolean(user?.admin_second_password_hash) });
  } catch (error) { return next(error); }
}

export async function setupAdminSecondPassword(req, res, next) {
  const { currentPassword, secondPassword } = req.body || {};
  if (typeof currentPassword !== "string" || !validSecondPassword(secondPassword)) return badRequest(res, req);
  try {
    const result = await sequelize.transaction(async (transaction) => {
      const user = await User.findByPk(req.user.id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!user || Number(user.level) !== 99 || Number(user.banned) === 1) return { status: "forbidden" };
      if (user.admin_second_password_hash) return { status: "configured" };
      const retryAfter = lockSeconds(user);
      if (retryAfter) return { status: "locked", retryAfter };
      if (!await bcrypt.compare(currentPassword, user.password)) return recordFailedAttempt(user, transaction);
      if (await bcrypt.compare(secondPassword, user.password)) return { status: "same" };
      await user.update({
        admin_second_password_hash: await bcrypt.hash(secondPassword, 12),
        admin_session_hash: null,
        admin_session_expires_at: null,
        admin_second_attempts: 0,
        admin_second_locked_until: null,
      }, { transaction });
      return { status: "ok" };
    });
    if (result.status === "forbidden") return errorResponse(res, "Không có quyền admin", 403, "ADMIN_FORBIDDEN", req);
    if (result.status === "configured") return errorResponse(res, "Mật khẩu cấp 2 đã được thiết lập", 409, "ADMIN_SECOND_FACTOR_EXISTS", req);
    if (result.status === "locked") return lockedResponse(res, req, result.retryAfter);
    if (result.status === "invalid") return errorResponse(res, "Mật khẩu đăng nhập không đúng", 401, "INVALID_PASSWORD", req);
    if (result.status === "same") return badRequest(res, req);
    await writeLog(req.user.id, "Thiết lập mật khẩu cấp 2 admin", req.clientIp);
    return successResponse(res, "Đã thiết lập mật khẩu cấp 2");
  } catch (error) { return next(error); }
}

export async function verifyAdminSecondPassword(req, res, next) {
  const secondPassword = req.body?.secondPassword;
  if (typeof secondPassword !== "string" || Buffer.byteLength(secondPassword, "utf8") > 72) {
    return errorResponse(res, "Mật khẩu cấp 2 không hợp lệ", 400, "INVALID_ADMIN_SECOND_PASSWORD", req);
  }
  try {
    const result = await sequelize.transaction(async (transaction) => {
      const user = await User.findByPk(req.user.id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!user || Number(user.level) !== 99 || Number(user.banned) === 1) return { status: "forbidden" };
      if (!user.admin_second_password_hash) return { status: "setup" };
      const retryAfter = lockSeconds(user);
      if (retryAfter) return { status: "locked", retryAfter };
      if (!await bcrypt.compare(secondPassword, user.admin_second_password_hash)) {
        return recordFailedAttempt(user, transaction);
      }
      const session = createAdminSession();
      await user.update({
        admin_session_hash: session.hash,
        admin_session_expires_at: session.expiresAt,
        admin_second_attempts: 0,
        admin_second_locked_until: null,
      }, { transaction });
      return { status: "ok", session };
    });
    if (result.status === "forbidden") return errorResponse(res, "Không có quyền admin", 403, "ADMIN_FORBIDDEN", req);
    if (result.status === "setup") return errorResponse(res, "Cần thiết lập mật khẩu cấp 2", 403, "ADMIN_SECOND_FACTOR_SETUP_REQUIRED", req);
    if (result.status === "locked") return lockedResponse(res, req, result.retryAfter);
    if (result.status === "invalid") return errorResponse(res, "Mật khẩu cấp 2 không đúng", 401, "INVALID_ADMIN_SECOND_PASSWORD", req);
    await writeLog(req.user.id, "Xác minh mật khẩu cấp 2 admin", req.clientIp);
    return successResponse(res, "Đã xác minh quyền admin", { adminSession: result.session.token, expiresAt: result.session.expiresAt });
  } catch (error) { return next(error); }
}

export function adminSessionStatus(req, res) {
  return successResponse(res, "Phiên quản trị hợp lệ", { valid: true, expiresAt: req.adminSessionExpiresAt });
}

export async function changeAdminSecondPassword(req, res, next) {
  const { currentPassword, oldSecondPassword, newSecondPassword } = req.body || {};
  if (typeof currentPassword !== "string" || typeof oldSecondPassword !== "string" || !validSecondPassword(newSecondPassword)) return badRequest(res, req);
  try {
    const result = await sequelize.transaction(async (transaction) => {
      const user = await User.findByPk(req.user.id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!user || Number(user.level) !== 99 || Number(user.banned) === 1 || !user.admin_second_password_hash) return "forbidden";
      if (!await bcrypt.compare(currentPassword, user.password) || !await bcrypt.compare(oldSecondPassword, user.admin_second_password_hash)) return "invalid";
      if (await bcrypt.compare(newSecondPassword, user.password) || await bcrypt.compare(newSecondPassword, user.admin_second_password_hash)) return "same";
      await user.update({
        admin_second_password_hash: await bcrypt.hash(newSecondPassword, 12),
        admin_session_hash: null,
        admin_session_expires_at: null,
        admin_second_attempts: 0,
        admin_second_locked_until: null,
      }, { transaction });
      return "ok";
    });
    if (result === "forbidden") return errorResponse(res, "Không có quyền admin", 403, "ADMIN_FORBIDDEN", req);
    if (result === "invalid") return errorResponse(res, "Mật khẩu hiện tại không đúng", 401, "INVALID_PASSWORD", req);
    if (result === "same") return badRequest(res, req);
    await writeLog(req.user.id, "Đổi mật khẩu cấp 2 admin", req.clientIp);
    return successResponse(res, "Đã đổi mật khẩu cấp 2; vui lòng xác minh lại");
  } catch (error) { return next(error); }
}
