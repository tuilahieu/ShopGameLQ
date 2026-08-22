import { Discount, GameAccount, Sale } from "../models/index.js";
import { successResponse, errorResponse } from "../utils/response.util.js";
import {
  calculateDiscountAmount,
  ensureDiscountIsAvailable,
  normalizeDiscountCode,
  parsePositiveId,
  validateSalePrice,
} from "../services/pricing.service.js";

// This is a preview only. Checkout repeats every check while rows are locked,
// so this endpoint can never reserve a voucher or authorize a price.
export async function checkDiscount(req, res) {
  try {
    const accountId = parsePositiveId(req.body.account_id, "account_id");
    const code = normalizeDiscountCode(req.body.code);
    const account = await GameAccount.findOne({ where: { id: accountId, status: 0 } });
    if (!account) return errorResponse(res, "Tài khoản không tồn tại hoặc không còn được bán", 404);

    const now = new Date();
    const originalPrice = validateSalePrice(account.gia, account.gia, { status: 409 });
    const sale = await Sale.findOne({
      where: { acc_id: account.id, status: 1 },
      order: [["id", "DESC"]],
    });
    const saleIsActive = sale && now >= new Date(sale.batdau) && now <= new Date(sale.ketthuc);
    const priceAfterSale = saleIsActive
      ? validateSalePrice(originalPrice, sale.sale_price, { status: 409 })
      : originalPrice;

    const discount = await Discount.findOne({ where: { magiamgia: code, status: 1 } });
    if (!discount) return errorResponse(res, "Mã giảm giá không tồn tại", 404);
    ensureDiscountIsAvailable(discount, now);
    const discountAmount = calculateDiscountAmount(priceAfterSale, discount, { status: 409 });

    return successResponse(res, "Áp dụng mã giảm giá thành công", {
      original_price: originalPrice,
      sale_price: saleIsActive ? priceAfterSale : null,
      discount_amount: discountAmount,
      final_price: priceAfterSale - discountAmount,
      discount: {
        id: discount.id,
        magiamgia: discount.magiamgia,
        theo: discount.theo,
        giamgia: discount.giamgia,
      },
    });
  } catch (error) {
    console.error("CHECK DISCOUNT ERROR:", error);
    const status = error.status >= 400 && error.status < 500 ? error.status : 500;
    return errorResponse(res, status === 500 ? "Có lỗi xảy ra" : error.message, status);
  }
}
