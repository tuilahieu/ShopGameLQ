import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware.js";

import {
  buyAccount,
  getMyOrders,
  getOrderDetail,
} from "../controllers/order.controller.js";

const router = Router();

/**
 * @swagger
 * /api/orders/buy:
 *   post:
 *     summary: Mua tài khoản
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - account_id
 *             properties:
 *               account_id:
 *                 type: integer
 *                 example: 1
 *               discount_code:
 *                 type: string
 *                 example: HELLO10
 *                 description: Mã giảm giá, có thể bỏ trống
 *     responses:
 *       200:
 *         description: Mua tài khoản thành công
 *       400:
 *         description: Số dư không đủ, tài khoản đã bán hoặc mã giảm giá không hợp lệ
 *       401:
 *         description: Vui lòng đăng nhập để tiếp tục
 *       403:
 *         description: Tài khoản bị khóa hoặc không có quyền
 *       404:
 *         description: Không tìm thấy tài khoản hoặc mã giảm giá
 */
router.post("/buy", authMiddleware, buyAccount);

/**
 * @swagger
 * /api/orders/my:
 *   get:
 *     summary: Danh sách đơn hàng của tôi
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/my", authMiddleware, getMyOrders);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Chi tiết đơn hàng
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy đơn hàng
 */
router.get("/:id", authMiddleware, getOrderDetail);

export default router;
