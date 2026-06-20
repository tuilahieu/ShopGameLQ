import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware.js";

import {
  getProfile,
  changePassword,
} from "../controllers/profile.controller.js";

const router = Router();

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Lấy thông tin cá nhân
 *     tags:
 *       - Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy thông tin cá nhân thành công
 *       401:
 *         description: Chưa đăng nhập
 */
router.get("/", authMiddleware, getProfile);

/**
 * @swagger
 * /api/profile/change-password:
 *   post:
 *     summary: Đổi mật khẩu
 *     tags:
 *       - Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 example: "12345678"
 *               newPassword:
 *                 type: string
 *                 example: "87654321"
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 */
router.post("/change-password", authMiddleware, changePassword);

export default router;
