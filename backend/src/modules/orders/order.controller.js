import { sequelize } from "../../config/database.js";

import {
  User,
  GameAccount,
  Order,
  Sale,
  Discount,
  Setting,
  IdempotencyKey,
} from "../../database/models.js";

import { successResponse, errorResponse } from "../../shared/utils/response.util.js";
import { writeLog } from "../../shared/utils/log.util.js";
import { decryptCredential } from "../../shared/utils/credential.util.js";
import { applyWalletMutation } from "../wallet/wallet.service.js";
import { completeIdempotencyKey, getIdempotencyInput, reserveIdempotencyKey } from "./idempotency.service.js";
import {
  calculateDiscountAmount,
  ensureDiscountIsAvailable,
  normalizeDiscountCode,
  parsePercentage,
  parsePositiveId,
  parseSafeBalance,
  resolveAccountPricing,
} from "../commerce/pricing.service.js";
import { buildActiveSaleWhere } from "../promotions/sale.service.js";

async function attachPurchasedCredential(payload, userId, transaction) {
  // Never persist a decrypted credential inside idempotency_keys. It is resolved
  // again from the account that is already owned by this exact user.
  const { login: _legacyLogin, ...safePayload } = payload || {};
  const accountId = parsePositiveId(safePayload.account_id, "account_id");
  const account = await GameAccount.findOne({
    where: { id: accountId, buyer_id: userId, status: 1 },
    attributes: ["login"],
    transaction,
  });
  if (!account) throw Object.assign(new Error("Không thể xác minh tài khoản đã mua"), { status: 409 });
  return { ...safePayload, login: decryptCredential(account.login) };
}

export async function buyAccount(req, res) {
  const dbTransaction = await sequelize.transaction();
  let finished = false;
  let idempotencyInput;
  let userId;

  try {
    userId = req.user.id;
    const accountId = parsePositiveId(req.body.account_id, "account_id");
    const discountCode = req.body.discount_code ? normalizeDiscountCode(req.body.discount_code) : null;
    idempotencyInput = getIdempotencyInput(req, { required: true });

    const idempotency = await reserveIdempotencyKey({
      scope: `buy-account:${userId}`,
      input: idempotencyInput,
      transaction: dbTransaction,
    });
    if (idempotency?.replay) {
      const responseData = await attachPurchasedCredential(idempotency.replay.response_body, userId, dbTransaction);
      await dbTransaction.commit();
      finished = true;
      return successResponse(res, "Yêu cầu mua hàng đã được xử lý trước đó", responseData);
    }

    const account = await GameAccount.findByPk(accountId, {
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

    // A CTV must not self-purchase a listing because that bypasses the intended
    // seller/commission separation. Administrators may do this for operational
    // testing and account recovery workflows.
    if (Number(account.seller_id) === Number(userId) && Number(req.user.level) === 1) {
      await dbTransaction.rollback();
      return errorResponse(res, "CTV không thể tự mua tài khoản do chính mình đăng bán", 403);
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

    const sale = await Sale.findOne({
      where: buildActiveSaleWhere({ now, accountId: account.id }),
      transaction: dbTransaction,
      lock: true,
      order: [["id", "DESC"]],
    });
    const pricing = resolveAccountPricing(account, sale, { status: 409 });
    const originalPrice = pricing.originalPrice;
    const saleId = pricing.saleId;
    const salePrice = pricing.salePrice;
    const priceAfterSale = pricing.finalPrice;

    let discountId = null;
    let discountAmount = 0;

    if (discountCode) {
      const discount = await Discount.findOne({
        where: {
          magiamgia: discountCode,
          status: 1,
        },
        transaction: dbTransaction,
        lock: true,
      });

      if (!discount) {
        await dbTransaction.rollback();
        return errorResponse(res, "Mã giảm giá không tồn tại", 404);
      }

      ensureDiscountIsAvailable(discount, now);

      discountId = discount.id;

      discountAmount = calculateDiscountAmount(priceAfterSale, discount, { status: 409 });

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

    if (!Number.isSafeInteger(finalPrice) || finalPrice <= 0) {
      await dbTransaction.rollback();
      finished = true;
      return errorResponse(res, "Giao dịch có giá trị không hợp lệ", 409);
    }

    if (parseSafeBalance(user.money) < finalPrice) {
      await dbTransaction.rollback();
      finished = true;
      return errorResponse(res, "Số dư không đủ để mua tài khoản này", 400);
    }

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

    const { balanceAfter } = await applyWalletMutation({
      user,
      amount: finalPrice,
      direction: -1,
      type: "buy_acc",
      referenceId: order.id,
      description: `Mua tài khoản #${account.id}`,
      transaction: dbTransaction,
    });

    await account.update({ status: 1, buyer_id: user.id, ngaymua: new Date() }, { transaction: dbTransaction });

    // CTV commission earning logic
    if (account.seller_id) {
      const seller = await User.findByPk(account.seller_id, {
        transaction: dbTransaction,
        lock: true,
      });
      if (seller && Number(seller.level) === 1) {
        const setting = await Setting.findOne({ transaction: dbTransaction, lock: true });
        const ckCtv = parsePercentage(setting?.ck_ctv ?? 0, "Chiết khấu CTV", { min: 0, max: 100 });
        const ctvEarn = Math.floor((finalPrice * ckCtv) / 100);

        if (ctvEarn > 0) {
          await applyWalletMutation({
            user: seller, amount: ctvEarn, direction: 1, type: "ctv_earn", referenceId: order.id,
            description: `Hoa hồng bán tài khoản #${account.id} (${ckCtv}%)`, transaction: dbTransaction,
          });
        }
      }
    }

    const responsePayload = {
      order_id: order.id,
      account_id: account.id,
      original_price: originalPrice,
      sale_price: salePrice,
      discount_amount: discountAmount,
      final_price: finalPrice,
      balance_after: balanceAfter,
    };
    await completeIdempotencyKey(idempotency, { status: 200, body: responsePayload, transaction: dbTransaction });
    await dbTransaction.commit();
    finished = true;
    writeLog(user.id, `Mua tài khoản #${account.id}, đơn #${order.id}`, req.clientIp);
    return successResponse(res, "Mua tài khoản thành công", await attachPurchasedCredential(responsePayload, userId));
  } catch (error) {
    if (!finished) await dbTransaction.rollback();

    // A concurrent retry may race while creating the unique key. MySQL releases the
    // conflicting statement only after the original transaction commits, so replay it.
    if (error.name === "SequelizeUniqueConstraintError" && idempotencyInput) {
      const completedRequest = await IdempotencyKey.findOne({
        where: { scope: `buy-account:${userId}`, key: idempotencyInput.key, status: "completed" },
      });
      if (completedRequest?.request_hash === idempotencyInput.requestHash) {
        return successResponse(res, "Yêu cầu mua hàng đã được xử lý trước đó", await attachPurchasedCredential(completedRequest.response_body, userId));
      }
    }

    console.error("BUY ACCOUNT ERROR:", error);

    return errorResponse(res, error.status >= 400 && error.status < 500 ? error.message : "Có lỗi xảy ra, vui lòng thử lại sau", error.status >= 400 && error.status < 500 ? error.status : 500);
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

    const orderData = order.toJSON();
    if (orderData.account?.login) orderData.account.login = decryptCredential(orderData.account.login);
    return successResponse(res, "Lấy thông tin đơn hàng thành công", orderData);
  } catch (error) {
    console.error("GET ORDER DETAIL ERROR:", error);

    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}
