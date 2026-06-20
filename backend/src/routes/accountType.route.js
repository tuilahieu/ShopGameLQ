import { Router } from "express";

import {
  getAccountTypes,
  getAccountTypeById,
  getAccountTypeAccounts,
  createAccountType,
  updateAccountType,
  deleteAccountType,
} from "../controllers/accountType.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";

const router = Router();

/**
 * @swagger
 * /api/account-types:
 *   get:
 *     summary: Lấy danh sách loại tài khoản
 *     tags: [AccountType]
 *     parameters:
 *       - in: query
 *         name: danhmuc_id
 *         schema:
 *           type: integer
 *         required: false
 *         description: Lọc theo ID danh mục
 *     responses:
 *       200:
 *         description: Lấy danh sách loại tài khoản thành công
 */
router.get("/", getAccountTypes);

/**
 * @swagger
 * /api/account-types/{id}/accounts:
 *   get:
 *     summary: Lấy danh sách tài khoản theo loại
 *     tags: [AccountType]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID loại tài khoản
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum:
 *             - price_asc
 *             - price_desc
 *         required: false
 *         description: Sắp xếp theo giá
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         required: false
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 20
 *         required: false
 *     responses:
 *       200:
 *         description: Lấy danh sách tài khoản theo loại thành công
 *       404:
 *         description: Không tìm thấy loại tài khoản
 */
router.get("/:id/accounts", getAccountTypeAccounts);

/**
 * @swagger
 * /api/account-types/{id}:
 *   get:
 *     summary: Lấy chi tiết loại tài khoản
 *     tags: [AccountType]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID loại tài khoản
 *     responses:
 *       200:
 *         description: Lấy thông tin loại tài khoản thành công
 *       404:
 *         description: Không tìm thấy loại tài khoản
 */
router.get("/:id", getAccountTypeById);

/**
 * @swagger
 * /api/account-types:
 *   post:
 *     summary: Thêm loại tài khoản
 *     tags: [AccountType]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - danhmuc_id
 *               - name
 *             properties:
 *               danhmuc_id:
 *                 type: integer
 *                 example: 1
 *               name:
 *                 type: string
 *                 example: Nick rank cao
 *               img:
 *                 type: string
 *                 example: https://example.com/image.png
 *               noidung:
 *                 type: string
 *                 example: Loại tài khoản có rank cao, nhiều tướng
 *               camket:
 *                 type: string
 *                 example: Cam kết đúng thông tin, bảo hành theo chính sách shop
 *               status:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Thêm loại tài khoản thành công
 *       401:
 *         description: Vui lòng đăng nhập để tiếp tục
 *       403:
 *         description: Bạn không có quyền quản trị hệ thống
 */
router.post("/", authMiddleware, adminMiddleware, createAccountType);

/**
 * @swagger
 * /api/account-types/{id}:
 *   put:
 *     summary: Cập nhật loại tài khoản
 *     tags: [AccountType]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID loại tài khoản
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               danhmuc_id:
 *                 type: integer
 *                 example: 1
 *               name:
 *                 type: string
 *                 example: Nick Liên Quân VIP
 *               img:
 *                 type: string
 *                 example: https://example.com/image.png
 *               noidung:
 *                 type: string
 *                 example: Cập nhật nội dung loại tài khoản
 *               camket:
 *                 type: string
 *                 example: Cập nhật cam kết
 *               status:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Cập nhật loại tài khoản thành công
 *       401:
 *         description: Vui lòng đăng nhập để tiếp tục
 *       403:
 *         description: Bạn không có quyền quản trị hệ thống
 *       404:
 *         description: Không tìm thấy loại tài khoản
 */
router.put("/:id", authMiddleware, adminMiddleware, updateAccountType);

/**
 * @swagger
 * /api/account-types/{id}:
 *   delete:
 *     summary: Ẩn loại tài khoản
 *     tags: [AccountType]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID loại tài khoản
 *     responses:
 *       200:
 *         description: Ẩn loại tài khoản thành công
 *       401:
 *         description: Vui lòng đăng nhập để tiếp tục
 *       403:
 *         description: Bạn không có quyền quản trị hệ thống
 *       404:
 *         description: Không tìm thấy loại tài khoản
 */
router.delete("/:id", authMiddleware, adminMiddleware, deleteAccountType);

export default router;
