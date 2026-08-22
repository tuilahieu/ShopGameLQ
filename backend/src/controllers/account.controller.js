import { Op } from "sequelize";
import { sequelize } from "../config/database.js";

import { GameAccount, AccountType, Sale } from "../models/index.js";

import { successResponse, errorResponse } from "../utils/response.util.js";
import { encryptCredential } from "../utils/credential.util.js";
import { requirePositiveMoney } from "../utils/money.util.js";
import { parsePagination } from "../utils/pagination.util.js";
import { parsePercentage, parsePositiveId } from "../services/pricing.service.js";

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
    order: [["id", "DESC"]],
  });

  const saleMap = new Map();

  for (const sale of sales) {
    if (now >= new Date(sale.batdau) && now <= new Date(sale.ketthuc)) {
      if (!saleMap.has(Number(sale.acc_id))) saleMap.set(Number(sale.acc_id), sale);
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
    const { page, limit, offset } = parsePagination(req.query);

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

    const price = requirePositiveMoney(gia);
    if (!price) {
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

    if (!accountType || Number(accountType.status) !== 1) {
      return errorResponse(res, "Loại tài khoản không tồn tại", 404);
    }

    const account = await GameAccount.create({
      seller_id: req.user.id,

      loai_id,
      thong_tin,
      list_thong_tin,
      img,
      list_img,
      login: encryptCredential(login),
      gia: price,
      ck: parsePercentage(ck, "Chiết khấu", { min: 0, max: 100 }),

      status: 0,
      buyer_id: null,
      ngaymua: null,
    });

    return successResponse(res, "Thêm tài khoản thành công", account);
  } catch (error) {
    console.error("CREATE ACCOUNT ERROR:", error);
    const status = error.status >= 400 && error.status < 500 ? error.status : 500;
    return errorResponse(res, status === 500 ? "Có lỗi xảy ra, vui lòng thử lại sau" : error.message, status);
  }
}

export async function updateAccount(req, res) {
  const dbTransaction = await sequelize.transaction();
  let finished = false;
  try {
    const id = parsePositiveId(req.params.id, "account_id");

    const account = await GameAccount.findByPk(id, { transaction: dbTransaction, lock: true });

    if (!account) {
      await dbTransaction.rollback();
      return errorResponse(res, "Không tìm thấy tài khoản", 404);
    }

    const admin = isAdmin(req.user);
    const owner = isAccountOwner(req.user, account);

    if (!admin && !owner) {
      await dbTransaction.rollback();
      return errorResponse(
        res,
        "Bạn không có quyền chỉnh sửa tài khoản này",
        403,
      );
    }

    const {
      loai_id,
      thong_tin,
      list_thong_tin,
      img,
      list_img,
      login,
      gia,
      ck,
    } = req.body;

    // Order fulfilment is immutable for every role, including an administrator.
    // Changing a sold listing can otherwise make history and wallet records disagree.
    if (Number(account.status) !== 0) {
      await dbTransaction.rollback();
      return errorResponse(res, "Chỉ được chỉnh sửa tài khoản đang bán; dữ liệu đã bán là bất biến", 409);
    }

    if (loai_id !== undefined) {
      const accountType = await AccountType.findByPk(loai_id, { transaction: dbTransaction });

      if (!accountType || Number(accountType.status) !== 1) {
        await dbTransaction.rollback();
        return errorResponse(res, "Loại tài khoản không tồn tại", 404);
      }
    }

    const updatePrice = gia === undefined ? undefined : requirePositiveMoney(gia);
    if (gia !== undefined && !updatePrice) {
      await dbTransaction.rollback();
      return errorResponse(res, "Giá tài khoản không hợp lệ", 400);
    }
    const updateData = {
      ...(loai_id !== undefined && { loai_id }),
      ...(thong_tin !== undefined && { thong_tin }),
      ...(list_thong_tin !== undefined && { list_thong_tin }),
      ...(img !== undefined && { img }),
      ...(list_img !== undefined && { list_img }),
      ...(login !== undefined && { login: encryptCredential(login) }),
      ...(gia !== undefined && { gia: updatePrice }),
      ...(ck !== undefined && { ck: parsePercentage(ck, "Chiết khấu", { min: 0, max: 100 }) }),
    };
    await account.update(updateData, { transaction: dbTransaction });
    await dbTransaction.commit();
    finished = true;

    return successResponse(res, "Cập nhật tài khoản thành công", account);
  } catch (error) {
    if (!finished) await dbTransaction.rollback();
    console.error("UPDATE ACCOUNT ERROR:", error);
    const status = error.status >= 400 && error.status < 500 ? error.status : 500;
    return errorResponse(res, status === 500 ? "Có lỗi xảy ra, vui lòng thử lại sau" : error.message, status);
  }
}

export async function deleteAccount(req, res) {
  const dbTransaction = await sequelize.transaction();
  let finished = false;
  try {
    const id = parsePositiveId(req.params.id, "account_id");

    const account = await GameAccount.findByPk(id, { transaction: dbTransaction, lock: true });

    if (!account) {
      await dbTransaction.rollback();
      return errorResponse(res, "Không tìm thấy tài khoản", 404);
    }

    const admin = isAdmin(req.user);
    const owner = isAccountOwner(req.user, account);

    if (!admin && !owner) {
      await dbTransaction.rollback();
      return errorResponse(res, "Bạn không có quyền xóa tài khoản này", 403);
    }

    if (!admin && Number(account.status) !== 0) {
      await dbTransaction.rollback();
      return errorResponse(res, "Bạn chỉ được xóa tài khoản đang bán", 403);
    }

    // Financial and fulfilment records are immutable. Hide an unsold listing instead of deleting history.
    if (Number(account.status) === 1) {
      await dbTransaction.rollback();
      return errorResponse(res, "Không thể xóa tài khoản đã bán; dữ liệu đơn hàng phải được lưu giữ", 409);
    }
    await account.update({ status: 2 }, { transaction: dbTransaction });
    await dbTransaction.commit();
    finished = true;

    return successResponse(res, "Đã ẩn tài khoản khỏi danh sách bán");
  } catch (error) {
    if (!finished) await dbTransaction.rollback();
    console.error("DELETE ACCOUNT ERROR:", error);
    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}
