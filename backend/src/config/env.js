import crypto from "node:crypto";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const isProduction = process.env.NODE_ENV === "production";

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function asInteger(value, fallback, { min, max }) {
  const parsed = Number.parseInt(value ?? fallback, 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) return fallback;
  return parsed;
}

function parseOrigins(value) {
  return (value || (isProduction ? "" : "http://localhost:5173"))
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function parseTrustProxy(value) {
  const raw = value?.trim();
  if (!raw || raw === "false" || raw === "0") return false;

  // Kept for backward compatibility. It trusts exactly one hop, not arbitrary headers.
  if (raw === "true" || raw === "1") return 1;

  if (/^\d+$/.test(raw)) return Number.parseInt(raw, 10);

  // Express/proxy-addr accepts named ranges (e.g. loopback) and CIDRs/IPs.
  return raw.split(",").map((entry) => entry.trim()).filter(Boolean);
}

const corsOrigins = parseOrigins(process.env.CORS_ORIGINS);
if (isProduction && corsOrigins.length === 0) {
  throw new Error("Missing required environment variable: CORS_ORIGINS");
}

function credentialKey() {
  const value = process.env.ACCOUNT_CREDENTIALS_ENCRYPTION_KEY;
  if (value) {
    const key = Buffer.from(value, "base64");
    if (key.length !== 32) {
      throw new Error("ACCOUNT_CREDENTIALS_ENCRYPTION_KEY must be a base64-encoded 32-byte key");
    }
    return key;
  }

  if (isProduction) {
    throw new Error("Missing required environment variable: ACCOUNT_CREDENTIALS_ENCRYPTION_KEY");
  }

  // Prevent accidental plaintext credentials during local development. Never use this fallback in production.
  return crypto.createHash("sha256").update("shoplienquan-development-only-key").digest();
}

function captchaConfig() {
  const enabled = process.env.CAPTCHA_ENABLED === "true";
  const provider = process.env.CAPTCHA_PROVIDER || "turnstile";
  if (!enabled) return Object.freeze({ enabled: false, provider: "turnstile", secret: null });
  if (provider !== "turnstile") throw new Error("CAPTCHA_PROVIDER must be 'turnstile'");
  return Object.freeze({
    enabled: true,
    provider,
    secret: required("TURNSTILE_SECRET_KEY"),
  });
}

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction,
  port: asInteger(process.env.PORT, 3000, { min: 1, max: 65535 }),
  database: {
    host: required("DB_HOST"),
    port: asInteger(process.env.DB_PORT, 3306, { min: 1, max: 65535 }),
    name: required("DB_NAME"),
    user: required("DB_USER"),
    password: required("DB_PASSWORD"),
    ssl: process.env.DB_SSL === "true",
  },
  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET"),
    refreshSecret: required("JWT_REFRESH_SECRET"),
    accessTtl: process.env.JWT_ACCESS_TTL || "15m",
    refreshTtl: process.env.JWT_REFRESH_TTL || "30d",
  },
  corsOrigins,
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
  uploadDir: process.env.UPLOAD_DIR || "uploads",
  maxBodyBytes: process.env.MAX_BODY_BYTES || "1mb",
  captcha: captchaConfig(),
  credentialEncryptionKey: credentialKey(),
});
