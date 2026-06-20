import { Router } from "express";
import { getPublicSetting } from "../controllers/setting.controller.js";

const router = Router();

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Lấy cấu hình website
 *     tags: [Setting]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/", getPublicSetting);

export default router;
