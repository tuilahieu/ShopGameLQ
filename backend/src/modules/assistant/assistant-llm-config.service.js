import { Setting } from "../settings/setting.model.js";
import { decryptCredential } from "../../shared/utils/credential.util.js";

export const ASSISTANT_LLM_PROVIDERS = Object.freeze(["none", "gemini", "vilao"]);
export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite";
export const DEFAULT_VILAO_ENDPOINT = "https://api.vilao.ai/v1";
export const MAX_ASSISTANT_LLM_FALLBACK_MODELS = 5;

export function normalizeAssistantLlmProvider(value) {
  return typeof value === "string" && ASSISTANT_LLM_PROVIDERS.includes(value) ? value : null;
}

export function normalizeAssistantLlmModel(value) {
  if (typeof value !== "string") return null;
  const model = value.trim();
  return model.length <= 120 && (!model || /^[A-Za-z0-9][A-Za-z0-9._:/-]*$/u.test(model)) ? model : null;
}

export function normalizeAssistantLlmFallbackModels(value, primaryModel = "") {
  if (value === undefined || value === null || value === "") return [];
  let models = value;
  if (typeof models === "string") {
    try { models = JSON.parse(models); } catch { return null; }
  }
  if (!Array.isArray(models) || models.length > MAX_ASSISTANT_LLM_FALLBACK_MODELS) return null;
  const normalizedPrimary = normalizeAssistantLlmModel(primaryModel) || "";
  const normalized = [];
  for (const value of models) {
    const model = normalizeAssistantLlmModel(value);
    if (model === null || !model) return null;
    if (model !== normalizedPrimary && !normalized.includes(model)) normalized.push(model);
  }
  return normalized;
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
  const model = effectiveModel(setting, provider);
  return {
    assistant_llm_provider: provider,
    assistant_llm_model: model,
    assistant_llm_fallback_models: normalizeAssistantLlmFallbackModels(setting?.assistant_llm_fallback_models, model) || [],
    assistant_llm_endpoint: normalizeVilaoEndpoint(setting?.assistant_llm_endpoint || "") || DEFAULT_VILAO_ENDPOINT,
    assistant_llm_key_saved: Boolean(setting?.assistant_llm_api_key),
  };
}

// Server-only accessor for a future provider adapter. Never use this in a response serializer.
export async function getAssistantLlmConfig(existingSetting = null) {
  const setting = existingSetting || await Setting.findByPk(1, { attributes: ["assistant_llm_provider", "assistant_llm_api_key", "assistant_llm_model", "assistant_llm_fallback_models", "assistant_llm_endpoint"] });
  const provider = normalizeAssistantLlmProvider(setting?.assistant_llm_provider) || "none";
  const model = effectiveModel(setting, provider);
  return {
    provider,
    apiKey: provider !== "none" && setting?.assistant_llm_api_key?.startsWith("enc:v1:") ? decryptCredential(setting.assistant_llm_api_key) : null,
    model,
    fallbackModels: normalizeAssistantLlmFallbackModels(setting?.assistant_llm_fallback_models, model) || [],
    endpoint: normalizeVilaoEndpoint(setting?.assistant_llm_endpoint || "") || DEFAULT_VILAO_ENDPOINT,
  };
}
