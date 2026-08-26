import bcrypt from "bcryptjs";
import { successResponse, errorResponse } from "../utils/response.util.js";
import { writeLog } from "../utils/log.util.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/jwt.util.js";
import jwt from "jsonwebtoken";
import { hashToken } from "../utils/hash.util.js";
import { User } from "../models/index.js";
import { env } from "../config/env.js";

function normalizeUsername(value) {
  return typeof value === "string" ? value.trim() : "";
}

export async function register(req, res) {
  try {
    const username = normalizeUsername(req.body.username);
    const { password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập tên đăng nhập và mật khẩu",
      });
    }

    if (!/^[A-Za-z0-9_.-]{4,16}$/.test(username)) {
      return res.status(400).json({
        success: false,
        message: "Tên đăng nhập từ 4 đến 16 ký tự và chỉ gồm chữ, số, '.', '_' hoặc '-'",
      });
    }

    if (typeof password !== "string" || password.length < 4 || password.length > 16) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu phải có từ 4 đến 16 ký tự",
      });
    }

    const existedUser = await User.findOne({
      where: {
        username,
      },
    });

    if (existedUser) {
      return errorResponse(res, "Tên đăng nhập đã tồn tại", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      username,
      password: hashedPassword,
      ip: req.clientIp,
    });

    return successResponse(res, "Đăng ký tài khoản thành công", {
      id: user.id,
      username: user.username,
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra, vui lòng thử lại sau",
    });
  }
}

export async function login(req, res) {
  try {
    const username = normalizeUsername(req.body.username);
    const { password } = req.body;

    if (!username || !password) {
      return errorResponse(res, "Vui lòng nhập tên đăng nhập và mật khẩu", 400);
    }

    const user = await User.findOne({
      where: { username },
    });

    if (!user) {
      return errorResponse(
        res,
        "Tên đăng nhập hoặc mật khẩu không chính xác",
        401,
      );
    }

    if (Number(user.banned) === 1) {
      return errorResponse(res, "Tài khoản của bạn đã bị khóa", 403);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return errorResponse(
        res,
        "Tên đăng nhập hoặc mật khẩu không chính xác",
        401,
      );
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const refreshTokenExpiresAt = new Date();
    refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 30);

    await user.update({
      refresh_token_hash: hashToken(refreshToken),
      refresh_token_expires_at: refreshTokenExpiresAt,
      ip: req.clientIp,
    });

    await writeLog(user.id, `Đăng nhập thành công`, req.clientIp);

    return successResponse(res, "Đăng nhập thành công", {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        level: user.level,
        money: user.money,
        tong_nap: user.tong_nap,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function refreshToken(req, res) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return errorResponse(res, "Thiếu refresh token", 400);
    }

    const decoded = jwt.verify(refreshToken, env.jwt.refreshSecret, { algorithms: ["HS256"] });

    const user = await User.findOne({
      where: {
        id: decoded.id,
        refresh_token_hash: hashToken(refreshToken),
      },
    });

    if (!user) {
      return errorResponse(res, "Refresh token không hợp lệ", 401);
    }

    if (Number(user.banned) === 1) {
      return errorResponse(res, "Tài khoản của bạn đã bị khóa", 403);
    }

    if (
      user.refresh_token_expires_at &&
      new Date(user.refresh_token_expires_at).getTime() < Date.now()
    ) {
      return errorResponse(res, "Refresh token đã hết hạn", 401);
    }

    // Rotate refresh tokens so a stolen token cannot be replayed indefinitely.
    const accessToken = generateAccessToken(user);
    const nextRefreshToken = generateRefreshToken(user);
    const refreshTokenExpiresAt = new Date();
    refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 30);
    await user.update({
      refresh_token_hash: hashToken(nextRefreshToken),
      refresh_token_expires_at: refreshTokenExpiresAt,
    });

    return successResponse(res, "Làm mới token thành công", {
      accessToken,
      refreshToken: nextRefreshToken,
    });
  } catch (error) {
    return errorResponse(
      res,
      "Refresh token không hợp lệ hoặc đã hết hạn",
      401,
    );
  }
}

export async function logout(req, res) {
  try {
    await req.user.update({
      refresh_token_hash: null,
      refresh_token_expires_at: null,
    });

    return successResponse(res, "Đăng xuất thành công");
  } catch (error) {
    console.error("LOGOUT ERROR:", error);

    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function me(req, res) {
  return successResponse(res, "Lấy thông tin tài khoản thành công", {
    id: req.user.id,
    username: req.user.username,
    level: req.user.level,
    money: req.user.money,
    tong_nap: req.user.tong_nap,
  });
}
