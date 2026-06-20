import { Router } from "express";

import { getHome } from "../controllers/home.controller.js";

const router = Router();

/**
 * @swagger
 * /api/home:
 *   get:
 *     summary: Dữ liệu trang chủ
 *     tags: [Home]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/", getHome);

export default router;
