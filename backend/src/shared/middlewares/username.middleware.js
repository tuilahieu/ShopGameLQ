import { errorResponse } from "../utils/response.util.js";

const RESERVED_USERNAME_PART = "admin";

/** Blocks registration usernames that could be confused with administrator accounts. */
export function blockAdminUsername(req, res, next) {
  const username = req.body?.username;

  if (typeof username === "string" && username.toLowerCase().includes(RESERVED_USERNAME_PART)) {
    return errorResponse(
      res,
      "tên tài khoản không hợp lệ, vui lòng thử với tài khoản khác",
      400,
    );
  }

  return next();
}
