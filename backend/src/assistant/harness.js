import { ASSISTANT_LIMITS, buildShopAssistantInstructions } from "./instructions.js";
import { DEFAULT_ASSISTANT_NAME, normalizeAssistantName } from "./profile.js";
import { ASSISTANT_TOOLS, executeAssistantTool } from "./tools.js";
import { getAssistantSkillResponse, matchAssistantSkill } from "./skills.js";
import { answerShoppingRequest, parseShoppingRequest } from "../services/shop-assistant.service.js";

export function compactAssistantHistory(history) {
  if (!Array.isArray(history)) return [];
  return history.filter((entry) =>
    entry && ["user", "assistant"].includes(entry.role) && typeof entry.text === "string",
  ).slice(-ASSISTANT_LIMITS.maxHistoryMessages).map((entry) => ({
    role: entry.role,
    text: entry.text.slice(0, ASSISTANT_LIMITS.maxHistoryChars),
  }));
}

const OUT_OF_SCOPE = "Mình chỉ tư vấn về shop với acc Liên Quân thui nhaa. Bạn muốn mình tìm acc tầm giá nào nè?";

function conversationalReply(message, displayName) {
  const normalized = message.toLocaleLowerCase("vi-VN").trim();
  const simpleMessage = normalized.replace(/[?!.,\s]+$/u, "");
  const namedThanks = ["cảm ơn", "cám ơn", "cam on", "thanks", "thank you"].some((prefix) => simpleMessage === `${prefix} ${displayName.toLocaleLowerCase("vi-VN")}`);
  if (namedThanks || /^(?:cảm ơn|cam on|thank(?:s| you)?|cám ơn|tks|thx)(?:[\s!.,]*(?:bạn|ban|nha|nhé|nhe|ạ|a|shop))*[\s!.,]*$/u.test(normalized)) {
    return { text: "Không có gì đâu nhaa! Cần tìm acc theo giá thì bạn cứ nhắn mình nhé.", accounts: [] };
  }
  if (/^(?:bạn tên gì|ten ban la gi|tên bạn là gì|bạn là ai|ban la ai)(?:\s+(?:v|vậy|vay|thế|the))?$/u.test(simpleMessage)) {
    return { text: `Mình là ${displayName}, nhân viên tư vấn của shop nè. Bạn đang muốn tìm acc nào thế?`, accounts: [] };
  }
  const namedGreeting = simpleMessage === `chào ${displayName.toLocaleLowerCase("vi-VN")}`;
  if (namedGreeting || /^(?:chào|xin chào|hello|hi|alo)(?:[\s!.,]*(?:bạn|ban|shop|ơi|oi|ạ|a))*[\s!.,]*$/u.test(normalized)) {
    return { text: `Chào bạn nhaa, mình là ${displayName} đây! Bạn muốn tìm acc tầm bao nhiêu để mình xem giúp nè?`, accounts: [] };
  }
  if (/^(?:giúp|giup|giúp mình|giup minh|cần giúp|can giup|cứu mình|cuu minh)(?:[\s!.,]*(?:với|voi|nha|nhé|nhe|ạ|a))*[\s!.,]*$/u.test(normalized)) {
    return { text: "Mình đây nè! Bạn cần tìm acc, xem đơn hàng hay gặp admin để mình giúp nhá?", accounts: [] };
  }
  return null;
}

function isShoppingRequest(request) {
  const normalized = request.message.toLocaleLowerCase("vi-VN");
  return Boolean(
    request.budget
    || request.saleOnly
    || /(?:tìm|tim|kiếm|kiem|xem|cần|can|muốn|muon|cho xem)\s+[^.!?]{0,18}\b(?:acc|nick)\b/u.test(normalized)
    || /(?:mua|có|co)\s+(?:acc|nick)\b/u.test(normalized)
    || /\b(?:acc|nick)\b[^.!?]{0,20}(?:giá|gia|tầm|tam|khoảng|khoang)/u.test(normalized),
  );
}

function isWebsiteQuestion(message) {
  return /\bshop\b|website|trang web|mua hàng|mua hang|thanh toán|thanh toan|giao dịch|giao dich|giỏ hàng|gio hang|sản phẩm|san pham/u.test(message.toLocaleLowerCase("vi-VN"));
}

function isSimpleShoppingRequest(request) {
  const normalized = request.message.toLocaleLowerCase("vi-VN").trim();
  if (request.saleOnly && /(?:acc|nick|sale|giảm giá|giam gia|khuyến mãi|khuyen mai)/u.test(normalized)) return true;
  if (request.budget && /(?:acc|nick|tìm|tim|kiếm|kiem|cần|can|muốn|muon|giá|gia|tầm|tam|khoảng|khoang)/u.test(normalized)) return true;
  return /^(?:(?:cho mình|cho minh) )?(?:tìm|tim|xem) (?:acc|nick)(?: đang bán| dang ban)?[.!?]*$/u.test(normalized);
}

function isClearlyUnrelatedRequest(message) {
  return /(?:viết|viet|làm|lam|giải|giai)\s+(?:code|thơ|tho|văn|van|bài tập|bai tap)|(?:thời tiết|thoi tiet|chính trị|chinh tri|bóng đá|bong da|nấu ăn|nau an|dịch bài|dich bai)|\b(?:python|javascript|java|c\+\+)\b/iu.test(message);
}

function isPotentialShopQuestion(request, history) {
  const normalized = request.message.toLocaleLowerCase("vi-VN").trim();
  if (isClearlyUnrelatedRequest(normalized)) return false;
  return isWebsiteQuestion(normalized)
    || isShoppingRequest(request)
    || /(?:acc|nick|liên quân|lien quan|đơn hàng|don hang|nạp tiền|nap tien|bảo hành|bao hanh|admin|zalo|mã acc|ma acc)/u.test(normalized)
    || /^\d{1,7}(?:[.,]\d+)?\s*(?:k|tr|triệu|nghìn|ngàn|đ|vnd)?[.!?]*$/u.test(normalized)
    || (Array.isArray(history) && history.length > 0 && normalized.length <= 120);
}

function containsInstructionAttack(message) {
  return /ignore (all |previous |prior )?instructions|bỏ qua (mọi |tất cả |các )?(chỉ dẫn|hướng dẫn|quy tắc)|đóng vai|giả làm (system|developer|admin)|system prompt|developer message|tiết lộ (prompt|instruction)|reveal (prompt|secret)|<\/?(?:system|developer|assistant)>|\[INST\]|```/iu.test(message);
}

function sanitizeModelReply(value) {
  if (typeof value !== "string") return "";
  const clean = value
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, "$1")
    .replace(/<[^>]*>/gu, " ")
    .replace(/(?:https?:\/\/|www\.)\S+/giu, "")
    .replace(/[\u0000-\u001F\u007F]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
  const sentences = clean.match(/[^.!?]+[.!?]?/gu)?.slice(0, 2).join(" ").trim() || "";
  return sentences.slice(0, 320).trim();
}

function parseModelDecision(value) {
  if (typeof value !== "string") return null;
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  let decision;
  try { decision = JSON.parse(value.slice(start, end + 1)); } catch { return null; }
  if (!decision || typeof decision !== "object") return null;
  if (decision.action === "out_of_scope") return { action: "out_of_scope" };
  if (decision.action === "support" && ["orders", "topup", "warranty", "contact"].includes(decision.skill)) {
    return { action: "support", skill: decision.skill };
  }
  if (decision.action === "reply") {
    const reply = sanitizeModelReply(decision.reply);
    return reply ? { action: "reply", reply } : null;
  }
  if (decision.action !== "search_accounts") return null;
  const budget = Number(decision.budget);
  return {
    action: "search_accounts",
    budget: Number.isSafeInteger(budget) && budget >= 10_000 && budget <= 100_000_000 ? budget : null,
    underBudget: decision.underBudget === true,
    saleOnly: decision.saleOnly === true,
  };
}

export async function runShopAssistant({ message, history = [], provider = null, profile = null }) {
  const request = parseShoppingRequest(message);
  const displayName = normalizeAssistantName(profile?.name) || DEFAULT_ASSISTANT_NAME;
  if (containsInstructionAttack(request.message)) return { text: OUT_OF_SCOPE, accounts: [] };

  const conversational = conversationalReply(request.message, displayName);
  if (conversational) return conversational;
  const support = !request.budget && !request.saleOnly && matchAssistantSkill(request.message);
  if (support) return support;
  if (isSimpleShoppingRequest(request)) {
    const accounts = await executeAssistantTool("search_accounts", request);
    return answerShoppingRequest(request, accounts);
  }

  if (!provider) {
    if (isShoppingRequest(request)) {
      const accounts = await executeAssistantTool("search_accounts", request);
      return answerShoppingRequest(request, accounts);
    }
    return isWebsiteQuestion(request.message) ? {
      text: "Mình hỗ trợ tìm acc, đơn hàng, nạp tiền với liên hệ shop nha. Bạn cần mình giúp mục nào nè?",
      accounts: [],
    } : { text: OUT_OF_SCOPE, accounts: [] };
  }

  if (!isPotentialShopQuestion(request, history)) return { text: OUT_OF_SCOPE, accounts: [] };

  const compactHistory = compactAssistantHistory(history);
  const conversation = compactHistory.length ? compactHistory : [{
    role: "assistant",
    text: `Chào bạn nhaa, mình là ${displayName} đây! Bạn muốn tìm acc tầm bao nhiêu để mình xem giúp nè?`,
  }];
  let result;
  try {
    result = await provider.generate({
      instructions: buildShopAssistantInstructions(displayName, profile),
      messages: [...conversation, { role: "user", text: request.message }],
      tools: ASSISTANT_TOOLS,
      maxOutputTokens: ASSISTANT_LIMITS.maxOutputTokens,
    });
  } catch {
    return { text: "Ui, mình chưa kết nối được với hệ thống tư vấn mất rồi. Bạn thử lại xíu nữa hoặc nhắn shop giúp mình nhé.", accounts: [], link: { label: "Liên hệ shop", href: "/contact" } };
  }
  const decision = parseModelDecision(result?.text);
  if (decision?.action === "search_accounts") {
    const toolRequest = {
      ...request,
      budget: decision.budget,
      underBudget: decision.underBudget,
      saleOnly: decision.saleOnly,
    };
    const accounts = await executeAssistantTool("search_accounts", toolRequest);
    return answerShoppingRequest(toolRequest, accounts);
  }
  if (decision?.action === "reply") return { text: decision.reply, accounts: [] };
  if (decision?.action === "support") return getAssistantSkillResponse(decision.skill);
  if (decision?.action === "out_of_scope") return { text: OUT_OF_SCOPE, accounts: [] };
  return {
    text: "Mình hỗ trợ tìm acc, xem đơn, nạp tiền với liên hệ shop nhaa. Bạn đang cần mục nào nè?",
    accounts: [],
  };
}
