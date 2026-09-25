import crypto from "node:crypto";

export const ADMIN_SESSION_MS = 30 * 60_000;
export const ADMIN_LOCK_MS = 15 * 60_000;
export const ADMIN_MAX_ATTEMPTS = 5;

export function validSecondPassword(value) {
  return typeof value === "string" && Array.from(value).length >= 12
    && Buffer.byteLength(value, "utf8") <= 72;
}

export function createAdminSession() {
  const token = crypto.randomBytes(32).toString("base64url");
  return { token, hash: crypto.createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + ADMIN_SESSION_MS) };
}

export function validAdminSession(user, token, now = Date.now()) {
  const expiresAt = new Date(user?.admin_session_expires_at || 0).getTime();
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token) || !user?.admin_second_password_hash
    || !user.admin_session_hash || !Number.isFinite(expiresAt) || expiresAt <= now) return false;
  const supplied = crypto.createHash("sha256").update(token).digest();
  const expected = Buffer.from(user.admin_session_hash, "hex");
  return expected.length === supplied.length && crypto.timingSafeEqual(supplied, expected);
}
