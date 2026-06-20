import { Router } from "express";
import {
  register,
  login,
  refreshToken,
  logout,
  me,
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký tài khoản
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin123
 *               password:
 *                 type: string
 *                 example: "12345678"
 *     responses:
 *       200:
 *         description: Đăng ký thành công
 */
router.post("/register", register);
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin123
 *               password:
 *                 type: string
 *                 example: "12345678"
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 */
router.post("/login", login);
/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Làm mới access token
 *     tags: [Auth]
 */
/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Làm mới access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: your_refresh_token_here
 *     responses:
 *       200:
 *         description: Làm mới token thành công
 *       400:
 *         description: Thiếu refresh token
 *       401:
 *         description: Refresh token không hợp lệ hoặc đã hết hạn
 */
router.post("/refresh", refreshToken);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Lấy thông tin tài khoản hiện tại
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy thông tin tài khoản thành công
 *       401:
 *         description: Vui lòng đăng nhập để tiếp tục
 */
router.get("/me", authMiddleware, me);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Đăng xuất
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 *       401:
 *         description: Vui lòng đăng nhập để tiếp tục
 */
router.post("/logout", authMiddleware, logout);

export default router;
