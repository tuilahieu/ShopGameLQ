import crypto from "node:crypto";
import { IdempotencyKey } from "../../database/models.js";

export function getIdempotencyInput(req, { required = false } = {}) {
  const key = req.get("Idempotency-Key");
  if (!key) {
    if (required) throw Object.assign(new Error("Thiếu Idempotency-Key; vui lòng thử lại từ ứng dụng"), { status: 400 });
    return null;
  }
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(key)) {
    throw Object.assign(new Error("Idempotency-Key phải có 16-128 ký tự chữ, số, '_' hoặc '-'"), { status: 400 });
  }
  return {
    key,
    requestHash: crypto.createHash("sha256").update(JSON.stringify(req.body || {})).digest("hex"),
  };
}

export async function reserveIdempotencyKey({ scope, input, transaction }) {
  if (!input) return null;
  const existing = await IdempotencyKey.findOne({ where: { scope, key: input.key }, transaction, lock: transaction.LOCK.UPDATE });
  if (existing) {
    if (existing.request_hash !== input.requestHash) throw Object.assign(new Error("Idempotency-Key đã được dùng cho một yêu cầu khác"), { status: 409 });
    if (existing.status === "completed") return { replay: existing };
    throw Object.assign(new Error("Yêu cầu có cùng Idempotency-Key đang được xử lý"), { status: 409 });
  }
  return IdempotencyKey.create({ scope, key: input.key, request_hash: input.requestHash }, { transaction });
}

export async function completeIdempotencyKey(record, { status, body, transaction }) {
  if (!record || record.replay) return;
  await record.update({ status: "completed", response_status: status, response_body: body }, { transaction });
}
