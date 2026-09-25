import { Router } from "express";

import { authMiddleware } from "../../shared/middlewares/auth.middleware.js";
import { adminMiddleware } from "../../shared/middlewares/admin.middleware.js";
import { createRateLimit } from "../../config/http.js";
import { probeAssistantLlm, resolveAssistantLlmProbeConfig, AssistantLlmProbeError } from "../assistant/assistant-llm-probe.service.js";
import { successResponse, errorResponse } from "../../shared/utils/response.util.js";

import {
  getAdminDashboard,
  getAdminUsers,
  updateAdminUser,
  updateUserMoney,
  getAdminAccounts,
  getAdminOrders,
  getAdminTransactions,
  getAdminSales,
  createAdminSale,
  updateAdminSale,
  deleteAdminSale,
  getAdminDiscounts,
  createAdminDiscount,
  updateAdminDiscount,
  deleteAdminDiscount,
  getAdminSetting,
  updateAdminSetting,
  getAdminLogs,
  getAdminBanks,
  createAdminBank,
  updateAdminBank,
  deleteAdminBank,
} from "./admin.controller.js";

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Thống kê dashboard admin
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assistant_llm_provider:
 *                 type: string
 *                 enum: [none, gemini, vilao]
 *               assistant_llm_model:
 *                 type: string
 *               assistant_llm_endpoint:
 *                 type: string
 *               assistant_llm_api_key:
 *                 type: string
 *                 writeOnly: true
 *                 description: Key tạm thời chỉ dùng cho lần kiểm tra này và không được lưu
 *     responses:
 *       200:
 *         description: Lấy dữ liệu dashboard thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền admin
 */
router.get("/dashboard", getAdminDashboard);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Danh sách người dùng
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách người dùng thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền admin
 */
router.get("/users", getAdminUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: Cập nhật người dùng
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.put("/users/:id", updateAdminUser);

/**
 * @swagger
 * /api/admin/users/{id}/money:
 *   post:
 *     summary: Cộng hoặc trừ tiền người dùng
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: header
 *         name: Idempotency-Key
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 16
 *         description: Khóa duy nhất cho một lần điều chỉnh số dư; giữ nguyên khi retry.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - amount
 *             properties:
 *               type:
 *                 type: string
 *                 enum:
 *                   - add
 *                   - sub
 *               amount:
 *                 type: integer
 *                 example: 100000
 *               description:
 *                 type: string
 *                 example: Admin cộng tiền test
 *     responses:
 *       200:
 *         description: Cập nhật số dư thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy người dùng
 */
router.post("/users/:id/money", updateUserMoney);

/**
 * @swagger
 * /api/admin/accounts:
 *   get:
 *     summary: Danh sách tài khoản game
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/accounts", getAdminAccounts);

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: Danh sách đơn hàng
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/orders", getAdminOrders);

/**
 * @swagger
 * /api/admin/transactions:
 *   get:
 *     summary: Danh sách giao dịch
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/transactions", getAdminTransactions);

/**
 * @swagger
 * /api/admin/sales:
 *   get:
 *     summary: Danh sách sale
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/sales", getAdminSales);

/**
 * @swagger
 * /api/admin/sales:
 *   post:
 *     summary: Thêm sale
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post("/sales", createAdminSale);

/**
 * @swagger
 * /api/admin/sales/{id}:
 *   put:
 *     summary: Cập nhật sale
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.put("/sales/:id", updateAdminSale);

/**
 * @swagger
 * /api/admin/sales/{id}:
 *   delete:
 *     summary: Tắt sale
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.delete("/sales/:id", deleteAdminSale);

/**
 * @swagger
 * /api/admin/discounts:
 *   get:
 *     summary: Danh sách mã giảm giá
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/discounts", getAdminDiscounts);

/**
 * @swagger
 * /api/admin/discounts:
 *   post:
 *     summary: Thêm mã giảm giá
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post("/discounts", createAdminDiscount);

/**
 * @swagger
 * /api/admin/discounts/{id}:
 *   put:
 *     summary: Cập nhật mã giảm giá
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.put("/discounts/:id", updateAdminDiscount);

/**
 * @swagger
 * /api/admin/discounts/{id}:
 *   delete:
 *     summary: Tắt mã giảm giá
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.delete("/discounts/:id", deleteAdminDiscount);

/**
 * @swagger
 * /api/admin/setting:
 *   get:
 *     summary: Lấy cấu hình website
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy cấu hình website thành công
 */
router.get("/setting", getAdminSetting);

/**
 * @swagger
 * /api/admin/setting:
 *   put:
 *     summary: Cập nhật cấu hình website
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assistant_name:
 *                 type: string
 *                 maxLength: 40
 *               assistant_avatar:
 *                 type: string
 *                 description: URL HTTPS hoặc đường dẫn /uploads
 *               assistant_llm_provider:
 *                 type: string
 *                 enum: [none, gemini, vilao]
 *               assistant_llm_model:
 *                 type: string
 *                 description: Mã model hoặc alias; Gemini để trống dùng Flash-Lite
 *               assistant_llm_endpoint:
 *                 type: string
 *                 description: URL HTTPS /v1 của ViLao API key
 *               assistant_llm_api_key:
 *                 type: string
 *                 writeOnly: true
 *                 description: Chỉ gửi khi thêm hoặc thay key; không được trả lại
 *               assistant_llm_clear_key:
 *                 type: boolean
 *                 description: Gửi true để xóa key hiện tại
 *     responses:
 *       200:
 *         description: Cập nhật cấu hình website thành công
 */
router.put("/setting", updateAdminSetting);

/**
 * @swagger
 * /api/admin/assistant/test-llm:
 *   post:
 *     summary: Gửi hello tới model LLM đã lưu để kiểm tra kết nối
 *     tags: [Admin, Assistant]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Model đã trả lời; chỉ trả tên model, câu trả lời ngắn và thời gian
 *       400:
 *         description: Chưa lưu cấu hình hoặc thiếu model
 *       422:
 *         description: Key, model, số dư hoặc quyền truy cập không hợp lệ
 */
router.post("/assistant/test-llm", createRateLimit({ windowMs: 60_000, max: 3 }), async (req, res) => {
  try {
    const config = await resolveAssistantLlmProbeConfig(req.body);
    const result = await probeAssistantLlm({ config });
    res.setHeader("Cache-Control", "no-store");
    return successResponse(res, "Model đã phản hồi", result);
  } catch (error) {
    if (error instanceof AssistantLlmProbeError) return errorResponse(res, error.message, error.status, error.code, req);
    console.error("ASSISTANT LLM PROBE ERROR:", error?.name || "unknown");
    return errorResponse(res, "Không kiểm tra được model lúc này", 500, "LLM_PROBE_FAILED", req);
  }
});

/**
 * @swagger
 * /api/admin/logs:
 *   get:
 *     summary: Lịch sử hoạt động hệ thống
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy lịch sử hoạt động thành công
 */
router.get("/logs", getAdminLogs);

/**
 * @swagger
 * /api/admin/banks:
 *   get:
 *     summary: Danh sách ngân hàng admin quản lý
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 */
router.get("/banks", getAdminBanks);

/**
 * @swagger
 * /api/admin/banks:
 *   post:
 *     summary: Thêm ngân hàng nạp tiền mới
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bank_name
 *               - account_number
 *               - account_holder
 *             properties:
 *               bank_name:
 *                 type: string
 *                 example: MBBank
 *               account_number:
 *                 type: string
 *                 example: "0987654321"
 *               account_holder:
 *                 type: string
 *                 example: NGUYEN VAN A
 *               qr_template:
 *                 type: string
 *                 example: https://img.vietqr.io/image/MB-0987654321-compact2.png
 *               status:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Thêm thành công
 */
router.post("/banks", createAdminBank);

/**
 * @swagger
 * /api/admin/banks/{id}:
 *   put:
 *     summary: Cập nhật thông tin ngân hàng
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put("/banks/:id", updateAdminBank);

/**
 * @swagger
 * /api/admin/banks/{id}:
 *   delete:
 *     summary: Xóa / ẩn ngân hàng
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete("/banks/:id", deleteAdminBank);

export default router;
