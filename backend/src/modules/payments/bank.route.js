import { Router } from "express";
import { getBanks } from "./bank.controller.js";

const router = Router();

/**
 * @swagger
 * /api/banks:
 *   get:
 *     summary: Lấy danh sách ngân hàng / ví điện tử nạp tiền
 *     tags: [Bank]
 *     responses:
 *       200:
 *         description: Lấy danh sách ngân hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Bank'
 */
router.get("/", getBanks);

export default router;

