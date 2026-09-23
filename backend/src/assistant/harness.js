import { ASSISTANT_LIMITS, buildShopAssistantInstructions } from "./instructions.js";
import { DEFAULT_ASSISTANT_NAME, normalizeAssistantName } from "./profile.js";
import { ASSISTANT_TOOLS, executeAssistantTool } from "./tools.js";
import { matchAssistantSkill } from "./skills.js";
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

const OUT_OF_SCOPE = "Mình chỉ tư vấn về shop và acc Liên Quân thôi nhé. Bạn cần mình tìm acc tầm giá nào?";

function conversationalReply(message, displayName) {
  const normalized = message.toLocaleLowerCase("vi-VN").trim();
  const simpleMessage = normalized.replace(/[?!.,\s]+$/u, "");
  const namedThanks = ["cảm ơn", "cám ơn", "cam on", "thanks", "thank you"].some((prefix) => simpleMessage === `${prefix} ${displayName.toLocaleLowerCase("vi-VN")}`);
  if (namedThanks || /^(?:cảm ơn|cam on|thank(?:s| you)?|cám ơn|tks|thx)(?:[\s!.,]*(?:bạn|ban|nha|nhé|nhe|ạ|a|shop))*[\s!.,]*$/u.test(normalized)) {
    return { text: "Dạ không có gì ạ! Nếu cần tìm acc theo giá, bạn cứ nhắn mình nhé.", accounts: [] };
  }
  if (/^(?:bạn tên gì|ten ban la gi|tên bạn là gì|bạn là ai|ban la ai)$/u.test(simpleMessage)) {
    return { text: `Mình là ${displayName}, nhân viên tư vấn của shop. Bạn cần mình giúp tìm acc nào ạ?`, accounts: [] };
  }
  const namedGreeting = simpleMessage === `chào ${displayName.toLocaleLowerCase("vi-VN")}`;
  if (namedGreeting || /^(?:chào|xin chào|hello|hi|alo)(?:[\s!.,]*(?:bạn|ban|shop|ơi|oi|ạ|a))*[\s!.,]*$/u.test(normalized)) {
    return { text: `Chào bạn! Mình là ${displayName}. Bạn muốn tìm acc khoảng bao nhiêu tiền ạ?`, accounts: [] };
  }
  if (/^(?:giúp|giup|giúp mình|giup minh|cần giúp|can giup|cứu mình|cuu minh)(?:[\s!.,]*(?:với|voi|nha|nhé|nhe|ạ|a))*[\s!.,]*$/u.test(normalized)) {
    return { text: "Dạ mình đây! Bạn cần tìm acc, xem đơn hàng hay liên hệ admin ạ?", accounts: [] };
  }
  return null;
}

function isShoppingRequest(request) {
  const normalized = request.message.toLocaleLowerCase("vi-VN");
  return Boolean(request.budget || request.saleOnly || /\bacc\b|tài khoản|tai khoan|liên quân|lien quan|kho acc/u.test(normalized));
}

function isWebsiteQuestion(message) {
  return /\bshop\b|website|trang web|mua hàng|mua hang|thanh toán|thanh toan|giao dịch|giao dich|giỏ hàng|gio hang|sản phẩm|san pham/u.test(message.toLocaleLowerCase("vi-VN"));
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

export async function runShopAssistant({ message, history = [], provider = null, profile = null }) {
  const request = parseShoppingRequest(message);
  const displayName = normalizeAssistantName(profile?.name) || DEFAULT_ASSISTANT_NAME;
  if (containsInstructionAttack(request.message)) return { text: OUT_OF_SCOPE, accounts: [] };
  const conversational = conversationalReply(request.message, displayName);
  if (conversational) return conversational;
  const support = !request.budget && !request.saleOnly && matchAssistantSkill(request.message);
  if (support) return support;

  const isShopping = isShoppingRequest(request);
  if (!isShopping && !isWebsiteQuestion(request.message)) return { text: OUT_OF_SCOPE, accounts: [] };
  if (isShopping || !provider) {
    // Common shopping questions use the catalog directly and spend zero LLM tokens.
    const accounts = isShopping ? await executeAssistantTool("search_accounts", request) : [];
    return isShopping ? answerShoppingRequest(request, accounts) : {
      text: "Mình hỗ trợ tìm acc, đơn hàng, nạp tiền và liên hệ shop. Bạn cần giúp mục nào?",
      accounts: [],
    };
  }

  // Provider contract for later Gemini/VILAO integration. Only compact context
  // and a single bounded tool are exposed; keys stay entirely on the server.
  let result;
  try {
    result = await provider.generate({
      instructions: buildShopAssistantInstructions(displayName, profile),
      messages: [...compactAssistantHistory(history), { role: "user", text: request.message }],
      tools: ASSISTANT_TOOLS,
      maxOutputTokens: ASSISTANT_LIMITS.maxOutputTokens,
    });
  } catch {
    return { text: "Mình chưa kết nối được với hệ thống tư vấn lúc này. Bạn thử lại hoặc liên hệ shop nhé.", accounts: [], link: { label: "Liên hệ shop", href: "/contact" } };
  }
  const call = result?.toolCalls?.find((item) => item?.name === "search_accounts");
  if (call) {
    // Tool arguments always come from server parsing, never from model output.
    const accounts = await executeAssistantTool(call.name, request);
    return answerShoppingRequest(request, accounts);
  }
  const text = sanitizeModelReply(result?.text);
  return text ? { text, accounts: [] } : {
    text: "Mình hỗ trợ tìm acc, đơn hàng, nạp tiền và liên hệ shop. Bạn cần giúp mục nào?",
    accounts: [],
  };
}
