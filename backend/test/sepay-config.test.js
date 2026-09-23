import assert from "node:assert/strict";
import test from "node:test";

import { serializeAdminSetting } from "../src/controllers/admin.controller.js";
import { Setting } from "../src/models/setting.model.js";
import { getSePayConfig, resolveSePayConfig } from "../src/services/sepay-config.service.js";
import { encryptCredential } from "../src/utils/credential.util.js";

test("admin SePay secret overrides the legacy environment secret and is encrypted for storage", () => {
  const encrypted = encryptCredential("admin-hmac-secret-1234567890");
  assert.ok(encrypted.startsWith("enc:v1:"));
  assert.ok(!encrypted.includes("admin-hmac-secret"));
  assert.equal(resolveSePayConfig(encrypted, "legacy-secret").webhookSecret, "admin-hmac-secret-1234567890");
  assert.equal(resolveSePayConfig(null, "legacy-secret").webhookSecret, "legacy-secret");
});

test("admin settings response contains only SePay status, never its secret", () => {
  const result = serializeAdminSetting({
    id: 1,
    ten_web: "Shop Game",
    sepay_secret: "private-hmac-secret",
    js_web: "private-script",
  }, { enabled: true, webhookSecret: "private-hmac-secret" });
  assert.equal(result.sepay_configured, true);
  assert.equal(result.sepay_secret_saved, true);
  assert.ok(!Object.hasOwn(result, "sepay_secret"));
  assert.ok(!JSON.stringify(result).includes("private-hmac-secret"));
  assert.ok(!Object.hasOwn(result, "js_web"));
});

test("payment runtime reads the latest saved secret from settings", async (t) => {
  const encrypted = encryptCredential("updated-admin-secret-1234567890");
  t.mock.method(Setting, "findByPk", async () => ({ sepay_secret: encrypted }));
  const config = await getSePayConfig();
  assert.equal(config.webhookSecret, "updated-admin-secret-1234567890");
});

test("legacy plaintext SePay secret is replaced with AES ciphertext on first read", async (t) => {
  const update = t.mock.method(Setting, "update", async () => [1]);
  t.mock.method(Setting, "findByPk", async () => ({ sepay_secret: "legacy-admin-secret-1234567890" }));
  const config = await getSePayConfig();
  assert.equal(config.webhookSecret, "legacy-admin-secret-1234567890");
  assert.equal(update.mock.callCount(), 1);
  const [values, options] = update.mock.calls[0].arguments;
  assert.ok(values.sepay_secret.startsWith("enc:v1:"));
  assert.equal(options.where.sepay_secret, "legacy-admin-secret-1234567890");
});
