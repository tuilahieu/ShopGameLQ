import { Router } from "express";

import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";

const router = Router();

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Lấy danh sách danh mục tài khoản
 *     tags: [Category]
 *     responses:
 *       200:
 *         description: Lấy danh sách danh mục thành công
 */
router.get("/", getCategories);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Lấy chi tiết danh mục tài khoản
 *     tags: [Category]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID danh mục
 *     responses:
 *       200:
 *         description: Lấy thông tin danh mục thành công
 *       404:
 *         description: Không tìm thấy danh mục
 */
router.get("/:id", getCategoryById);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Thêm danh mục tài khoản
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Acc Liên Quân
 *               noidung:
 *                 type: string
 *                 example: Danh mục bán tài khoản Liên Quân
 *               type:
 *                 type: string
 *                 example: lienquan
 *               status:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Thêm danh mục thành công
 *       401:
 *         description: Vui lòng đăng nhập để tiếp tục
 *       403:
 *         description: Bạn không có quyền quản trị hệ thống
 */
router.post("/", authMiddleware, adminMiddleware, createCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Cập nhật danh mục tài khoản
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID danh mục
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Acc Liên Quân Mobile
 *               noidung:
 *                 type: string
 *                 example: Danh mục tài khoản tự chọn
 *               type:
 *                 type: string
 *                 example: lienquan
 *               status:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Cập nhật danh mục thành công
 *       401:
 *         description: Vui lòng đăng nhập để tiếp tục
 *       403:
 *         description: Bạn không có quyền quản trị hệ thống
 *       404:
 *         description: Danh mục không tồn tại
 */
router.put("/:id", authMiddleware, adminMiddleware, updateCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Ẩn danh mục tài khoản
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID danh mục
 *     responses:
 *       200:
 *         description: Ẩn danh mục thành công
 *       401:
 *         description: Vui lòng đăng nhập để tiếp tục
 *       403:
 *         description: Bạn không có quyền quản trị hệ thống
 *       404:
 *         description: Danh mục không tồn tại
 */
router.delete("/:id", authMiddleware, adminMiddleware, deleteCategory);

export default router;
