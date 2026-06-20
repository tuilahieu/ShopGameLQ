import { AccountType, Category, GameAccount } from "../models/index.js";

import { successResponse, errorResponse } from "../utils/response.util.js";

export async function getAccountTypes(req, res) {
  try {
    const { all } = req.query;
    const where = {};
    if (all !== "true") {
      where.status = 1;
    }

    if (req.query.danhmuc_id) {
      where.danhmuc_id = req.query.danhmuc_id;
    }

    const accountTypes = await AccountType.findAll({
      where,
      order: [["id", "ASC"]],
    });

    return successResponse(
      res,
      "Lấy danh sách loại tài khoản thành công",
      accountTypes,
    );
  } catch (error) {
    console.error("GET ACCOUNT TYPES ERROR:", error);

    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function getAccountTypeById(req, res) {
  try {
    const { id } = req.params;

    const accountType = await AccountType.findOne({
      where: {
        id,
        status: 1,
      },
    });

    if (!accountType) {
      return errorResponse(res, "Không tìm thấy loại tài khoản", 404);
    }

    return successResponse(
      res,
      "Lấy thông tin loại tài khoản thành công",
      accountType,
    );
  } catch (error) {
    console.error("GET ACCOUNT TYPE BY ID ERROR:", error);

    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function getAccountTypeAccounts(req, res) {
  try {
    const { id } = req.params;

    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const offset = (page - 1) * limit;

    const accountType = await AccountType.findOne({
      where: {
        id,
        status: 1,
      },
    });

    if (!accountType) {
      return errorResponse(res, "Không tìm thấy loại tài khoản", 404);
    }

    let order = [["id", "DESC"]];

    if (req.query.sort === "price_asc") {
      order = [["gia", "ASC"]];
    }

    if (req.query.sort === "price_desc") {
      order = [["gia", "DESC"]];
    }

    const { count, rows } = await GameAccount.findAndCountAll({
      where: {
        loai_id: id,
        status: 0,
      },
      attributes: {
        exclude: ["login"],
      },
      order,
      limit,
      offset,
    });

    return successResponse(
      res,
      "Lấy danh sách tài khoản theo loại thành công",
      {
        accountType,
        accounts: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPage: Math.ceil(count / limit),
        },
      },
    );
  } catch (error) {
    console.error("GET ACCOUNT TYPE ACCOUNTS ERROR:", error);

    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function createAccountType(req, res) {
  try {
    const { danhmuc_id, name, img, noidung, camket, status = 1 } = req.body;

    if (!danhmuc_id) {
      return errorResponse(res, "Vui lòng chọn danh mục", 400);
    }

    if (!name) {
      return errorResponse(res, "Vui lòng nhập tên loại tài khoản", 400);
    }

    const category = await Category.findByPk(danhmuc_id);

    if (!category) {
      return errorResponse(res, "Danh mục không tồn tại", 404);
    }

    const accountType = await AccountType.create({
      danhmuc_id,
      name,
      img,
      noidung,
      camket,
      status,
    });

    return successResponse(res, "Thêm loại tài khoản thành công", accountType);
  } catch (error) {
    console.error("CREATE ACCOUNT TYPE ERROR:", error);

    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function updateAccountType(req, res) {
  try {
    const { id } = req.params;

    const accountType = await AccountType.findByPk(id);

    if (!accountType) {
      return errorResponse(res, "Không tìm thấy loại tài khoản", 404);
    }

    const { danhmuc_id, name, img, noidung, camket, status } = req.body;

    if (danhmuc_id !== undefined) {
      const category = await Category.findByPk(danhmuc_id);

      if (!category) {
        return errorResponse(res, "Danh mục không tồn tại", 404);
      }
    }

    await accountType.update({
      ...(danhmuc_id !== undefined && { danhmuc_id }),
      ...(name !== undefined && { name }),
      ...(img !== undefined && { img }),
      ...(noidung !== undefined && { noidung }),
      ...(camket !== undefined && { camket }),
      ...(status !== undefined && { status }),
    });

    return successResponse(
      res,
      "Cập nhật loại tài khoản thành công",
      accountType,
    );
  } catch (error) {
    console.error("UPDATE ACCOUNT TYPE ERROR:", error);

    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function deleteAccountType(req, res) {
  try {
    const { id } = req.params;

    const accountType = await AccountType.findByPk(id);

    if (!accountType) {
      return errorResponse(res, "Không tìm thấy loại tài khoản", 404);
    }

    const { GameAccount, Order, Sale } = await import("../models/index.js");

    // Get all game accounts under this type
    const gameAccounts = await GameAccount.findAll({ where: { loai_id: id } });
    const gameAccountIds = gameAccounts.map(a => a.id);

    if (gameAccountIds.length > 0) {
      // Delete all sales and orders for these game accounts
      await Sale.destroy({ where: { acc_id: gameAccountIds } });
      await Order.destroy({ where: { acc_id: gameAccountIds } });
      // Delete game accounts
      await GameAccount.destroy({ where: { id: gameAccountIds } });
    }

    await accountType.destroy();

    return successResponse(res, "Xóa loại tài khoản và các dữ liệu liên quan thành công");
  } catch (error) {
    console.error("DELETE ACCOUNT TYPE ERROR:", error);

    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}
