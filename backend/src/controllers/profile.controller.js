import bcrypt from "bcryptjs";

import { User, Order, Transaction, GameAccount } from "../models/index.js";

import { successResponse, errorResponse } from "../utils/response.util.js";

import { writeLog } from "../utils/log.util.js";

export async function getProfile(req, res) {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: [
        "id",
        "username",
        "level",
        "money",
        "tong_nap",
        "banned",
        "ip",
        "created_at",
        "updated_at",
      ],
    });

    if (!user) {
      return errorResponse(res, "Không tìm thấy tài khoản", 404);
    }

    const [totalOrders, totalTransactions, totalPurchasedAccounts] =
      await Promise.all([
        Order.count({
          where: {
            user_id: user.id,
          },
        }),

        Transaction.count({
          where: {
            user_id: user.id,
          },
        }),

        GameAccount.count({
          where: {
            buyer_id: user.id,
            status: 1,
          },
        }),
      ]);

    return successResponse(res, "Lấy thông tin cá nhân thành công", {
      user,
      stats: {
        totalOrders,
        totalTransactions,
        totalPurchasedAccounts,
      },
    });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);

    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function changePassword(req, res) {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return errorResponse(res, "Vui lòng nhập đầy đủ thông tin", 400);
    }

    if (newPassword.length < 6) {
      return errorResponse(res, "Mật khẩu mới phải có ít nhất 6 ký tự", 400);
    }

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return errorResponse(res, "Không tìm thấy tài khoản", 404);
    }

    const isValidPassword = await bcrypt.compare(oldPassword, user.password);

    if (!isValidPassword) {
      return errorResponse(res, "Mật khẩu hiện tại không chính xác", 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await user.update({
      password: hashedPassword,
      refresh_token_hash: null,
      refresh_token_expires_at: null,
    });

    await writeLog(user.id, "Người dùng đổi mật khẩu", req.ip);

    return successResponse(
      res,
      "Đổi mật khẩu thành công, vui lòng đăng nhập lại",
    );
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);

    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}
