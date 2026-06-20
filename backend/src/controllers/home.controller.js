import { Category, AccountType, GameAccount, Setting, Order, User, Transaction, Sale } from "../models/index.js";
import { successResponse, errorResponse } from "../utils/response.util.js";
import { Sequelize, Op } from "sequelize";

export async function getHome(req, res) {
  try {
    const now = new Date();
    const [categories, accountTypes, latestAccounts, totalAccounts, setting, countRows, flashSales] =
      await Promise.all([
        Category.findAll({
          where: { status: 1 },
          order: [["id", "ASC"]],
        }),

        AccountType.findAll({
          where: { status: 1 },
          order: [["id", "ASC"]],
        }),

        GameAccount.findAll({
          where: { status: 0 },
          attributes: { exclude: ["login"] },
          order: [["id", "DESC"]],
          limit: 12,
        }),

        GameAccount.count({ where: { status: 0 } }),

        Setting.findOne(),

        // Count available accounts grouped by loai_id
        GameAccount.findAll({
          where: { status: 0 },
          attributes: [
            "loai_id",
            [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
          ],
          group: ["loai_id"],
          raw: true,
        }),

        // Query active flash sales
        Sale.findAll({
          where: {
            status: 1,
            batdau: { [Op.lte]: now },
            ketthuc: { [Op.gte]: now },
          },
          include: [
            {
              model: GameAccount,
              as: "account",
              where: { status: 0 },
              attributes: { exclude: ["login"] },
              include: [
                {
                  model: AccountType,
                  as: "accountType",
                  attributes: ["name"],
                },
              ],
            },
          ],
          order: [["id", "DESC"]],
          limit: 10,
        }),
      ]);

    // Build { loai_id: count } map for easy frontend lookup
    const accountCountByType = {};
    for (const row of countRows) {
      accountCountByType[row.loai_id] = Number(row.count);
    }

    // Format active flash sale accounts
    const flashSaleAccounts = flashSales
      .filter((sale) => sale.account)
      .map((sale) => {
        const accountJson = sale.account.toJSON();
        return {
          ...accountJson,
          original_price: Number(accountJson.gia),
          sale_price: Number(sale.sale_price),
          final_price: Number(sale.sale_price),
          is_sale: true,
          sale_detail: {
            id: sale.id,
            batdau: sale.batdau,
            ketthuc: sale.ketthuc,
          },
        };
      });

    return successResponse(res, "Lấy dữ liệu trang chủ thành công", {
      totalAccounts,
      categories,
      accountTypes,
      latestAccounts,
      accountCountByType,
      setting,
      flashSaleAccounts,
    });
  } catch (error) {
    console.error("GET HOME ERROR:", error);
    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}
