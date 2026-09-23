import { Router } from "express";
import { createRateLimit } from "../config/http.js";
import { runShopAssistant } from "../assistant/harness.js";
import { findOwnedThread, getThreadMessages, saveExchange } from "../services/assistant-thread.service.js";
import { Setting } from "../models/index.js";
import { publicAssistantProfile } from "../assistant/profile.js";
import { getAssistantLlmConfig } from "../services/assistant-llm-config.service.js";
import { createAssistantLlmProvider } from "../services/assistant-llm-provider.service.js";
import { errorResponse, successResponse } from "../utils/response.util.js";

const router = Router();
router.use(createRateLimit({ windowMs: 60_000, max: 20 }));

/**
 * @swagger
 * /api/assistant/thread/{id}:
 *   get:
 *     summary: Tải 100 tin nhắn mới nhất của thread chat
 *     tags: [Assistant]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: header
 *         name: X-Assistant-Thread-Token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lịch sử chat của thread
 *       404:
 *         description: Thread không tồn tại hoặc mã truy cập không đúng
 */
router.get("/thread/:id", async (req, res) => {
  try {
    const thread = await findOwnedThread(req.params.id, req.get("X-Assistant-Thread-Token"));
    if (!thread) return errorResponse(res, "Không tìm thấy cuộc trò chuyện", 404, "THREAD_NOT_FOUND", req);
    const messages = await getThreadMessages(thread.id);
    return successResponse(res, "Lấy lịch sử trò chuyện thành công", { thread_id: thread.id, messages });
  } catch (error) {
    console.error("SHOP ASSISTANT HISTORY ERROR:", error);
    return errorResponse(res, "Không tải được lịch sử trò chuyện", 500, "ASSISTANT_UNAVAILABLE", req);
  }
});

/**
 * @swagger
 * /api/assistant/chat:
 *   post:
 *     summary: Tìm tài khoản theo câu hỏi của khách và trả thẻ sản phẩm có link
 *     tags: [Assistant]
 *     parameters:
 *       - in: header
 *         name: X-Assistant-Thread-Token
 *         required: false
 *         schema:
 *           type: string
 *         description: Bắt buộc khi gửi thread_id để tiếp tục cuộc trò chuyện
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 maxLength: 500
 *               thread_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Câu trả lời và các tài khoản đang bán phù hợp
 *       400:
 *         description: Câu hỏi không hợp lệ
 */
router.post("/chat", async (req, res) => {
  const message = req.body?.message;
  if (typeof message !== "string" || !message.trim() || message.length > 500) {
    return errorResponse(res, "Câu hỏi phải có từ 1 đến 500 ký tự", 400, "INVALID_MESSAGE", req);
  }
  try {
    const threadId = req.body?.thread_id;
    const threadToken = req.get("X-Assistant-Thread-Token");
    if (threadId && !threadToken) return errorResponse(res, "Thiếu mã cuộc trò chuyện", 400, "THREAD_TOKEN_REQUIRED", req);
    const thread = threadId ? await findOwnedThread(threadId, threadToken) : null;
    if (threadId && !thread) return errorResponse(res, "Không tìm thấy cuộc trò chuyện", 404, "THREAD_NOT_FOUND", req);
    const history = thread ? await getThreadMessages(thread.id, 4) : [];
    const setting = await Setting.findByPk(1);
    const profile = {
      ...publicAssistantProfile(setting),
      shopName: typeof setting?.ten_web === "string" ? setting.ten_web : "",
      contact: typeof setting?.sdt_admin === "string" ? setting.sdt_admin : "",
    };
    const provider = createAssistantLlmProvider(await getAssistantLlmConfig(setting));
    const answer = await runShopAssistant({ message, history, profile, provider });
    const session = await saveExchange({ thread, question: message.trim(), answer });
    return successResponse(res, "Trả lời khách hàng thành công", { ...answer, ...session });
  } catch (error) {
    console.error("SHOP ASSISTANT ERROR:", error);
    return errorResponse(res, "Chatbot đang bận, vui lòng thử lại sau", 500, "ASSISTANT_UNAVAILABLE", req);
  }
});

export default router;
