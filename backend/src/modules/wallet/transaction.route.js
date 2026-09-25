import { Router } from "express";

import { authMiddleware } from "../../shared/middlewares/auth.middleware.js";

import { getMyTransactions } from "./transaction.controller.js";

const router = Router();

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Lấy lịch sử giao dịch của tôi
 *     tags: [Transaction]
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
 *         description: Thành công
 */
router.get("/", authMiddleware, getMyTransactions);

export default router;
