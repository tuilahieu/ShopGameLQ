import { Bank } from "../models/index.js";
import { successResponse, errorResponse } from "../utils/response.util.js";

export async function getBanks(req, res) {
  try {
    const banks = await Bank.findAll({
      where: {
        status: 1,
      },
      order: [["id", "ASC"]],
    });

    return successResponse(res, "Lấy danh sách tài khoản ngân hàng thành công", banks);
  } catch (error) {
    console.error("GET BANKS ERROR:", error);
    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}
