import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";

import {
  getAdminDashboard,
  getAdminUsers,
  updateAdminUser,
  updateUserMoney,
  getAdminAccounts,
  getAdminOrders,
  getAdminTransactions,
  getAdminSales,
  createAdminSale,
  updateAdminSale,
  deleteAdminSale,
  getAdminDiscounts,
  createAdminDiscount,
  updateAdminDiscount,
  deleteAdminDiscount,
  getAdminSetting,
  updateAdminSetting,
  getAdminLogs,
  getAdminBanks,
  createAdminBank,
  updateAdminBank,
  deleteAdminBank,
} from "../controllers/admin.controller.js";

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Thống kê dashboard admin
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy dữ liệu dashboard thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền admin
 */
router.get("/dashboard", getAdminDashboard);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Danh sách người dùng
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách người dùng thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền admin
 */
router.get("/users", getAdminUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: Cập nhật người dùng
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.put("/users/:id", updateAdminUser);

/**
 * @swagger
 * /api/admin/users/{id}/money:
 *   post:
 *     summary: Cộng hoặc trừ tiền người dùng
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - amount
 *             properties:
 *               type:
 *                 type: string
 *                 enum:
 *                   - add
 *                   - sub
 *               amount:
 *                 type: integer
 *                 example: 100000
 *               description:
 *                 type: string
 *                 example: Admin cộng tiền test
 *     responses:
 *       200:
 *         description: Cập nhật số dư thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy người dùng
 */
router.post("/users/:id/money", updateUserMoney);

/**
 * @swagger
 * /api/admin/accounts:
 *   get:
 *     summary: Danh sách tài khoản game
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/accounts", getAdminAccounts);

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: Danh sách đơn hàng
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/orders", getAdminOrders);

/**
 * @swagger
 * /api/admin/transactions:
 *   get:
 *     summary: Danh sách giao dịch
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/transactions", getAdminTransactions);

/**
 * @swagger
 * /api/admin/sales:
 *   get:
 *     summary: Danh sách sale
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/sales", getAdminSales);

/**
 * @swagger
 * /api/admin/sales:
 *   post:
 *     summary: Thêm sale
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post("/sales", createAdminSale);

/**
 * @swagger
 * /api/admin/sales/{id}:
 *   put:
 *     summary: Cập nhật sale
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.put("/sales/:id", updateAdminSale);

/**
 * @swagger
 * /api/admin/sales/{id}:
 *   delete:
 *     summary: Tắt sale
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.delete("/sales/:id", deleteAdminSale);

/**
 * @swagger
 * /api/admin/discounts:
 *   get:
 *     summary: Danh sách mã giảm giá
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/discounts", getAdminDiscounts);

/**
 * @swagger
 * /api/admin/discounts:
 *   post:
 *     summary: Thêm mã giảm giá
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post("/discounts", createAdminDiscount);

/**
 * @swagger
 * /api/admin/discounts/{id}:
 *   put:
 *     summary: Cập nhật mã giảm giá
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.put("/discounts/:id", updateAdminDiscount);

/**
 * @swagger
 * /api/admin/discounts/{id}:
 *   delete:
 *     summary: Tắt mã giảm giá
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.delete("/discounts/:id", deleteAdminDiscount);

/**
 * @swagger
 * /api/admin/setting:
 *   get:
 *     summary: Lấy cấu hình website
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy cấu hình website thành công
 */
router.get("/setting", getAdminSetting);

/**
 * @swagger
 * /api/admin/setting:
 *   put:
 *     summary: Cập nhật cấu hình website
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cập nhật cấu hình website thành công
 */
router.put("/setting", updateAdminSetting);

/**
 * @swagger
 * /api/admin/logs:
 *   get:
 *     summary: Lịch sử hoạt động hệ thống
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy lịch sử hoạt động thành công
 */
router.get("/logs", getAdminLogs);

router.get("/banks", getAdminBanks);
router.post("/banks", createAdminBank);
router.put("/banks/:id", updateAdminBank);
router.delete("/banks/:id", deleteAdminBank);

export default router;
