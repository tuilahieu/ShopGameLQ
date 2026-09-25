import crypto from "node:crypto";

export function verifySePaySignature({ rawBody, signature, timestamp, secret, nowSeconds = Math.floor(Date.now() / 1000), maxAgeSeconds = 300 }) {
  if (!Buffer.isBuffer(rawBody) || typeof secret !== "string" || !secret || typeof signature !== "string" || !/^\d+$/.test(String(timestamp))) {
    return false;
  }
  const timestampSeconds = Number(timestamp);
  if (!Number.isSafeInteger(timestampSeconds) || Math.abs(nowSeconds - timestampSeconds) > maxAgeSeconds) return false;

  const expected = `sha256=${crypto.createHmac("sha256", secret).update(`${timestamp}.`).update(rawBody).digest("hex")}`;
  const received = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return received.length === expectedBuffer.length && crypto.timingSafeEqual(received, expectedBuffer);
}
