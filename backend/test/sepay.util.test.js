import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";

import { verifySePaySignature } from "../src/utils/sepay.util.js";

function signature(secret, timestamp, body) {
  return `sha256=${crypto.createHmac("sha256", secret).update(`${timestamp}.`).update(body).digest("hex")}`;
}

test("accepts an exact, timely SePay raw-body HMAC", () => {
  const secret = "webhook-secret";
  const timestamp = "1700000000";
  const rawBody = Buffer.from('{"id":123,"transferAmount":50000}');
  assert.equal(verifySePaySignature({
    rawBody,
    signature: signature(secret, timestamp, rawBody),
    timestamp,
    secret,
    nowSeconds: 1700000010,
  }), true);
});

test("rejects altered bodies, malformed signatures, and stale callbacks", () => {
  const secret = "webhook-secret";
  const timestamp = "1700000000";
  const rawBody = Buffer.from('{"id":123,"transferAmount":50000}');
  const validSignature = signature(secret, timestamp, rawBody);
  assert.equal(verifySePaySignature({
    rawBody: Buffer.from('{"id":123,"transferAmount":1}'),
    signature: validSignature,
    timestamp,
    secret,
    nowSeconds: 1700000010,
  }), false);
  assert.equal(verifySePaySignature({
    rawBody,
    signature: "sha256=not-a-valid-signature",
    timestamp,
    secret,
    nowSeconds: 1700000010,
  }), false);
  assert.equal(verifySePaySignature({
    rawBody,
    signature: validSignature,
    timestamp,
    secret,
    nowSeconds: 1700000400,
  }), false);
});
