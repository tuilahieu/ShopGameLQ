import { sequelize } from "../config/database.js";

import {
  User,
  GameAccount,
  Order,
  Transaction,
  Sale,
  Discount,
  Setting,
} from "../models/index.js";

import { successResponse, errorResponse } from "../utils/response.util.js";
import { writeLog } from "../utils/log.util.js";

export async function buyAccount(req, res) {
  const dbTransaction = await sequelize.transaction();

  try {
    const userId = req.user.id;
    const { account_id, discount_code } = req.body;

    if (!account_id) {
      await dbTransaction.rollback();
      return errorResponse(res, "Vui lòng chọn tài khoản cần mua", 400);
    }

    const account = await GameAccount.findByPk(account_id, {
      transaction: dbTransaction,
      lock: true,
    });

    if (!account) {
      await dbTransaction.rollback();
      return errorResponse(res, "Tài khoản không tồn tại", 404);
    }

    if (Number(account.status) !== 0) {
      await dbTransaction.rollback();
      return errorResponse(res, "Tài khoản này đã được bán", 400);
    }

    const user = await User.findByPk(userId, {
      transaction: dbTransaction,
      lock: true,
    });

    if (!user) {
      await dbTransaction.rollback();
      return errorResponse(res, "Người dùng không tồn tại", 404);
    }

    if (Number(user.banned) === 1) {
      await dbTransaction.rollback();

      return errorResponse(
        res,
        "Tài khoản của bạn đã bị khóa, không thể thực hiện giao dịch",
        403,
      );
    }

    const now = new Date();

    const originalPrice = Number(account.gia);
    let saleId = null;
    let salePrice = null;
    let priceAfterSale = originalPrice;

    const sale = await Sale.findOne({
      where: {
        acc_id: account.id,
        status: 1,
      },
      transaction: dbTransaction,
      lock: true,
    });

    if (sale && now >= new Date(sale.batdau) && now <= new Date(sale.ketthuc)) {
      saleId = sale.id;
      salePrice = Number(sale.sale_price);
      priceAfterSale = salePrice;
    }

    let discountId = null;
    let discountAmount = 0;

    if (discount_code) {
      const discount = await Discount.findOne({
        where: {
          magiamgia: discount_code,
          status: 1,
        },
        transaction: dbTransaction,
        lock: true,
      });

      if (!discount) {
        await dbTransaction.rollback();
        return errorResponse(res, "Mã giảm giá không tồn tại", 404);
      }

      if (discount.batdau && now < new Date(discount.batdau)) {
        await dbTransaction.rollback();
        return errorResponse(res, "Mã giảm giá chưa có hiệu lực", 400);
      }

      if (discount.ketthuc && now > new Date(discount.ketthuc)) {
        await dbTransaction.rollback();
        return errorResponse(res, "Mã giảm giá đã hết hạn", 400);
      }

      if (Number(discount.soluong) <= 0) {
        await dbTransaction.rollback();
        return errorResponse(res, "Mã giảm giá đã hết lượt sử dụng", 400);
      }

      discountId = discount.id;

      if (discount.theo === "phantram") {
        discountAmount = Math.floor(
          (priceAfterSale * Number(discount.giamgia)) / 100,
        );
      } else {
        discountAmount = Number(discount.giamgia);
      }

      if (discountAmount > priceAfterSale) {
        discountAmount = priceAfterSale;
      }

      await discount.update(
        {
          soluong: Number(discount.soluong) - 1,
        },
        {
          transaction: dbTransaction,
        },
      );
    }

    const finalPrice = priceAfterSale - discountAmount;

    if (finalPrice < 0) {
      await User.update({ banned: 1 }, { where: { id: user.id } });
      await dbTransaction.rollback();
      return errorResponse(res, "Giao dịch không hợp lệ. Tài khoản của bạn đã bị khóa.", 403);
    }

    if (Number(user.money) < finalPrice) {
      if (Number(user.money) < 0) {
        await User.update({ banned: 1 }, { where: { id: user.id } });
        await dbTransaction.rollback();
        return errorResponse(res, "Giao dịch bất thường. Tài khoản của bạn đã bị khóa.", 403);
      }
      await dbTransaction.rollback();
      return errorResponse(res, "Số dư không đủ để mua tài khoản này", 400);
    }

    const balanceBefore = Number(user.money);
    const balanceAfter = balanceBefore - finalPrice;

    if (balanceAfter < 0 || balanceBefore < 0) {
      await User.update({ banned: 1 }, { where: { id: user.id } });
      await dbTransaction.rollback();
      return errorResponse(res, "Giao dịch bất thường. Tài khoản của bạn đã bị khóa.", 403);
    }

    await user.update(
      {
        money: balanceAfter,
      },
      {
        transaction: dbTransaction,
      },
    );

    await account.update(
      {
        status: 1,
        buyer_id: user.id,
        ngaymua: new Date(),
      },
      {
        transaction: dbTransaction,
      },
    );

    const order = await Order.create(
      {
        user_id: user.id,
        acc_id: account.id,

        original_price: originalPrice,

        sale_id: saleId,
        sale_price: salePrice,

        discount_id: discountId,
        discount_amount: discountAmount,

        final_price: finalPrice,

        status: 1,
      },
      {
        transaction: dbTransaction,
      },
    );

    await Transaction.create(
      {
        user_id: user.id,
        type: "buy_acc",

        amount: finalPrice,

        balance_before: balanceBefore,
        balance_after: balanceAfter,

        reference_id: order.id,

        description: `Mua tài khoản #${account.id}`,
      },
      {
        transaction: dbTransaction,
      },
    );

    // CTV commission earning logic
    if (account.seller_id) {
      const seller = await User.findByPk(account.seller_id, {
        transaction: dbTransaction,
        lock: true,
      });
      if (seller && Number(seller.level) === 1) {
        const setting = await Setting.findOne({ transaction: dbTransaction });
        const ckCtv = setting ? Number(setting.ck_ctv || 0) : 0;
        const ctvEarn = Math.floor(finalPrice * (100 - ckCtv) / 100);

        if (ctvEarn > 0) {
          const ctvBalanceBefore = Number(seller.money);
          const ctvBalanceAfter = ctvBalanceBefore + ctvEarn;

          await seller.update(
            { money: ctvBalanceAfter },
            { transaction: dbTransaction }
          );

          await Transaction.create(
            {
              user_id: seller.id,
              type: "ctv_earn",
              amount: ctvEarn,
              balance_before: ctvBalanceBefore,
              balance_after: ctvBalanceAfter,
              reference_id: order.id,
              description: `Bán tài khoản #${account.id} (Chiết khấu shop: ${ckCtv}%)`,
            },
            {
              transaction: dbTransaction,
            }
          );
        }
      }
    }

    await dbTransaction.commit();

    return successResponse(res, "Mua tài khoản thành công", {
      order_id: order.id,
      account_id: account.id,
      original_price: originalPrice,
      sale_price: salePrice,
      discount_amount: discountAmount,
      final_price: finalPrice,
      balance_after: balanceAfter,
      login: account.login,
    });
  } catch (error) {
    await dbTransaction.rollback();

    console.error("BUY ACCOUNT ERROR:", error);

    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function getMyOrders(req, res) {
  try {
    const orders = await Order.findAll({
      where: {
        user_id: req.user.id,
      },
      include: [
        {
          model: GameAccount,
          as: "account",
          attributes: {
            exclude: ["login"],
          },
        },
      ],
      order: [["id", "DESC"]],
    });

    return successResponse(res, "Lấy danh sách đơn hàng thành công", orders);
  } catch (error) {
    console.error("GET MY ORDERS ERROR:", error);

    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function getOrderDetail(req, res) {
  try {
    const { id } = req.params;

    const order = await Order.findOne({
      where: {
        id,
        user_id: req.user.id,
      },
      include: [
        {
          model: GameAccount,
          as: "account",
        },
      ],
    });

    if (!order) {
      return errorResponse(res, "Không tìm thấy đơn hàng", 404);
    }

    return successResponse(res, "Lấy thông tin đơn hàng thành công", order);
  } catch (error) {
    console.error("GET ORDER DETAIL ERROR:", error);

    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}
