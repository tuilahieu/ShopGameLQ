import { Category, AccountType, GameAccount, Setting, Transaction, Sale } from "../../database/models.js";
import { successResponse, errorResponse } from "../../shared/utils/response.util.js";
import { Sequelize } from "sequelize";
import { buildActiveSaleWhere } from "../promotions/sale.service.js";
import { resolveAccountPricing } from "../commerce/pricing.service.js";
import { publicAssistantProfile } from "../assistant/core/profile.js";

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
          where: buildActiveSaleWhere({ now }),
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

    const latestAccountIds = latestAccounts.map((account) => Number(account.id));
    const latestSales = latestAccountIds.length > 0
      ? await Sale.findAll({
        where: buildActiveSaleWhere({ now, accountIds: latestAccountIds }),
        order: [["id", "DESC"]],
      })
      : [];
    const latestSaleMap = new Map();
    for (const sale of latestSales) {
      if (!latestSaleMap.has(Number(sale.acc_id))) {
        latestSaleMap.set(Number(sale.acc_id), sale);
      }
    }
    const latestAccountsWithPricing = latestAccounts.map((account) => {
      const accountJson = account.toJSON();
      const sale = latestSaleMap.get(Number(account.id));
      const pricing = resolveAccountPricing(accountJson, sale);
      return {
        ...accountJson,
        original_price: pricing.originalPrice,
        sale_price: pricing.salePrice,
        final_price: pricing.finalPrice,
        is_sale: pricing.isSale,
        sale_source: pricing.saleSource,
        is_flash_sale: pricing.hasFlashSale,
      };
    });

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
        const pricing = resolveAccountPricing(accountJson, sale);
        return {
          ...accountJson,
          original_price: pricing.originalPrice,
          sale_price: pricing.salePrice,
          final_price: pricing.finalPrice,
          is_sale: pricing.isSale,
          sale_source: pricing.saleSource,
          is_flash_sale: true,
          sale_detail: {
            id: sale.id,
            batdau: sale.batdau,
            ketthuc: sale.ketthuc,
          },
        };
      });

    // Never expose payment secrets or executable admin-managed code to anonymous clients.
    const assistantProfile = publicAssistantProfile(setting);
    const publicSetting = setting ? {
      ten_web: setting.ten_web,
      logo: setting.logo,
      favicon: setting.favicon,
      banner: setting.banner,
      background: setting.background,
      fb_admin: setting.fb_admin,
      sdt_admin: setting.sdt_admin,
      email: setting.email,
      assistant_name: assistantProfile.name,
      assistant_avatar: assistantProfile.avatar,
      thongbao: setting.thongbao,
    } : {};

    return successResponse(res, "Lấy dữ liệu trang chủ thành công", {
      totalAccounts,
      categories,
      accountTypes,
      latestAccounts: latestAccountsWithPricing,
      accountCountByType,
      setting: publicSetting,
      flashSaleAccounts,
    });
  } catch (error) {
    console.error("GET HOME ERROR:", error);
    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}
