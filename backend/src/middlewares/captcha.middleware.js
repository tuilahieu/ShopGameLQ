import { env } from "../config/env.js";
import { errorResponse } from "../utils/response.util.js";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Verifies a short-lived captcha token on the server; frontend validation alone is never trusted. */
export async function captchaMiddleware(req, res, next) {
  if (!env.captcha.enabled) return next();

  const token = req.body?.captcha_token;
  if (typeof token !== "string" || token.length < 20 || token.length > 4096) {
    return errorResponse(res, "Vui lòng hoàn tất xác minh captcha", 403);
  }

  try {
    const body = new URLSearchParams({ secret: env.captcha.secret, response: token });
    if (req.clientIp) body.set("remoteip", req.clientIp);
    const providerResponse = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(5_000),
    });
    const result = await providerResponse.json();
    if (!providerResponse.ok || result?.success !== true) {
      return errorResponse(res, "Xác minh captcha không hợp lệ hoặc đã hết hạn", 403);
    }
    return next();
  } catch (error) {
    console.error("CAPTCHA VERIFY ERROR:", error.message);
    return errorResponse(res, "Dịch vụ captcha đang bận, vui lòng thử lại", 503);
  }
}
