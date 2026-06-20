import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware.js";

import { upload } from "../middlewares/upload.middleware.js";

import { uploadImage } from "../controllers/upload.controller.js";

const router = Router();

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload ảnh
 *     tags:
 *       - Upload
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Upload thành công
 */
router.post("/", authMiddleware, upload.single("file"), uploadImage);

export default router;
