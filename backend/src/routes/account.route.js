import { Router } from "express";

import {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
} from "../controllers/account.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { ctvMiddleware } from "../middlewares/ctv.middleware.js";

const router = Router();

/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: Lấy danh sách tài khoản đang bán
 *     tags: [Account]
 *     parameters:
 *       - in: query
 *         name: loai_id
 *         schema:
 *           type: integer
 *         description: Lọc theo loại tài khoản
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum:
 *             - price_asc
 *             - price_desc
 *         description: Sắp xếp theo giá
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
 */
router.get("/", getAccounts);

/**
 * @swagger
 * /api/accounts/{id}:
 *   get:
 *     summary: Lấy chi tiết tài khoản đang bán
 *     tags: [Account]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID tài khoản
 */
router.get("/:id", getAccountById);

/**
 * @swagger
 * /api/accounts:
 *   post:
 *     summary: Thêm tài khoản game
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - loai_id
 *               - gia
 *               - login
 *             properties:
 *               loai_id:
 *                 type: integer
 *               thong_tin:
 *                 type: string
 *               list_thong_tin:
 *                 type: string
 *               img:
 *                 type: string
 *               list_img:
 *                 type: string
 *               login:
 *                 type: string
 *               gia:
 *                 type: integer
 *               ck:
 *                 type: integer
 */
router.post("/", authMiddleware, ctvMiddleware, createAccount);

/**
 * @swagger
 * /api/accounts/{id}:
 *   put:
 *     summary: Cập nhật tài khoản
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.put("/:id", authMiddleware, updateAccount);

/**
 * @swagger
 * /api/accounts/{id}:
 *   delete:
 *     summary: Ẩn tài khoản
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.delete("/:id", authMiddleware, deleteAccount);

export default router;
