import { GameAccount, Order, User } from "../models/index.js";

import { successResponse, errorResponse } from "../utils/response.util.js";

export async function getCtvDashboard(req, res) {
  try {
    const sellerId = req.user.id;

    const [
      totalAccounts,
      sellingAccounts,
      soldAccounts,
      hiddenAccounts,
      totalOrders,
      orderSum,
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

      Order.sum("final_price", {
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
    ]);

    const totalEarned = orderSum || 0;

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
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const offset = (page - 1) * limit;

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
      accounts: rows,
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
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const offset = (page - 1) * limit;

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
