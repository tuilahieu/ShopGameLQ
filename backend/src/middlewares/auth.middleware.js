import jwt from "jsonwebtoken";

import { User } from "../models/user.model.js";
import { errorResponse } from "../utils/response.util.js";

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, "Vui lòng đăng nhập để tiếp tục", 401);
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await User.findByPk(decoded.id, {
      attributes: ["id", "username", "level", "money", "tong_nap", "banned"],
    });

    if (!user) {
      return errorResponse(res, "Tài khoản không tồn tại", 401);
    }

    if (Number(user.banned) === 1) {
      return errorResponse(res, "Tài khoản của bạn đã bị khóa", 403);
    }

    req.user = user;

    next();
  } catch (error) {
    return errorResponse(res, "Phiên đăng nhập đã hết hạn", 401);
  }
}
