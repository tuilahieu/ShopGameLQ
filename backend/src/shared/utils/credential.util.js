import crypto from "node:crypto";
import { env } from "../../config/env.js";

const PREFIX = "enc:v1:";

export function encryptCredential(value) {
  if (typeof value !== "string" || !value) throw new Error("Credential must be a non-empty string");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", env.credentialEncryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64url")}:${tag.toString("base64url")}:${encrypted.toString("base64url")}`;
}

export function decryptCredential(value) {
  if (!value?.startsWith(PREFIX)) return value; // Existing records can be migrated gradually without breaking fulfilment.
  const [, , ivRaw, tagRaw, payloadRaw] = value.split(":");
  const decipher = crypto.createDecipheriv("aes-256-gcm", env.credentialEncryptionKey, Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(payloadRaw, "base64url")), decipher.final()]).toString("utf8");
}
