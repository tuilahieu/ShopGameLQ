import { Setting } from "../settings/setting.model.js";
import { decryptCredential } from "../../shared/utils/credential.util.js";

export const ASSISTANT_LLM_PROVIDERS = Object.freeze(["none", "gemini", "vilao"]);
export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite";
export const DEFAULT_VILAO_ENDPOINT = "https://api.vilao.ai/v1";

export function normalizeAssistantLlmProvider(value) {
  return typeof value === "string" && ASSISTANT_LLM_PROVIDERS.includes(value) ? value : null;
}

export function normalizeAssistantLlmModel(value) {
  if (typeof value !== "string") return null;
  const model = value.trim();
  return model.length <= 120 && (!model || /^[A-Za-z0-9][A-Za-z0-9._:/-]*$/u.test(model)) ? model : null;
}

export function normalizeVilaoEndpoint(value) {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return DEFAULT_VILAO_ENDPOINT;
  if (raw.length > 255) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || !url.hostname.endsWith(".vilao.ai") || url.port || url.username || url.password || url.search || url.hash || !/^\/v1\/?$/u.test(url.pathname)) return null;
    return `${url.origin}/v1`;
  } catch { return null; }
}

function effectiveModel(setting, provider) {
  const model = normalizeAssistantLlmModel(setting?.assistant_llm_model) || "";
  return model || (provider === "gemini" ? DEFAULT_GEMINI_MODEL : "");
}

export function serializeAssistantLlmStatus(setting) {
  const provider = normalizeAssistantLlmProvider(setting?.assistant_llm_provider) || "none";
  return {
    assistant_llm_provider: provider,
    assistant_llm_model: effectiveModel(setting, provider),
    assistant_llm_endpoint: normalizeVilaoEndpoint(setting?.assistant_llm_endpoint || "") || DEFAULT_VILAO_ENDPOINT,
    assistant_llm_key_saved: Boolean(setting?.assistant_llm_api_key),
  };
}

// Server-only accessor for a future provider adapter. Never use this in a response serializer.
export async function getAssistantLlmConfig(existingSetting = null) {
  const setting = existingSetting || await Setting.findByPk(1, { attributes: ["assistant_llm_provider", "assistant_llm_api_key", "assistant_llm_model", "assistant_llm_endpoint"] });
  const provider = normalizeAssistantLlmProvider(setting?.assistant_llm_provider) || "none";
  return {
    provider,
    apiKey: provider !== "none" && setting?.assistant_llm_api_key?.startsWith("enc:v1:") ? decryptCredential(setting.assistant_llm_api_key) : null,
    model: effectiveModel(setting, provider),
    endpoint: normalizeVilaoEndpoint(setting?.assistant_llm_endpoint || "") || DEFAULT_VILAO_ENDPOINT,
  };
}
