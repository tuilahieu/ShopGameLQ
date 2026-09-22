import { sequelize } from "../config/database.js";
import { Op } from "sequelize";

import {
  User,
  GameAccount,
  Order,
  Transaction,
  Sale,
  Discount,
  Setting,
  HistoryLog,
  Bank,
  IdempotencyKey,
} from "../models/index.js";

import { successResponse, errorResponse } from "../utils/response.util.js";
import { writeLog } from "../utils/log.util.js";
import { parsePagination } from "../utils/pagination.util.js";
import { parseMoney, requirePositiveMoney } from "../utils/money.util.js";
import { applyWalletMutation } from "../services/wallet.service.js";
import { decryptCredential } from "../utils/credential.util.js";
import { completeIdempotencyKey, getIdempotencyInput, reserveIdempotencyKey } from "../services/idempotency.service.js";
import {
  parseDate,
  parsePercentage,
  parsePositiveId,
  validateDiscountDefinition,
  validateSalePrice,
} from "../services/pricing.service.js";

function toNumber(value) {
  return Number(value || 0);
}

function parseBinaryStatus(value, fieldName = "Trạng thái") {
  if (![0, 1, "0", "1", false, true].includes(value)) {
    throw Object.assign(new Error(`${fieldName} không hợp lệ`), { status: 400 });
  }
  return Number(value) === 1 || value === true ? 1 : 0;
}

async function validateSaleInput(values, { transaction, excludeId = null, lockedAccount = null } = {}) {
  const accId = parsePositiveId(values.acc_id, "acc_id");
  const account = lockedAccount || await GameAccount.findByPk(accId, { transaction, lock: transaction ? true : undefined });
  if (!account) throw Object.assign(new Error("Tài khoản không tồn tại"), { status: 404 });
  if (Number(account.status) !== 0) throw Object.assign(new Error("Chỉ có thể tạo sale cho tài khoản đang bán"), { status: 409 });

  const start = parseDate(values.batdau, "Thời gian bắt đầu");
  const end = parseDate(values.ketthuc, "Thời gian kết thúc");
  if (end <= start) throw Object.assign(new Error("Thời gian kết thúc phải sau thời gian bắt đầu"), { status: 400 });
  const status = parseBinaryStatus(values.status);
  const salePrice = validateSalePrice(account.gia, values.sale_price);

  if (salePrice >= Number(account.gia)) {
    throw Object.assign(new Error("Giá sale phải thấp hơn giá bán gốc để áp dụng khuyến mãi"), { status: 400 });
  }

  if (status === 1) {
    const overlaps = await Sale.findOne({
      where: {
        acc_id: accId,
        status: 1,
        ...(excludeId && { id: { [Op.ne]: excludeId } }),
        batdau: { [Op.lte]: end },
        ketthuc: { [Op.gte]: start },
      },
      transaction,
      lock: transaction ? true : undefined,
    });
    if (overlaps) throw Object.assign(new Error("Tài khoản đã có sale trùng khoảng thời gian"), { status: 409 });
  }

  return { acc_id: accId, sale_price: salePrice, batdau: start, ketthuc: end, status };
}

export async function getAdminDashboard(req, res) {
  try {
    const [
      totalUsers,
      totalAccounts,
      sellingAccounts,
      soldAccounts,
      hiddenAccounts,
      totalOrders,
      totalTransactions,
      revenue,
    ] = await Promise.all([
      User.count(),
      GameAccount.count(),
      GameAccount.count({ where: { status: 0 } }),
      GameAccount.count({ where: { status: 1 } }),
      GameAccount.count({ where: { status: 2 } }),
      Order.count(),
      Transaction.count(),
      Order.sum("final_price", { where: { status: 1 } }),
    ]);

    return successResponse(res, "Lấy dữ liệu dashboard thành công", {
      totalUsers,
      totalAccounts,
      sellingAccounts,
      soldAccounts,
      hiddenAccounts,
      totalOrders,
      totalTransactions,
      revenue: toNumber(revenue),
    });
  } catch (error) {
    console.error("GET ADMIN DASHBOARD ERROR:", error);
    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function getAdminUsers(req, res) {
  try {
    const { page, limit, offset } = parsePagination(req.query);

    const where = {};
    if (req.query.search) {
      where.username = {
        [Op.like]: `%${req.query.search}%`
      };
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: {
        exclude: [
          "password", "refresh_token_hash", "admin_second_password_hash",
          "admin_session_hash", "admin_session_expires_at",
          "admin_second_attempts", "admin_second_locked_until",
        ],
      },
      order: [["id", "DESC"]],
      limit,
      offset,
    });

    return successResponse(res, "Lấy danh sách người dùng thành công", {
      users: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPage: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("GET ADMIN USERS ERROR:", error);
    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function updateAdminUser(req, res) {
  try {
    const { id } = req.params;
    const { level, banned } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return errorResponse(res, "Không tìm thấy người dùng", 404);
    }

    if (Number(id) === Number(req.user.id) && (level !== undefined || banned === true || Number(banned) === 1)) {
      return errorResponse(res, "Không thể tự thay đổi quyền hoặc khóa chính tài khoản admin đang dùng", 400);
    }
    if (level !== undefined && ![0, 1, 99].includes(Number(level))) {
      return errorResponse(res, "Cấp tài khoản không hợp lệ", 400);
    }
    if (banned !== undefined && ![true, false, 0, 1, "0", "1"].includes(banned)) {
      return errorResponse(res, "Trạng thái khóa không hợp lệ", 400);
    }
    await user.update({
      ...(level !== undefined && { level: Number(level), admin_session_hash: null, admin_session_expires_at: null }),
      ...(banned !== undefined && { banned: Number(banned) === 1 || banned === true, admin_session_hash: null, admin_session_expires_at: null }),
    });
    await writeLog(req.user.id, `Cập nhật người dùng #${user.id}`, req.clientIp);

    return successResponse(res, "Cập nhật người dùng thành công", {
      id: user.id,
      username: user.username,
      level: user.level,
      banned: user.banned,
    });
  } catch (error) {
    console.error("UPDATE ADMIN USER ERROR:", error);
    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function updateUserMoney(req, res) {
  const dbTransaction = await sequelize.transaction();
  let finished = false;
  let idempotencyInput;
  let targetUserId;

  try {
    const { id } = req.params;
    const { type, amount, description } = req.body;
    const userId = parsePositiveId(id, "user_id");
    targetUserId = userId;
    idempotencyInput = getIdempotencyInput(req, { required: true });

    const idempotency = await reserveIdempotencyKey({
      scope: `admin-money:${req.user.id}:${userId}`,
      input: idempotencyInput,
      transaction: dbTransaction,
    });
    if (idempotency?.replay) {
      await dbTransaction.commit();
      finished = true;
      return successResponse(res, "Yêu cầu điều chỉnh số dư đã được xử lý trước đó", idempotency.replay.response_body);
    }

    if (!["add", "sub"].includes(type)) {
      await dbTransaction.rollback();
      return errorResponse(res, "Loại thao tác không hợp lệ", 400);
    }

    const moneyAmount = requirePositiveMoney(amount);
    if (!moneyAmount) {
      await dbTransaction.rollback();
      return errorResponse(res, "Số tiền không hợp lệ", 400);
    }
    const auditDescription = typeof description === "string" ? description.trim() : "";
    if (auditDescription.length < 3 || auditDescription.length > 500) {
      await dbTransaction.rollback();
      return errorResponse(res, "Vui lòng nhập lý do điều chỉnh từ 3 đến 500 ký tự", 400);
    }

    const user = await User.findByPk(userId, {
      transaction: dbTransaction,
      lock: true,
    });

    if (!user) {
      await dbTransaction.rollback();
      return errorResponse(res, "Không tìm thấy người dùng", 404);
    }

    const { balanceBefore, balanceAfter } = await applyWalletMutation({
      user, amount: moneyAmount, direction: type === "add" ? 1 : -1,
      type: type === "add" ? "admin_add" : "admin_sub",
      description: auditDescription,
      transaction: dbTransaction,
    });
    if (type === "add") {
      const totalDeposit = parseMoney(user.tong_nap);
      const nextTotalDeposit = totalDeposit === null ? null : totalDeposit + moneyAmount;
      if (!Number.isSafeInteger(nextTotalDeposit)) {
        throw Object.assign(new Error("Tổng tiền nạp không hợp lệ"), { status: 409 });
      }
      await user.update({ tong_nap: nextTotalDeposit }, { transaction: dbTransaction });
    }

    const responseData = {
      user_id: user.id,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
    };
    await completeIdempotencyKey(idempotency, { status: 200, body: responseData, transaction: dbTransaction });

    await dbTransaction.commit();
    finished = true;
    writeLog(req.user.id, `${type === "add" ? "Cộng" : "Trừ"} ${moneyAmount} vào ví người dùng #${user.id}`, req.clientIp);

    return successResponse(res, "Cập nhật số dư thành công", responseData);
  } catch (error) {
    if (!finished) await dbTransaction.rollback();

    if (error.name === "SequelizeUniqueConstraintError" && idempotencyInput) {
      const completedRequest = await IdempotencyKey.findOne({
        where: { scope: `admin-money:${req.user.id}:${targetUserId}`, key: idempotencyInput.key, status: "completed" },
      });
      if (completedRequest?.request_hash === idempotencyInput.requestHash) {
        return successResponse(res, "Yêu cầu điều chỉnh số dư đã được xử lý trước đó", completedRequest.response_body);
      }
    }

    console.error("UPDATE USER MONEY ERROR:", error);
    const status = error.status >= 400 && error.status < 500 ? error.status : 500;
    return errorResponse(res, status === 500 ? "Có lỗi xảy ra, vui lòng thử lại sau" : error.message, status);
  }
}

export async function getAdminAccounts(req, res) {
  try {
    const { page, limit, offset } = parsePagination(req.query);

    const where = {};

    if (req.query.id) {
      where.id = req.query.id;
    }

    if (req.query.status !== undefined && req.query.status !== "") {
      where.status = req.query.status;
    }

    if (req.query.loai_id) {
      where.loai_id = req.query.loai_id;
    }

    if (req.query.seller_id) {
      where.seller_id = req.query.seller_id;
    }

    const { count, rows } = await GameAccount.findAndCountAll({
      where,
      order: [["id", "DESC"]],
      limit,
      offset,
      include: [
        {
          model: User,
          as: "buyer",
          attributes: ["id", "username", "level"],
        },
        {
          model: User,
          as: "seller",
          attributes: ["id", "username", "level"],
        }
      ]
    });

    return successResponse(res, "Lấy danh sách tài khoản thành công", {
      // This route is admin-only; decrypt only at the final response boundary.
      accounts: rows.map((account) => ({ ...account.toJSON(), login: decryptCredential(account.login) })),
      pagination: {
        page,
        limit,
        total: count,
        totalPage: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("GET ADMIN ACCOUNTS ERROR:", error);
    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function getAdminOrders(req, res) {
  try {
    const { page, limit, offset } = parsePagination(req.query);

    const where = {};

    if (req.query.status !== undefined && req.query.status !== "") {
      where.status = req.query.status;
    }

    if (req.query.user_id) {
      where.user_id = req.query.user_id;
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "level"],
        },
        {
          model: GameAccount,
          as: "account",
        },
      ],
      order: [["id", "DESC"]],
      limit,
      offset,
    });

    return successResponse(res, "Lấy danh sách đơn hàng thành công", {
      orders: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPage: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("GET ADMIN ORDERS ERROR:", error);
    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function getAdminTransactions(req, res) {
  try {
    const { page, limit, offset } = parsePagination(req.query);

    const where = {};

    if (req.query.user_id) {
      where.user_id = req.query.user_id;
    }

    if (req.query.type) {
      where.type = req.query.type;
    }

    if (req.query.search) {
      const users = await User.findAll({
        where: {
          username: {
            [Op.like]: `%${req.query.search}%`
          }
        },
        attributes: ["id"]
      });
      const userIds = users.map(u => u.id);
      const numVal = Number(req.query.search);
      if (!isNaN(numVal)) {
        userIds.push(numVal);
      }
      where.user_id = {
        [Op.in]: userIds
      };
    }

    const { count, rows } = await Transaction.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "level"],
        },
      ],
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
    console.error("GET ADMIN TRANSACTIONS ERROR:", error);
    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function getAdminSales(req, res) {
  try {
    const sales = await Sale.findAll({
      include: [
        {
          model: GameAccount,
          as: "account",
        },
      ],
      order: [["id", "DESC"]],
    });

    return successResponse(res, "Lấy danh sách sale thành công", sales);
  } catch (error) {
    console.error("GET ADMIN SALES ERROR:", error);
    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function createAdminSale(req, res) {
  const dbTransaction = await sequelize.transaction();
  let finished = false;
  try {
    const { acc_id, sale_price, batdau, ketthuc, status = 1 } = req.body;
    const saleData = await validateSaleInput({ acc_id, sale_price, batdau, ketthuc, status }, { transaction: dbTransaction });
    const sale = await Sale.create(saleData, { transaction: dbTransaction });
    await dbTransaction.commit();
    finished = true;

    return successResponse(res, "Thêm sale thành công", sale);
  } catch (error) {
    if (!finished) await dbTransaction.rollback();
    console.error("CREATE ADMIN SALE ERROR:", error);
    const status = error.status >= 400 && error.status < 500 ? error.status : 500;
    return errorResponse(res, status === 500 ? "Có lỗi xảy ra, vui lòng thử lại sau" : error.message, status);
  }
}

export async function updateAdminSale(req, res) {
  const dbTransaction = await sequelize.transaction();
  let finished = false;
  try {
    const { id } = req.params;
    const { acc_id, sale_price, batdau, ketthuc, status } = req.body;

    const saleId = parsePositiveId(id, "sale_id");
    // Keep the lock order identical to checkout: account first, then sale.
    // This avoids a checkout/admin-edit deadlock under load.
    const snapshot = await Sale.findByPk(saleId, { transaction: dbTransaction });

    if (!snapshot) {
      await dbTransaction.rollback();
      return errorResponse(res, "Không tìm thấy sale", 404);
    }
    const intendedAccountId = parsePositiveId(acc_id ?? snapshot.acc_id, "acc_id");
    const lockedAccount = await GameAccount.findByPk(intendedAccountId, { transaction: dbTransaction, lock: true });
    if (!lockedAccount) throw Object.assign(new Error("Tài khoản không tồn tại"), { status: 404 });
    const sale = await Sale.findByPk(saleId, { transaction: dbTransaction, lock: true });
    if (!sale || (acc_id === undefined && Number(sale.acc_id) !== intendedAccountId)) {
      throw Object.assign(new Error("Sale vừa được thay đổi, vui lòng thử lại"), { status: 409 });
    }
    const saleData = await validateSaleInput({
      acc_id: acc_id ?? sale.acc_id,
      sale_price: sale_price ?? sale.sale_price,
      batdau: batdau ?? sale.batdau,
      ketthuc: ketthuc ?? sale.ketthuc,
      status: status ?? sale.status,
    }, { transaction: dbTransaction, excludeId: sale.id, lockedAccount });
    await sale.update(saleData, { transaction: dbTransaction });
    await dbTransaction.commit();
    finished = true;

    return successResponse(res, "Cập nhật sale thành công", sale);
  } catch (error) {
    if (!finished) await dbTransaction.rollback();
    console.error("UPDATE ADMIN SALE ERROR:", error);
    const status = error.status >= 400 && error.status < 500 ? error.status : 500;
    return errorResponse(res, status === 500 ? "Có lỗi xảy ra, vui lòng thử lại sau" : error.message, status);
  }
}

export async function deleteAdminSale(req, res) {
  try {
    const { id } = req.params;

    const sale = await Sale.findByPk(id);

    if (!sale) {
      return errorResponse(res, "Không tìm thấy sale", 404);
    }

    await sale.update({
      status: 0,
    });

    return successResponse(res, "Tắt sale thành công");
  } catch (error) {
    console.error("DELETE ADMIN SALE ERROR:", error);
    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function getAdminDiscounts(req, res) {
  try {
    const discounts = await Discount.findAll({
      order: [["id", "DESC"]],
    });

    return successResponse(
      res,
      "Lấy danh sách mã giảm giá thành công",
      discounts,
    );
  } catch (error) {
    console.error("GET ADMIN DISCOUNTS ERROR:", error);
    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function createAdminDiscount(req, res) {
  try {
    const {
      magiamgia,
      giamgia,
      theo = "phantram",
      batdau,
      ketthuc,
      soluong = 1,
      status = 1,
    } = req.body;

    const discountData = validateDiscountDefinition({ magiamgia, giamgia, theo, batdau, ketthuc, soluong, status });
    const discount = await Discount.create(discountData);

    return successResponse(res, "Thêm mã giảm giá thành công", discount);
  } catch (error) {
    console.error("CREATE ADMIN DISCOUNT ERROR:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return errorResponse(res, "Mã giảm giá đã tồn tại", 409);
    }

    const statusCode = error.status >= 400 && error.status < 500 ? error.status : 500;
    return errorResponse(res, statusCode === 500 ? "Có lỗi xảy ra, vui lòng thử lại sau" : error.message, statusCode);
  }
}

export async function updateAdminDiscount(req, res) {
  try {
    const { id } = req.params;

    const { magiamgia, giamgia, theo, batdau, ketthuc, soluong, status } =
      req.body;

    const discount = await Discount.findByPk(id);

    if (!discount) {
      return errorResponse(res, "Không tìm thấy mã giảm giá", 404);
    }

    const discountData = validateDiscountDefinition({
      magiamgia: magiamgia ?? discount.magiamgia,
      giamgia: giamgia ?? discount.giamgia,
      theo: theo ?? discount.theo,
      batdau: batdau ?? discount.batdau,
      ketthuc: ketthuc ?? discount.ketthuc,
      soluong: soluong ?? discount.soluong,
      status: status ?? discount.status,
    });
    await discount.update(discountData);

    return successResponse(res, "Cập nhật mã giảm giá thành công", discount);
  } catch (error) {
    console.error("UPDATE ADMIN DISCOUNT ERROR:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return errorResponse(res, "Mã giảm giá đã tồn tại", 409);
    }

    const statusCode = error.status >= 400 && error.status < 500 ? error.status : 500;
    return errorResponse(res, statusCode === 500 ? "Có lỗi xảy ra, vui lòng thử lại sau" : error.message, statusCode);
  }
}

export async function deleteAdminDiscount(req, res) {
  try {
    const { id } = req.params;

    const discount = await Discount.findByPk(id);

    if (!discount) {
      return errorResponse(res, "Không tìm thấy mã giảm giá", 404);
    }

    await discount.update({
      status: 0,
    });

    return successResponse(res, "Tắt mã giảm giá thành công");
  } catch (error) {
    console.error("DELETE ADMIN DISCOUNT ERROR:", error);
    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function getAdminSetting(req, res) {
  try {
    let setting = await Setting.findByPk(1);

    if (!setting) {
      setting = await Setting.create({
        id: 1,
        ten_web: "Shop Game",
      });
    }

    return successResponse(res, "Lấy cấu hình website thành công", setting);
  } catch (error) {
    console.error("GET ADMIN SETTING ERROR:", error);
    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function updateAdminSetting(req, res) {
  try {
    let setting = await Setting.findByPk(1);

    if (!setting) {
      setting = await Setting.create({
        id: 1,
      });
    }

    const {
      ten_web,
      logo,
      favicon,
      banner,
      background,
      fb_admin,
      sdt_admin,
      email,
      sepay_secret,
      ck_ctv,
      thongbao,
    } = req.body;

    const commissionRate = ck_ctv === undefined
      ? undefined
      : parsePercentage(ck_ctv, "Chiết khấu CTV", { min: 0, max: 100 });

    await setting.update({
      ...(ten_web !== undefined && { ten_web }),
      ...(logo !== undefined && { logo }),
      ...(favicon !== undefined && { favicon }),
      ...(banner !== undefined && { banner }),
      ...(background !== undefined && { background }),
      ...(fb_admin !== undefined && { fb_admin }),
      ...(sdt_admin !== undefined && { sdt_admin }),
      ...(email !== undefined && { email }),
      ...(sepay_secret !== undefined && { sepay_secret }),
      ...(commissionRate !== undefined && { ck_ctv: commissionRate }),
      ...(thongbao !== undefined && { thongbao }),
    });

    await writeLog(
      req.user.id,
      `Admin ${req.user.username} cập nhật cấu hình website`,
      req.clientIp,
    );

    return successResponse(
      res,
      "Cập nhật cấu hình website thành công",
      setting,
    );
  } catch (error) {
    console.error("UPDATE ADMIN SETTING ERROR:", error);
    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function getAdminLogs(req, res) {
  try {
    const { page, limit, offset } = parsePagination(req.query);

    const { count, rows } = await HistoryLog.findAndCountAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "level"],
        },
      ],
      order: [["id", "DESC"]],
      limit,
      offset,
    });

    return successResponse(res, "Lấy lịch sử hoạt động thành công", {
      logs: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPage: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("GET ADMIN LOGS ERROR:", error);
    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function getAdminBanks(req, res) {
  try {
    const banks = await Bank.findAll({
      order: [["id", "DESC"]],
    });
    return successResponse(res, "Lấy danh sách ngân hàng thành công", banks);
  } catch (error) {
    console.error("GET ADMIN BANKS ERROR:", error);
    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function createAdminBank(req, res) {
  try {
    const { name, account_no, account_name, bank_id, status } = req.body;
    if (!name || !account_no || !account_name || !bank_id) {
      return errorResponse(res, "Vui lòng nhập đầy đủ thông tin", 400);
    }
    const bank = await Bank.create({
      name,
      account_no,
      account_name,
      bank_id,
      status: status !== undefined ? Number(status) : 1,
    });
    await writeLog(req.user.id, `Thêm ngân hàng mới: ${name} (${account_no})`, req.clientIp);
    return successResponse(res, "Thêm ngân hàng thành công", bank, 201);
  } catch (error) {
    console.error("CREATE ADMIN BANK ERROR:", error);
    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function updateAdminBank(req, res) {
  try {
    const { id } = req.params;
    const { name, account_no, account_name, bank_id, status } = req.body;
    const bank = await Bank.findByPk(id);
    if (!bank) {
      return errorResponse(res, "Không tìm thấy ngân hàng", 404);
    }
    await bank.update({
      name: name !== undefined ? name : bank.name,
      account_no: account_no !== undefined ? account_no : bank.account_no,
      account_name: account_name !== undefined ? account_name : bank.account_name,
      bank_id: bank_id !== undefined ? bank_id : bank.bank_id,
      status: status !== undefined ? Number(status) : bank.status,
    });
    await writeLog(req.user.id, `Cập nhật ngân hàng ID ${id}`, req.clientIp);
    return successResponse(res, "Cập nhật ngân hàng thành công", bank);
  } catch (error) {
    console.error("UPDATE ADMIN BANK ERROR:", error);
    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function deleteAdminBank(req, res) {
  try {
    const { id } = req.params;
    const bank = await Bank.findByPk(id);
    if (!bank) {
      return errorResponse(res, "Không tìm thấy ngân hàng", 404);
    }
    const name = bank.name;
    const account_no = bank.account_no;
    // Keep historic payment instructions auditable; remove it from public selection instead.
    await bank.update({ status: 0 });
    await writeLog(req.user.id, `Xóa ngân hàng: ${name} (${account_no})`, req.clientIp);
    return successResponse(res, "Xóa ngân hàng thành công");
  } catch (error) {
    console.error("DELETE ADMIN BANK ERROR:", error);
    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}
