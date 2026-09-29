import crypto from "node:crypto";
import dns from "node:dns/promises";
import fs from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import path from "node:path";

import { env } from "../../config/env.js";

const MAX_IMAGE_BYTES = 50 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const REQUEST_TIMEOUT_MS = 8_000;
const uploadDir = path.resolve(env.uploadDir);
const extensionByMime = Object.freeze({
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
});

export class RemoteImageError extends Error {
  constructor(message, code = "INVALID_REMOTE_IMAGE", status = 400) {
    super(message);
    this.name = "RemoteImageError";
    this.code = code;
    this.status = status;
  }
}

function isPrivateIpv4(address) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b, c] = parts;
  return a === 0
    || a === 10
    || a === 127
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 0 && c === 0)
    || (a === 192 && b === 0 && c === 2)
    || (a === 192 && b === 168)
    || (a === 198 && (b === 18 || b === 19))
    || (a === 198 && b === 51 && c === 100)
    || (a === 203 && b === 0 && c === 113)
    || a >= 224;
}

export function isPrivateNetworkAddress(address) {
  const family = net.isIP(address);
  if (family === 4) return isPrivateIpv4(address);
  if (family !== 6) return true;

  const normalized = address.toLowerCase().split("%")[0];
  if (normalized.startsWith("::ffff:")) {
    const mapped = normalized.slice(7);
    return net.isIP(mapped) === 4 ? isPrivateIpv4(mapped) : true;
  }

  return normalized === "::"
    || normalized === "::1"
    || normalized.startsWith("fc")
    || normalized.startsWith("fd")
    || /^fe[89ab]/u.test(normalized)
    || normalized.startsWith("ff")
    || normalized.startsWith("2001:db8:");
}

function matchesImageSignature(buffer, mimeType) {
  if (mimeType === "image/jpeg") return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === "image/png") return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"));
  if (mimeType === "image/gif") return buffer.length >= 6 && /^GIF8[79]a$/u.test(buffer.subarray(0, 6).toString("ascii"));
  if (mimeType === "image/webp") return buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  return false;
}

function parseRemoteUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw new RemoteImageError("URL ảnh không hợp lệ"); }
  if (!["http:", "https:"].includes(url.protocol)) throw new RemoteImageError("URL ảnh chỉ hỗ trợ HTTP hoặc HTTPS");
  if (url.username || url.password) throw new RemoteImageError("URL ảnh không được chứa thông tin đăng nhập");
  if (!url.hostname || url.hostname.toLowerCase() === "localhost") throw new RemoteImageError("Không được tải ảnh từ máy chủ nội bộ", "REMOTE_IMAGE_PRIVATE_HOST");
  return url;
}

async function resolvePublicAddress(hostname) {
  const addresses = await dns.lookup(hostname, { all: true, verbatim: true }).catch(() => []);
  if (addresses.length === 0) throw new RemoteImageError("Không tìm thấy máy chủ chứa ảnh", "REMOTE_IMAGE_DNS_FAILED", 422);
  if (addresses.some(({ address }) => isPrivateNetworkAddress(address))) {
    throw new RemoteImageError("Không được tải ảnh từ mạng nội bộ", "REMOTE_IMAGE_PRIVATE_HOST");
  }
  return addresses[0];
}

function downloadOnce(url, resolvedAddress) {
  return new Promise((resolve, reject) => {
    const transport = url.protocol === "https:" ? https : http;
    const request = transport.get(url, {
      headers: {
        Accept: "image/jpeg,image/png,image/webp,image/gif",
        "Accept-Encoding": "identity",
        "User-Agent": "ShopLienQuan-ImageImporter/1.0",
      },
      lookup(hostname, options, callback) {
        if (options?.all) callback(null, [resolvedAddress]);
        else callback(null, resolvedAddress.address, resolvedAddress.family);
      },
    }, (response) => {
      const status = Number(response.statusCode || 0);
      if (status >= 300 && status < 400 && response.headers.location) {
        response.resume();
        resolve({ redirect: new URL(response.headers.location, url) });
        return;
      }
      if (status < 200 || status >= 300) {
        response.resume();
        reject(new RemoteImageError(`Máy chủ ảnh phản hồi HTTP ${status}`, "REMOTE_IMAGE_HTTP_ERROR", 422));
        return;
      }

      const mimeType = String(response.headers["content-type"] || "").split(";", 1)[0].trim().toLowerCase();
      if (!extensionByMime[mimeType]) {
        response.resume();
        reject(new RemoteImageError("URL không trả về định dạng ảnh được hỗ trợ", "REMOTE_IMAGE_UNSUPPORTED_TYPE", 422));
        return;
      }
      const declaredLength = Number(response.headers["content-length"] || 0);
      if (declaredLength > MAX_IMAGE_BYTES) {
        response.resume();
        reject(new RemoteImageError("Ảnh vượt quá giới hạn 50 MB", "REMOTE_IMAGE_TOO_LARGE", 413));
        return;
      }

      const chunks = [];
      let total = 0;
      response.on("data", (chunk) => {
        total += chunk.length;
        if (total > MAX_IMAGE_BYTES) {
          response.destroy(new RemoteImageError("Ảnh vượt quá giới hạn 50 MB", "REMOTE_IMAGE_TOO_LARGE", 413));
          return;
        }
        chunks.push(chunk);
      });
      response.on("end", () => resolve({ buffer: Buffer.concat(chunks), mimeType }));
      response.on("error", reject);
    });

    request.setTimeout(REQUEST_TIMEOUT_MS, () => request.destroy(new RemoteImageError("Tải ảnh quá thời gian cho phép", "REMOTE_IMAGE_TIMEOUT", 504)));
    request.on("error", reject);
  });
}

export async function importRemoteImage(sourceUrl) {
  let url = parseRemoteUrl(sourceUrl);
  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const address = await resolvePublicAddress(url.hostname);
    const result = await downloadOnce(url, address);
    if (result.redirect) {
      if (redirectCount === MAX_REDIRECTS) throw new RemoteImageError("URL ảnh chuyển hướng quá nhiều lần", "REMOTE_IMAGE_REDIRECT_LIMIT", 422);
      url = parseRemoteUrl(result.redirect.href);
      continue;
    }
    if (!matchesImageSignature(result.buffer, result.mimeType)) throw new RemoteImageError("Nội dung URL không phải ảnh hợp lệ", "INVALID_REMOTE_IMAGE", 422);

    await fs.mkdir(uploadDir, { recursive: true });
    const filename = `${Date.now()}-${crypto.randomBytes(12).toString("hex")}${extensionByMime[result.mimeType]}`;
    await fs.writeFile(path.join(uploadDir, filename), result.buffer, { flag: "wx" });
    return { filename, url: `/uploads/${filename}` };
  }
  throw new RemoteImageError("Không thể tải ảnh từ URL", "REMOTE_IMAGE_FAILED", 422);
}
