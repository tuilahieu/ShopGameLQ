import { Router } from "express";

import { authMiddleware } from "../../shared/middlewares/auth.middleware.js";
import { ctvMiddleware } from "../../shared/middlewares/ctv.middleware.js";

import { upload } from "../../shared/middlewares/upload.middleware.js";

import { uploadImage } from "./upload.controller.js";

const router = Router();

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload ảnh lên hệ thống
 *     tags:
 *       - Upload
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File ảnh (jpg, png, webp...)
 *     responses:
 *       200:
 *         description: Upload thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 url:
 *                   type: string
 *                   example: /uploads/1722400000000-image.png
 */
// Customers never need to write arbitrary files; limit this capability to the
// staff roles that actually manage listings and site assets.
router.post("/", authMiddleware, ctvMiddleware, upload.single("file"), uploadImage);

export default router;
