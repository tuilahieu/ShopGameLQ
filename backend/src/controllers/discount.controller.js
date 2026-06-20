import { Discount, GameAccount, Sale } from "../models/index.js";

import { successResponse, errorResponse } from "../utils/response.util.js";

export async function checkDiscount(req, res) {
  try {
    const { code, account_id } = req.body;

    if (!code) {
      return errorResponse(res, "Vui lòng nhập mã giảm giá", 400);
    }

    if (!account_id) {
      return errorResponse(res, "Thiếu account_id", 400);
    }

    const account = await GameAccount.findByPk(account_id);

    if (!account) {
      return errorResponse(res, "Tài khoản không tồn tại", 404);
    }

    const now = new Date();

    let finalPrice = Number(account.gia);

    const sale = await Sale.findOne({
      where: {
        acc_id: account.id,
        status: 1,
      },
    });

    if (sale && now >= sale.batdau && now <= sale.ketthuc) {
      finalPrice = Number(sale.sale_price);
    }

    const discount = await Discount.findOne({
      where: {
        magiamgia: code,
        status: 1,
      },
    });

    if (!discount) {
      return errorResponse(res, "Mã giảm giá không tồn tại", 404);
    }

    if (discount.batdau && now < discount.batdau) {
      return errorResponse(res, "Mã giảm giá chưa có hiệu lực", 400);
    }

    if (discount.ketthuc && now > discount.ketthuc) {
      return errorResponse(res, "Mã giảm giá đã hết hạn", 400);
    }

    if (Number(discount.soluong) <= 0) {
      return errorResponse(res, "Mã giảm giá đã hết lượt sử dụng", 400);
    }

    let discountAmount = 0;

    if (discount.theo === "phantram") {
      discountAmount = Math.floor(
        (finalPrice * Number(discount.giamgia)) / 100,
      );
    } else {
      discountAmount = Number(discount.giamgia);
    }

    if (discountAmount > finalPrice) {
      discountAmount = finalPrice;
    }

    return successResponse(res, "Áp dụng mã giảm giá thành công", {
      original_price: Number(account.gia),

      sale_price: sale?.sale_price || null,

      discount_amount: discountAmount,

      final_price: finalPrice - discountAmount,

      discount,
    });
  } catch (error) {
    console.error(error);

    return errorResponse(res, "Có lỗi xảy ra", 500);
  }
}
