import crypto from "node:crypto";
import { errorResponse } from "../shared/utils/response.util.js";
import { getClientIp } from "../shared/utils/ip.util.js";

export function requestContext(req, res, next) {
  req.requestId = req.get("x-request-id") || crypto.randomUUID();
  req.clientIp = getClientIp(req);
  res.setHeader("x-request-id", req.requestId);
  next();
}

export function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  if (req.app.get("env") === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
}

export function createRateLimit({ windowMs, max, key = (req) => req.clientIp || getClientIp(req) || "unknown" }) {
  const entries = new Map();
  let nextCleanup = Date.now() + windowMs;

  return (req, res, next) => {
    const now = Date.now();
    if (now >= nextCleanup) {
      for (const [entryKey, entry] of entries) {
        if (entry.resetAt <= now) entries.delete(entryKey);
      }
      nextCleanup = now + windowMs;
    }

    const entryKey = key(req);
    const current = entries.get(entryKey);
    const entry = !current || current.resetAt <= now
      ? { count: 0, resetAt: now + windowMs }
      : current;
    entry.count += 1;
    entries.set(entryKey, entry);

    res.setHeader("RateLimit-Limit", max);
    res.setHeader("RateLimit-Remaining", Math.max(0, max - entry.count));
    res.setHeader("RateLimit-Reset", Math.ceil(entry.resetAt / 1000));
    if (entry.count > max) {
      res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1000));
      return errorResponse(res, "Bạn đã gửi quá nhiều yêu cầu, vui lòng thử lại sau", 429, "RATE_LIMITED", req);
    }
    next();
  };
}

export function notFoundHandler(req, res) {
  return errorResponse(res, "Không tìm thấy tài nguyên", 404, "NOT_FOUND", req);
}

export function errorHandler(error, req, res, _next) {
  const status = error.status || error.statusCode || 500;
  if (error.name === "MulterError" || error.message === "Chỉ hỗ trợ file ảnh") {
    return errorResponse(res, error.message || "Tệp tải lên không hợp lệ", 400, "INVALID_UPLOAD", req);
  }

  if (status >= 500) {
    console.error(JSON.stringify({ level: "error", requestId: req.requestId, message: error.message, stack: error.stack }));
  }
  return errorResponse(res, status >= 500 ? "Có lỗi hệ thống, vui lòng thử lại sau" : error.message, status, "REQUEST_ERROR", req);
}
