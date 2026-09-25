import { Transaction } from "../../database/models.js";

import { successResponse, errorResponse } from "../../shared/utils/response.util.js";
import { parsePagination } from "../../shared/utils/pagination.util.js";

export async function getMyTransactions(req, res) {
  try {
    const { page, limit, offset } = parsePagination(req.query);

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
