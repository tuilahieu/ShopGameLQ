import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { AssistantMessage, AssistantThread } from "../src/database/models.js";
import { sequelize } from "../src/config/database.js";
import { findOwnedThread, getThreadMessages, saveExchange } from "../src/modules/assistant/assistant-thread.service.js";
import { up as createAssistantTables } from "../src/database/migrations/20260923_006_assistant_threads.js";

test("thread tables keep messages separate and cascade on deletion", async () => {
  const statements = [];
  await createAssistantTables({ sequelize: { query: async (sql) => { statements.push(sql); } } });
  assert.equal(statements.length, 2);
  assert.match(statements[0], /CREATE TABLE IF NOT EXISTS assistant_threads/u);
  assert.match(statements[1], /CREATE TABLE IF NOT EXISTS assistant_messages/u);
  assert.match(statements[1], /ON DELETE CASCADE/u);
});

test("history access requires a valid thread id and secret token", async (t) => {
  const lookup = t.mock.method(AssistantThread, "findOne", async () => ({ id: "thread" }));
  const id = "123e4567-e89b-42d3-a456-426614174000";
  const token = "a".repeat(64);
  assert.equal(await findOwnedThread(id, "bad"), null);
  assert.equal(await findOwnedThread("bad", token), null);
  assert.equal(lookup.mock.callCount(), 0);
  assert.deepEqual(await findOwnedThread(id, token), { id: "thread" });
  assert.equal(lookup.mock.calls[0].arguments[0].where.token_hash, createHash("sha256").update(token).digest("hex"));
});

test("history returns bounded messages in chat order", async (t) => {
  const find = t.mock.method(AssistantMessage, "findAll", async () => [
    { role: "assistant", text: "Đây là acc phù hợp", response_json: { accounts: [{ id: 1, href: "/account/1" }] } },
    { role: "user", text: "acc 200k", response_json: null },
  ]);
  const messages = await getThreadMessages("thread", 4);
  assert.deepEqual(messages.map((item) => item.role), ["user", "assistant"]);
  assert.equal(messages[1].accounts[0].href, "/account/1");
  assert.equal(find.mock.calls[0].arguments[0].limit, 4);
});

test("a new exchange saves both messages in one transaction and hashes its access token", async (t) => {
  const transaction = {};
  t.mock.method(sequelize, "transaction", async (callback) => callback(transaction));
  const create = t.mock.method(AssistantThread, "create", async () => {});
  const insert = t.mock.method(AssistantMessage, "bulkCreate", async () => {});
  const session = await saveExchange({
    thread: null,
    question: "acc 200k",
    answer: { text: "Mình tìm thấy một acc", accounts: [{ id: 1, href: "/account/1" }] },
  });
  assert.match(session.thread_id, /^[0-9a-f-]{36}$/u);
  assert.match(session.thread_token, /^[0-9a-f]{64}$/u);
  assert.equal(create.mock.calls[0].arguments[0].token_hash, createHash("sha256").update(session.thread_token).digest("hex"));
  assert.equal(create.mock.calls[0].arguments[1].transaction, transaction);
  assert.equal(insert.mock.calls[0].arguments[1].transaction, transaction);
  assert.deepEqual(insert.mock.calls[0].arguments[0].map((row) => row.role), ["user", "assistant"]);
});
