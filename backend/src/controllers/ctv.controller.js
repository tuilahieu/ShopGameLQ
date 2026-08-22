import { GameAccount, Order, Transaction, User } from "../models/index.js";

import { successResponse, errorResponse } from "../utils/response.util.js";
import { parsePagination } from "../utils/pagination.util.js";
import { decryptCredential } from "../utils/credential.util.js";

export async function getCtvDashboard(req, res) {
  try {
    const sellerId = req.user.id;

    const [
      totalAccounts,
      sellingAccounts,
      soldAccounts,
      hiddenAccounts,
      totalOrders,
      earnedSum,
    ] = await Promise.all([
      GameAccount.count({
        where: {
          seller_id: sellerId,
        },
      }),

      GameAccount.count({
        where: {
          seller_id: sellerId,
          status: 0,
        },
      }),

      GameAccount.count({
        where: {
          seller_id: sellerId,
          status: 1,
        },
      }),

      GameAccount.count({
        where: {
          seller_id: sellerId,
          status: 2,
        },
      }),

      Order.count({
        include: [
          {
            model: GameAccount,
            as: "account",
            where: {
              seller_id: sellerId,
            },
          },
        ],
      }),

      Transaction.sum("amount", { where: { user_id: sellerId, type: "ctv_earn" } }),
    ]);

    // A CTV earns the recorded commission, not the gross price of all listings.
    const totalEarned = Number(earnedSum || 0);

    return successResponse(res, "Lấy dữ liệu CTV thành công", {
      totalAccounts,
      sellingAccounts,
      soldAccounts,
      hiddenAccounts,
      totalOrders,
      totalEarned,
    });
  } catch (error) {
    console.error("GET CTV DASHBOARD ERROR:", error);

    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function getCtvAccounts(req, res) {
  try {
    const { page, limit, offset } = parsePagination(req.query);

    const where = {
      seller_id: req.user.id,
    };

    if (req.query.status !== undefined && req.query.status !== "") {
      where.status = req.query.status;
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
        }
      ]
    });

    return successResponse(res, "Lấy danh sách tài khoản của CTV thành công", {
      // The query is scoped to seller_id = req.user.id, so a CTV may view only credentials it owns.
      accounts: rows.map((account) => ({ ...account.toJSON(), login: decryptCredential(account.login) })),
      pagination: {
        page,
        limit,
        total: count,
        totalPage: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("GET CTV ACCOUNTS ERROR:", error);

    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}

export async function getCtvOrders(req, res) {
  try {
    const { page, limit, offset } = parsePagination(req.query);

    const { count, rows } = await Order.findAndCountAll({
      include: [
        {
          model: GameAccount,
          as: "account",
          where: {
            seller_id: req.user.id,
          },
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "level"],
        }
      ],
      order: [["id", "DESC"]],
      limit,
      offset,
    });

    return successResponse(res, "Lấy đơn hàng của CTV thành công", {
      orders: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPage: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("GET CTV ORDERS ERROR:", error);

    return errorResponse(res, "Có lỗi xảy ra, vui lòng thử lại sau", 500);
  }
}
