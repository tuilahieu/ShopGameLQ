import { Op } from "sequelize";

import { GameAccount, AccountType, Sale } from "../models/index.js";

import { successResponse, errorResponse } from "../utils/response.util.js";

function isAdmin(user) {
  return Number(user.level) === 99;
}

function isCtv(user) {
  return Number(user.level) === 1;
}

function isAccountOwner(user, account) {
  return isCtv(user) && Number(account.seller_id) === Number(user.id);
}

async function appendSaleInfo(accounts) {
  const now = new Date();

  const list = Array.isArray(accounts) ? accounts : [accounts];

  if (list.length === 0) {
    return [];
  }

  const accountIds = list.map((item) => item.id);

  const sales = await Sale.findAll({
    where: {
      acc_id: {
        [Op.in]: accountIds,
      },
      status: 1,
    },
  });

  const saleMap = new Map();

  for (const sale of sales) {
    if (now >= new Date(sale.batdau) && now <= new Date(sale.ketthuc)) {
      saleMap.set(Number(sale.acc_id), sale);
    }
  }

  return list.map((account) => {
    const json = account.toJSON();
    const sale = saleMap.get(Number(account.id));

    return {
      ...json,
      original_price: Number(account.gia),
      sale_price: sale ? Number(sale.sale_price) : null,
      final_price: sale ? Number(sale.sale_price) : Number(account.gia),
      is_sale: !!sale,
    };
  });
}

export async function getAccounts(req, res) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const offset = (page - 1) * limit;

    const where = {
      status: 0,
    };

    if (req.query.loai_id) {
      where.loai_id = req.query.loai_id;
    }

    let order = [["id", "DESC"]];

    if (req.query.sort === "price_asc") {
      order = [["gia", "ASC"]];
    }

    if (req.query.sort === "price_desc") {
      order = [["gia", "DESC"]];
    }

    const { count, rows } = await GameAccount.findAndCountAll({
      where,
      attributes: {
        exclude: ["login"],
      },
      order,
      limit,
      offset,
    });

    const accounts = await appendSaleInfo(rows);

    return successResponse(res, "Lấy danh sách tài khoản thành công", {
      accounts,
      pagination: {
        page,
        limit,
        total: count,
        totalPage: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("GET ACCOUNTS ERROR:", error);
    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function getAccountById(req, res) {
  try {
    const { id } = req.params;

    const account = await GameAccount.findOne({
      where: {
        id,
        status: 0,
      },
      attributes: {
        exclude: ["login"],
      },
      include: [
        {
          model: AccountType,
          as: "accountType",
        },
      ],
    });

    if (!account) {
      return errorResponse(res, "Không tìm thấy tài khoản", 404);
    }

    const [accountData] = await appendSaleInfo(account);

    return successResponse(
      res,
      "Lấy thông tin tài khoản thành công",
      accountData,
    );
  } catch (error) {
    console.error("GET ACCOUNT BY ID ERROR:", error);
    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function createAccount(req, res) {
  try {
    if (!isAdmin(req.user) && !isCtv(req.user)) {
      return errorResponse(res, "Bạn không có quyền thêm tài khoản", 403);
    }

    const {
      loai_id,
      thong_tin,
      list_thong_tin,
      img,
      list_img,
      login,
      gia,
      ck = 0,
    } = req.body;

    if (!loai_id) {
      return errorResponse(res, "Vui lòng chọn loại tài khoản", 400);
    }

    if (gia === undefined || Number(gia) < 0) {
      return errorResponse(res, "Vui lòng nhập giá tài khoản hợp lệ", 400);
    }

    if (!login) {
      return errorResponse(
        res,
        "Vui lòng nhập thông tin đăng nhập của tài khoản",
        400,
      );
    }

    const accountType = await AccountType.findByPk(loai_id);

    if (!accountType) {
      return errorResponse(res, "Loại tài khoản không tồn tại", 404);
    }

    const account = await GameAccount.create({
      seller_id: req.user.id,

      loai_id,
      thong_tin,
      list_thong_tin,
      img,
      list_img,
      login,
      gia,
      ck,

      status: 0,
      buyer_id: null,
      ngaymua: null,
    });

    return successResponse(res, "Thêm tài khoản thành công", account);
  } catch (error) {
    console.error("CREATE ACCOUNT ERROR:", error);
    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function updateAccount(req, res) {
  try {
    const { id } = req.params;

    const account = await GameAccount.findByPk(id);

    if (!account) {
      return errorResponse(res, "Không tìm thấy tài khoản", 404);
    }

    const admin = isAdmin(req.user);
    const owner = isAccountOwner(req.user, account);

    if (!admin && !owner) {
      return errorResponse(
        res,
        "Bạn không có quyền chỉnh sửa tài khoản này",
        403,
      );
    }

    const {
      loai_id,
      buyer_id,
      thong_tin,
      list_thong_tin,
      img,
      list_img,
      login,
      gia,
      ck,
      status,
      ngaymua,
    } = req.body;

    if (loai_id !== undefined) {
      const accountType = await AccountType.findByPk(loai_id);

      if (!accountType) {
        return errorResponse(res, "Loại tài khoản không tồn tại", 404);
      }
    }

    if (admin) {
      await account.update({
        ...(loai_id !== undefined && { loai_id }),
        ...(buyer_id !== undefined && { buyer_id }),
        ...(thong_tin !== undefined && { thong_tin }),
        ...(list_thong_tin !== undefined && { list_thong_tin }),
        ...(img !== undefined && { img }),
        ...(list_img !== undefined && { list_img }),
        ...(login !== undefined && { login }),
        ...(gia !== undefined && { gia }),
        ...(ck !== undefined && { ck }),
        ...(status !== undefined && { status }),
        ...(ngaymua !== undefined && { ngaymua }),
      });
    } else {
      if (Number(account.status) !== 0) {
        return errorResponse(
          res,
          "Bạn chỉ được chỉnh sửa tài khoản đang bán",
          403,
        );
      }

      await account.update({
        ...(loai_id !== undefined && { loai_id }),
        ...(thong_tin !== undefined && { thong_tin }),
        ...(list_thong_tin !== undefined && { list_thong_tin }),
        ...(img !== undefined && { img }),
        ...(list_img !== undefined && { list_img }),
        ...(login !== undefined && { login }),
        ...(gia !== undefined && { gia }),
        ...(ck !== undefined && { ck }),
      });
    }

    return successResponse(res, "Cập nhật tài khoản thành công", account);
  } catch (error) {
    console.error("UPDATE ACCOUNT ERROR:", error);
    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function deleteAccount(req, res) {
  try {
    const { id } = req.params;

    const account = await GameAccount.findByPk(id);

    if (!account) {
      return errorResponse(res, "Không tìm thấy tài khoản", 404);
    }

    const admin = isAdmin(req.user);
    const owner = isAccountOwner(req.user, account);

    if (!admin && !owner) {
      return errorResponse(res, "Bạn không có quyền xóa tài khoản này", 403);
    }

    if (!admin && Number(account.status) !== 0) {
      return errorResponse(res, "Bạn chỉ được xóa tài khoản đang bán", 403);
    }

    const { Order, Sale } = await import("../models/index.js");

    // Delete associated sales and orders for this game account
    await Sale.destroy({ where: { acc_id: id } });
    await Order.destroy({ where: { acc_id: id } });

    await account.destroy();

    return successResponse(res, "Xóa tài khoản và các dữ liệu liên quan thành công");
  } catch (error) {
    console.error("DELETE ACCOUNT ERROR:", error);
    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}
