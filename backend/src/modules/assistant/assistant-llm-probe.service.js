import {
  DEFAULT_GEMINI_MODEL,
  DEFAULT_VILAO_ENDPOINT,
  getAssistantLlmConfig,
  normalizeAssistantLlmModel,
  normalizeAssistantLlmProvider,
  normalizeVilaoEndpoint,
} from "./assistant-llm-config.service.js";

export class AssistantLlmProbeError extends Error {
  constructor(message, code, status = 502) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function providerFailure(status) {
  if (status === 400) return new AssistantLlmProbeError("Model hoặc cấu hình yêu cầu không hợp lệ", "LLM_BAD_REQUEST", 422);
  if (status === 401) return new AssistantLlmProbeError("API key không hợp lệ hoặc đã hết hiệu lực", "LLM_KEY_REJECTED", 422);
  if (status === 402) return new AssistantLlmProbeError("Tài khoản nhà cung cấp không đủ số dư", "LLM_INSUFFICIENT_CREDIT", 422);
  if (status === 403) return new AssistantLlmProbeError("API key chưa có quyền dùng model này", "LLM_MODEL_FORBIDDEN", 422);
  if (status === 404) return new AssistantLlmProbeError("Không tìm thấy model hoặc endpoint", "LLM_MODEL_NOT_FOUND", 422);
  if (status === 429) return new AssistantLlmProbeError("Nhà cung cấp đang giới hạn yêu cầu, thử lại sau", "LLM_PROVIDER_RATE_LIMITED", 429);
  return new AssistantLlmProbeError("Không gọi được model. Kiểm tra cấu hình và thử lại", "LLM_PROVIDER_ERROR");
}

export async function resolveAssistantLlmProbeConfig(input = {}) {
  const saved = await getAssistantLlmConfig();
  if (!input || typeof input !== "object") return saved;
  const draftFields = ["assistant_llm_provider", "assistant_llm_api_key", "assistant_llm_model", "assistant_llm_endpoint"];
  if (!draftFields.some((field) => input[field] !== undefined)) return saved;

  const provider = input.assistant_llm_provider === undefined
    ? saved.provider
    : normalizeAssistantLlmProvider(input.assistant_llm_provider);
  if (provider === null) throw new AssistantLlmProbeError("Nhà cung cấp LLM không hợp lệ", "INVALID_ASSISTANT_LLM_PROVIDER", 400);

  let apiKey = saved.apiKey;
  if (input.assistant_llm_api_key !== undefined) {
    if (typeof input.assistant_llm_api_key !== "string" || input.assistant_llm_api_key.trim().length < 16 || input.assistant_llm_api_key.trim().length > 4096) {
      throw new AssistantLlmProbeError("API key LLM phải có từ 16 đến 4096 ký tự", "INVALID_ASSISTANT_LLM_KEY", 400);
    }
    apiKey = input.assistant_llm_api_key.trim();
  }

  const normalizedModel = input.assistant_llm_model === undefined
    ? saved.model
    : normalizeAssistantLlmModel(input.assistant_llm_model);
  if (normalizedModel === null) throw new AssistantLlmProbeError("Tên model LLM không hợp lệ", "INVALID_ASSISTANT_LLM_MODEL", 400);
  const model = normalizedModel || (provider === "gemini" ? DEFAULT_GEMINI_MODEL : "");

  const endpoint = input.assistant_llm_endpoint === undefined
    ? saved.endpoint
    : normalizeVilaoEndpoint(input.assistant_llm_endpoint);
  if (endpoint === null) throw new AssistantLlmProbeError("Endpoint ViLao phải là URL HTTPS /v1 thuộc vilao.ai", "INVALID_ASSISTANT_LLM_ENDPOINT", 400);

  return { provider, apiKey, model, endpoint: endpoint || DEFAULT_VILAO_ENDPOINT };
}

export async function probeAssistantLlm({ fetcher = globalThis.fetch, config = null } = {}) {
  const { provider, apiKey, model, endpoint } = config || await getAssistantLlmConfig();
  if (!apiKey || provider === "none") throw new AssistantLlmProbeError("Hãy lưu nhà cung cấp và API key trước", "LLM_NOT_CONFIGURED", 400);
  if (!model) throw new AssistantLlmProbeError("Hãy lưu mã model trước khi kiểm tra", "LLM_MODEL_REQUIRED", 400);

  const isGemini = provider === "gemini";
  const url = isGemini
    ? `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`
    : `${endpoint}/chat/completions`;
  const body = isGemini
    ? { contents: [{ role: "user", parts: [{ text: "hello" }] }], generationConfig: { maxOutputTokens: 32, temperature: 0 } }
    : { model, messages: [{ role: "user", content: "hello" }], max_tokens: 32, temperature: 0, stream: false };

  const started = Date.now();
  let response;
  try {
    response = await fetcher(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(isGemini ? { "x-goog-api-key": apiKey } : { Authorization: `Bearer ${apiKey}` }),
      },
      body: JSON.stringify(body),
      redirect: "error",
      signal: AbortSignal.timeout(12_000),
    });
  } catch (error) {
    if (error?.name === "TimeoutError" || error?.name === "AbortError") throw new AssistantLlmProbeError("Model phản hồi quá lâu, thử lại sau", "LLM_TIMEOUT", 504);
    throw new AssistantLlmProbeError("Không kết nối được tới nhà cung cấp LLM", "LLM_CONNECTION_ERROR");
  }
  if (!response.ok) throw providerFailure(response.status);

  let data;
  try { data = await response.json(); } catch { throw new AssistantLlmProbeError("Model trả về dữ liệu không hợp lệ", "LLM_BAD_RESPONSE"); }
  const rawReply = isGemini
    ? data?.candidates?.[0]?.content?.parts?.filter((part) => typeof part.text === "string").map((part) => part.text).join(" ")
    : data?.choices?.[0]?.message?.content;
  const reply = typeof rawReply === "string" ? rawReply.replace(/\s+/gu, " ").trim().slice(0, 160) : "";
  if (!reply) throw new AssistantLlmProbeError("Model không trả lời câu hello", "LLM_EMPTY_RESPONSE");
  return { provider, model, reply, latency_ms: Date.now() - started };
}
