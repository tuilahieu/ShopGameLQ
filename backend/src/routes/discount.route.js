import { Router } from "express";

import { checkDiscount } from "../controllers/discount.controller.js";

const router = Router();

/**
 * @swagger
 * /api/discount/check:
 *   post:
 *     summary: Kiểm tra mã giảm giá
 *     tags: [Discount]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - account_id
 *             properties:
 *               code:
 *                 type: string
 *                 example: HELLO10
 *               account_id:
 *                 type: integer
 *                 example: 1
 */
router.post("/check", checkDiscount);

export default router;
