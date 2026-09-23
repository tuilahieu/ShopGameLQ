import assert from "node:assert/strict";
import test from "node:test";

import { updateAdminSetting } from "../src/controllers/admin.controller.js";
import { getPublicSetting } from "../src/controllers/setting.controller.js";
import { up as addAssistantLlmColumns } from "../src/database/migrations/20260923_008_assistant_llm_config.js";
import { up as addAssistantConnectionColumns } from "../src/database/migrations/20260923_009_assistant_llm_connection.js";
import { HistoryLog, Setting } from "../src/models/index.js";
import { DEFAULT_VILAO_ENDPOINT, getAssistantLlmConfig, normalizeAssistantLlmProvider, normalizeVilaoEndpoint } from "../src/services/assistant-llm-config.service.js";
import { AssistantLlmProbeError, probeAssistantLlm } from "../src/services/assistant-llm-probe.service.js";

test("LLM config migration adds both columns once", async () => {
  const added = [];
  const queryInterface = {
    describeTable: async () => ({}),
    addColumn: async (_table, name) => { added.push(name); },
  };
  await addAssistantLlmColumns({ queryInterface });
  assert.deepEqual(added, ["assistant_llm_provider", "assistant_llm_api_key"]);
  queryInterface.describeTable = async () => ({ assistant_llm_provider: {}, assistant_llm_api_key: {} });
  await addAssistantLlmColumns({ queryInterface });
  assert.equal(added.length, 2);
  const connectionColumns = [];
  queryInterface.describeTable = async () => ({});
  queryInterface.addColumn = async (_table, name) => { connectionColumns.push(name); };
  await addAssistantConnectionColumns({ queryInterface });
  assert.deepEqual(connectionColumns, ["assistant_llm_model", "assistant_llm_endpoint"]);
});

test("admin saves an encrypted LLM key and never sends it in the response", async (t) => {
  const setting = { id: 1, assistant_llm_provider: "none", assistant_llm_api_key: null };
  setting.update = async (values) => Object.assign(setting, values);
  t.mock.method(Setting, "findByPk", async () => setting);
  t.mock.method(HistoryLog, "create", async () => ({}));
  const response = { status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; }, setHeader() {} };
  await updateAdminSetting({
    body: { assistant_llm_provider: "gemini", assistant_llm_api_key: "secret-provider-key-123456" },
    user: { id: 1, username: "admin" },
    clientIp: "127.0.0.1",
  }, response);
  assert.equal(response.statusCode, 200);
  assert.ok(setting.assistant_llm_api_key.startsWith("enc:v1:"));
  assert.ok(!setting.assistant_llm_api_key.includes("secret-provider-key"));
  assert.equal(response.body.data.assistant_llm_key_saved, true);
  assert.ok(!JSON.stringify(response.body).includes("secret-provider-key"));
  assert.ok(!JSON.stringify(response.body).includes(setting.assistant_llm_api_key));
  assert.deepEqual(await getAssistantLlmConfig(), { provider: "gemini", apiKey: "secret-provider-key-123456", model: "gemini-3.5-flash-lite", endpoint: DEFAULT_VILAO_ENDPOINT });
});

test("invalid provider and plaintext stored keys cannot be used", async (t) => {
  assert.equal(normalizeAssistantLlmProvider("other"), null);
  t.mock.method(Setting, "findByPk", async () => ({ assistant_llm_provider: "gemini", assistant_llm_api_key: "plaintext-key" }));
  assert.deepEqual(await getAssistantLlmConfig(), { provider: "gemini", apiKey: null, model: "gemini-3.5-flash-lite", endpoint: DEFAULT_VILAO_ENDPOINT });
  assert.equal(normalizeVilaoEndpoint("https://evil.example/v1"), null);
  assert.equal(normalizeVilaoEndpoint("http://api.vilao.ai/v1"), null);
  assert.equal(normalizeVilaoEndpoint("https://api.vilao.ai/v1"), DEFAULT_VILAO_ENDPOINT);
});

test("hello probe calls Gemini with bounded tokens and returns only a short reply", async () => {
  let request;
  const result = await probeAssistantLlm({
    config: { provider: "gemini", apiKey: "private-gemini-key", model: "gemini-3.5-flash-lite", endpoint: DEFAULT_VILAO_ENDPOINT },
    fetcher: async (url, options) => {
      request = { url, options };
      return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: "Hello!" }] } }] }) };
    },
  });
  assert.match(request.url, /generativelanguage\.googleapis\.com/u);
  assert.equal(request.options.headers["x-goog-api-key"], "private-gemini-key");
  assert.equal(JSON.parse(request.options.body).generationConfig.maxOutputTokens, 32);
  assert.equal(request.options.redirect, "error");
  assert.equal(result.reply, "Hello!");
  assert.ok(!JSON.stringify(result).includes("private-gemini-key"));
});

test("hello probe calls ViLao on its fixed domain and maps provider errors safely", async () => {
  let request;
  const config = { provider: "vilao", apiKey: "private-vilao-key", model: "vendor/cheap-model", endpoint: DEFAULT_VILAO_ENDPOINT };
  const result = await probeAssistantLlm({ config, fetcher: async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => ({ choices: [{ message: { content: "Xin chào!" } }] }) };
  } });
  assert.equal(request.url, "https://api.vilao.ai/v1/chat/completions");
  assert.equal(request.options.headers.Authorization, "Bearer private-vilao-key");
  assert.equal(JSON.parse(request.options.body).max_tokens, 32);
  assert.equal(result.reply, "Xin chào!");
  await assert.rejects(
    probeAssistantLlm({ config, fetcher: async () => ({ ok: false, status: 401 }) }),
    (error) => error instanceof AssistantLlmProbeError && error.code === "LLM_KEY_REJECTED" && !error.message.includes(config.apiKey),
  );
});

test("public settings never expose LLM credentials or their status", async (t) => {
  t.mock.method(Setting, "findByPk", async () => ({
    assistant_name: "Mai Anh",
    assistant_avatar: "/uploads/avatar.webp",
    assistant_llm_provider: "gemini",
    assistant_llm_api_key: "enc:v1:private",
  }));
  const response = { status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  await getPublicSetting({}, response);
  assert.equal(response.body.data.assistant_name, "Mai Anh");
  assert.ok(!JSON.stringify(response.body).includes("assistant_llm"));
  assert.ok(!JSON.stringify(response.body).includes("private"));
});
