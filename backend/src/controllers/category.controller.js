import { Category, AccountType } from "../models/index.js";
import { successResponse, errorResponse } from "../utils/response.util.js";

export async function getCategories(req, res) {
  try {
    const { all } = req.query;
    const where = {};
    if (all !== "true") {
      where.status = 1;
    }

    const categories = await Category.findAll({
      where,
      order: [["id", "ASC"]],
    });

    return successResponse(
      res,
      "Lấy danh sách danh mục thành công",
      categories,
    );
  } catch (error) {
    console.error("GET CATEGORIES ERROR:", error);
    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function getCategoryById(req, res) {
  try {
    const { id } = req.params;

    const category = await Category.findOne({
      where: {
        id,
        status: 1,
      },
    });

    if (!category) {
      return errorResponse(res, "Không tìm thấy danh mục", 404);
    }

    return successResponse(res, "Lấy thông tin danh mục thành công", category);
  } catch (error) {
    console.error("GET CATEGORY BY ID ERROR:", error);
    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function createCategory(req, res) {
  try {
    const { name, noidung, type, status = 1 } = req.body;

    if (!name) {
      return errorResponse(res, "Vui lòng nhập tên danh mục", 400);
    }

    const category = await Category.create({
      name,
      noidung,
      type,
      status,
    });

    return successResponse(res, "Thêm danh mục thành công", category);
  } catch (error) {
    console.error("CREATE CATEGORY ERROR:", error);

    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function updateCategory(req, res) {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);

    if (!category) {
      return errorResponse(res, "Không tìm thấy danh mục", 404);
    }

    const { name, noidung, type, status } = req.body;

    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (noidung !== undefined) updateData.noidung = noidung;
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) updateData.status = status;

    await category.update(updateData);

    return successResponse(res, "Cập nhật danh mục thành công", category);
  } catch (error) {
    console.error("UPDATE CATEGORY ERROR:", error);

    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function deleteCategory(req, res) {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);

    if (!category) {
      return errorResponse(res, "Không tìm thấy danh mục", 404);
    }

    const { AccountType, GameAccount, Order, Sale } = await import("../models/index.js");

    // Get all account types under this category
    const accountTypes = await AccountType.findAll({ where: { danhmuc_id: id } });
    const accountTypeIds = accountTypes.map(t => t.id);

    if (accountTypeIds.length > 0) {
      // Get all game accounts under these account types
      const gameAccounts = await GameAccount.findAll({ where: { loai_id: accountTypeIds } });
      const gameAccountIds = gameAccounts.map(a => a.id);

      if (gameAccountIds.length > 0) {
        // Delete all sales and orders for these game accounts
        await Sale.destroy({ where: { acc_id: gameAccountIds } });
        await Order.destroy({ where: { acc_id: gameAccountIds } });
        // Delete game accounts
        await GameAccount.destroy({ where: { id: gameAccountIds } });
      }

      // Delete account types
      await AccountType.destroy({ where: { id: accountTypeIds } });
    }

    await category.destroy();

    return successResponse(res, "Xóa danh mục và các dữ liệu liên quan thành công");
  } catch (error) {
    console.error("DELETE CATEGORY ERROR:", error);

    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}
