export class AssistantLlmProviderError extends Error {
  constructor(code, cause) {
    super(code, { cause });
    this.name = "AssistantLlmProviderError";
    this.code = code;
  }
}

function extractReply(provider, data) {
  if (provider === "gemini") {
    return data?.candidates?.[0]?.content?.parts
      ?.filter((part) => typeof part?.text === "string")
      .map((part) => part.text)
      .join(" ") || "";
  }
  return typeof data?.choices?.[0]?.message?.content === "string"
    ? data.choices[0].message.content
    : "";
}

export function createAssistantLlmProvider(config, { fetcher = globalThis.fetch } = {}) {
  if (!config?.apiKey || !["gemini", "vilao"].includes(config.provider) || !config.model) return null;

  return {
    async generate({ instructions, messages, maxOutputTokens }) {
      const isGemini = config.provider === "gemini";
      const url = isGemini
        ? `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent`
        : `${config.endpoint}/chat/completions`;
      const body = isGemini ? {
        system_instruction: { parts: [{ text: instructions }] },
        contents: messages.map((message) => ({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.text }],
        })),
        generationConfig: { maxOutputTokens, temperature: 0.25, topP: 0.8 },
      } : {
        model: config.model,
        messages: [
          { role: "system", content: instructions },
          ...messages.map((message) => ({ role: message.role, content: message.text })),
        ],
        max_tokens: maxOutputTokens,
        temperature: 0.25,
        stream: false,
      };

      let response;
      try {
        response = await fetcher(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(isGemini ? { "x-goog-api-key": config.apiKey } : { Authorization: `Bearer ${config.apiKey}` }),
          },
          body: JSON.stringify(body),
          redirect: "error",
          signal: AbortSignal.timeout(12_000),
        });
      } catch (error) {
        throw new AssistantLlmProviderError("LLM_CONNECTION_FAILED", error);
      }
      if (!response.ok) throw new AssistantLlmProviderError(`LLM_HTTP_${response.status}`);

      let data;
      try { data = await response.json(); } catch (error) {
        throw new AssistantLlmProviderError("LLM_BAD_RESPONSE", error);
      }
      const text = extractReply(config.provider, data).trim();
      if (!text) throw new AssistantLlmProviderError("LLM_EMPTY_RESPONSE");
      return { text };
    },
  };
}
