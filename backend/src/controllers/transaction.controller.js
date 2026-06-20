import { Transaction } from "../models/index.js";

import { successResponse, errorResponse } from "../utils/response.util.js";

export async function getMyTransactions(req, res) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);

    const offset = (page - 1) * limit;

    const { count, rows } = await Transaction.findAndCountAll({
      where: {
        user_id: req.user.id,
      },
      order: [["id", "DESC"]],
      limit,
      offset,
    });

    return successResponse(res, "Lấy lịch sử giao dịch thành công", {
      transactions: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPage: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error(error);

    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}
