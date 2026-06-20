import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { ctvMiddleware } from "../middlewares/ctv.middleware.js";

import {
  getCtvDashboard,
  getCtvAccounts,
  getCtvOrders,
} from "../controllers/ctv.controller.js";

const router = Router();

router.use(authMiddleware);
router.use(ctvMiddleware);

/**
 * @swagger
 * /api/ctv/dashboard:
 *   get:
 *     summary: Thống kê CTV
 *     tags:
 *       - CTV
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy dữ liệu CTV thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền CTV
 */
router.get("/dashboard", getCtvDashboard);

/**
 * @swagger
 * /api/ctv/accounts:
 *   get:
 *     summary: Danh sách tài khoản do CTV đăng
 *     tags:
 *       - CTV
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *         required: false
 *         description: 0 đang bán, 1 đã bán, 2 đã ẩn
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 20
 *     responses:
 *       200:
 *         description: Lấy danh sách tài khoản của CTV thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền CTV
 */
router.get("/accounts", getCtvAccounts);

/**
 * @swagger
 * /api/ctv/orders:
 *   get:
 *     summary: Danh sách đơn hàng từ tài khoản của CTV
 *     tags:
 *       - CTV
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 20
 *     responses:
 *       200:
 *         description: Lấy đơn hàng của CTV thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền CTV
 */
router.get("/orders", getCtvOrders);

export default router;
