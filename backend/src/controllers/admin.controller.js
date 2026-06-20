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
} from "../models/index.js";

import { successResponse, errorResponse } from "../utils/response.util.js";
import { writeLog } from "../utils/log.util.js";

function toNumber(value) {
  return Number(value || 0);
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
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.search) {
      where.username = {
        [Op.like]: `%${req.query.search}%`
      };
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: {
        exclude: ["password", "refresh_token_hash"],
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

    await user.update({
      ...(level !== undefined && { level }),
      ...(banned !== undefined && { banned }),
    });

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

  try {
    const { id } = req.params;
    const { type, amount, description } = req.body;

    if (!["add", "sub"].includes(type)) {
      await dbTransaction.rollback();
      return errorResponse(res, "Loại thao tác không hợp lệ", 400);
    }

    if (!amount || Number(amount) <= 0) {
      await dbTransaction.rollback();
      return errorResponse(res, "Số tiền không hợp lệ", 400);
    }

    const user = await User.findByPk(id, {
      transaction: dbTransaction,
      lock: true,
    });

    if (!user) {
      await dbTransaction.rollback();
      return errorResponse(res, "Không tìm thấy người dùng", 404);
    }

    const moneyAmount = Number(amount);
    const balanceBefore = Number(user.money);

    const balanceAfter =
      type === "add"
        ? balanceBefore + moneyAmount
        : balanceBefore - moneyAmount;

    if (balanceAfter < 0) {
      await dbTransaction.rollback();
      return errorResponse(res, "Số dư người dùng không đủ để trừ", 400);
    }

    await user.update(
      {
        money: balanceAfter,
        ...(type === "add" && {
          tong_nap: Number(user.tong_nap) + moneyAmount,
        }),
      },
      {
        transaction: dbTransaction,
      },
    );

    await Transaction.create(
      {
        user_id: user.id,
        type: type === "add" ? "admin_add" : "admin_sub",
        amount: type === "add" ? moneyAmount : -moneyAmount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        reference_id: null,
        description:
          description ||
          (type === "add" ? "Admin cộng tiền" : "Admin trừ tiền"),
      },
      {
        transaction: dbTransaction,
      },
    );

    await dbTransaction.commit();

    return successResponse(res, "Cập nhật số dư thành công", {
      user_id: user.id,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
    });
  } catch (error) {
    await dbTransaction.rollback();

    console.error("UPDATE USER MONEY ERROR:", error);
    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function getAdminAccounts(req, res) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const offset = (page - 1) * limit;

    const where = {};

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
      accounts: rows,
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
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const offset = (page - 1) * limit;

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
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const offset = (page - 1) * limit;

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
  try {
    const { acc_id, sale_price, batdau, ketthuc, status = 1 } = req.body;

    if (!acc_id || !sale_price || !batdau || !ketthuc) {
      return errorResponse(res, "Vui lòng nhập đầy đủ thông tin sale", 400);
    }

    const account = await GameAccount.findByPk(acc_id);

    if (!account) {
      return errorResponse(res, "Tài khoản không tồn tại", 404);
    }

    const sale = await Sale.create({
      acc_id,
      sale_price,
      batdau,
      ketthuc,
      status,
    });

    return successResponse(res, "Thêm sale thành công", sale);
  } catch (error) {
    console.error("CREATE ADMIN SALE ERROR:", error);
    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function updateAdminSale(req, res) {
  try {
    const { id } = req.params;
    const { acc_id, sale_price, batdau, ketthuc, status } = req.body;

    const sale = await Sale.findByPk(id);

    if (!sale) {
      return errorResponse(res, "Không tìm thấy sale", 404);
    }

    if (acc_id !== undefined) {
      const account = await GameAccount.findByPk(acc_id);

      if (!account) {
        return errorResponse(res, "Tài khoản không tồn tại", 404);
      }
    }

    await sale.update({
      ...(acc_id !== undefined && { acc_id }),
      ...(sale_price !== undefined && { sale_price }),
      ...(batdau !== undefined && { batdau }),
      ...(ketthuc !== undefined && { ketthuc }),
      ...(status !== undefined && { status }),
    });

    return successResponse(res, "Cập nhật sale thành công", sale);
  } catch (error) {
    console.error("UPDATE ADMIN SALE ERROR:", error);
    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
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

    if (!magiamgia || !giamgia) {
      return errorResponse(
        res,
        "Vui lòng nhập mã giảm giá và giá trị giảm",
        400,
      );
    }

    const discount = await Discount.create({
      magiamgia,
      giamgia,
      theo,
      batdau,
      ketthuc,
      soluong,
      status,
    });

    return successResponse(res, "Thêm mã giảm giá thành công", discount);
  } catch (error) {
    console.error("CREATE ADMIN DISCOUNT ERROR:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return errorResponse(res, "Mã giảm giá đã tồn tại", 409);
    }

    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
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

    await discount.update({
      ...(magiamgia !== undefined && { magiamgia }),
      ...(giamgia !== undefined && { giamgia }),
      ...(theo !== undefined && { theo }),
      ...(batdau !== undefined && { batdau }),
      ...(ketthuc !== undefined && { ketthuc }),
      ...(soluong !== undefined && { soluong }),
      ...(status !== undefined && { status }),
    });

    return successResponse(res, "Cập nhật mã giảm giá thành công", discount);
  } catch (error) {
    console.error("UPDATE ADMIN DISCOUNT ERROR:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return errorResponse(res, "Mã giảm giá đã tồn tại", 409);
    }

    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
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
      js_web,
    } = req.body;

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
      ...(ck_ctv !== undefined && { ck_ctv }),
      ...(thongbao !== undefined && { thongbao }),
      ...(js_web !== undefined && { js_web }),
    });

    await writeLog(
      req.user.id,
      `Admin ${req.user.username} cập nhật cấu hình website`,
      req.ip,
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
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const offset = (page - 1) * limit;

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
    await writeLog(req.user.id, `Thêm ngân hàng mới: ${name} (${account_no})`, req.ip);
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
    await writeLog(req.user.id, `Cập nhật ngân hàng ID ${id}`, req.ip);
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
    await bank.destroy();
    await writeLog(req.user.id, `Xóa ngân hàng: ${name} (${account_no})`, req.ip);
    return successResponse(res, "Xóa ngân hàng thành công");
  } catch (error) {
    console.error("DELETE ADMIN BANK ERROR:", error);
    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

