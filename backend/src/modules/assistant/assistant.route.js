import { Router } from "express";
import { createRateLimit } from "../../config/http.js";
import { runShopAssistant } from "./core/harness.js";
import { findOwnedThread, getThreadMessages, saveExchange } from "./assistant-thread.service.js";
import { Setting } from "../../database/models.js";
import { publicAssistantProfile } from "./core/profile.js";
import { getAssistantLlmConfig } from "./assistant-llm-config.service.js";
import { createAssistantLlmProvider } from "./assistant-llm-provider.service.js";
import { executeAgentQuery, parseAgentQuery } from "./core/tools.js";
import { getAssistantRuntimeStatus, observeAssistantProvider } from "./core/runtime-status.js";
import { ASSISTANT_LIMITS } from "./core/instructions.js";
import { validateAssistantAccounts } from "./core/output-validator.js";
import { errorResponse, successResponse } from "../../shared/utils/response.util.js";

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
 * /api/assistant/agent-query:
 *   get:
 *     summary: Tool API tìm tối đa 4 acc công khai quanh mức giá
 *     tags: [Assistant]
 *     parameters:
 *       - in: query
 *         name: price
 *         schema:
 *           type: integer
 *         description: Giá VND; giá viết tắt như 500 được hiểu là 500.000đ
 *       - in: query
 *         name: under_budget
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: sale_only
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Tối đa 4 card acc đang bán, chỉ gồm dữ liệu công khai
 *       400:
 *         description: Tham số giá không hợp lệ
 */
router.get("/agent-query", async (req, res) => {
  const parsed = parseAgentQuery(req.query);
  if ((req.query.price !== undefined || req.query.budget !== undefined) && !parsed.budget) {
    return errorResponse(res, "Mức giá không hợp lệ", 400, "INVALID_AGENT_QUERY", req);
  }
  try {
    const accounts = validateAssistantAccounts(await executeAgentQuery(req.query));
    return successResponse(res, "Tìm tài khoản cho trợ lý thành công", { accounts });
  } catch (error) {
    console.error("ASSISTANT AGENT QUERY ERROR:", error);
    return errorResponse(res, "Không tìm được tài khoản lúc này", 500, "ASSISTANT_UNAVAILABLE", req);
  }
});

/**
 * @swagger
 * /api/assistant/status:
 *   get:
 *     summary: Lấy trạng thái kết nối LLM công khai của chatbot
 *     tags: [Assistant]
 *     responses:
 *       200:
 *         description: Trạng thái online, offline hoặc fallback; không chứa cấu hình LLM
 */
router.get("/status", async (req, res) => {
  try {
    const setting = await Setting.findByPk(1);
    const config = await getAssistantLlmConfig(setting);
    return successResponse(res, "Lấy trạng thái trợ lý thành công", {
      status: getAssistantRuntimeStatus(Boolean(config)),
    });
  } catch {
    return successResponse(res, "Lấy trạng thái trợ lý thành công", { status: "offline" });
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
    const history = thread ? await getThreadMessages(thread.id, ASSISTANT_LIMITS.maxHistoryMessages) : [];
    const setting = await Setting.findByPk(1);
    const profile = {
      ...publicAssistantProfile(setting),
      shopName: typeof setting?.ten_web === "string" ? setting.ten_web : "",
      contact: typeof setting?.sdt_admin === "string" ? setting.sdt_admin : "",
    };
    const llmConfig = await getAssistantLlmConfig(setting);
    const provider = observeAssistantProvider(createAssistantLlmProvider(llmConfig));
    const answer = await runShopAssistant({ message, history, profile, provider });
    const session = await saveExchange({ thread, question: message.trim(), answer });
    return successResponse(res, "Trả lời khách hàng thành công", {
      ...answer,
      ...session,
      assistant_status: getAssistantRuntimeStatus(Boolean(llmConfig)),
    });
  } catch (error) {
    console.error("SHOP ASSISTANT ERROR:", error);
    return errorResponse(res, "Chatbot đang bận, vui lòng thử lại sau", 500, "ASSISTANT_UNAVAILABLE", req);
  }
});

export default router;
