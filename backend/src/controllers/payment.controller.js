import crypto from "node:crypto";

import { sequelize } from "../config/database.js";
import { Bank, PaymentEvent, PaymentIntent, User } from "../models/index.js";
import { applyWalletMutation } from "../services/wallet.service.js";
import { getSePayConfig } from "../services/sepay-config.service.js";
import { writeLog } from "../utils/log.util.js";
import { parseMoney, requirePositiveMoney } from "../utils/money.util.js";
import { errorResponse, successResponse } from "../utils/response.util.js";
import { verifySePaySignature } from "../utils/sepay.util.js";

const MINIMUM_TOPUP = 10_000;
const WEBHOOK_MAX_AGE_SECONDS = 5 * 60;

function createTransferCode(config) {
  // Upper-case alphanumeric avoids ambiguity in banking-app transfer content.
  return `${config.paymentPrefix}${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
}

function serializeBank(bank) {
  return {
    id: bank.id,
    name: bank.name,
    account_no: bank.account_no,
    account_name: bank.account_name,
    bank_id: bank.bank_id,
  };
}

function buildQrUrl(bank, amount, code) {
  const bankId = String(bank.bank_id || "").trim().toUpperCase();
  if (!/^[A-Z0-9]+$/.test(bankId) || !bank.account_no) return null;
  const query = new URLSearchParams({
    amount: String(amount),
    addInfo: code,
    accountName: bank.account_name || "",
  });
  return `https://img.vietqr.io/image/${bankId}-${encodeURIComponent(bank.account_no)}-compact2.png?${query.toString()}`;
}

function serializeIntent(intent, bank = null) {
  return {
    id: String(intent.id),
    code: intent.code,
    amount: Number(intent.amount),
    status: intent.status,
    expires_at: intent.expires_at,
    paid_at: intent.paid_at,
    bank: bank ? serializeBank(bank) : null,
    qr_url: bank ? buildQrUrl(bank, intent.amount, intent.code) : null,
  };
}

function markExpired(intent) {
  return intent.status === "pending" && new Date(intent.expires_at).getTime() <= Date.now();
}

export async function createPaymentIntent(req, res) {
  try {
    const sepay = await getSePayConfig();
    if (!sepay.enabled) {
      return errorResponse(res, "Cổng nạp tự động chưa được cấu hình", 503, "PAYMENT_NOT_CONFIGURED", req);
    }

    const amount = requirePositiveMoney(req.body?.amount);
    const bankId = Number.parseInt(req.body?.bank_id, 10);
    if (!amount || amount < MINIMUM_TOPUP) {
      return errorResponse(res, `Số tiền nạp tối thiểu là ${MINIMUM_TOPUP.toLocaleString("vi-VN")}đ`, 400, "INVALID_AMOUNT", req);
    }
    if (!Number.isSafeInteger(bankId) || bankId < 1) {
      return errorResponse(res, "Vui lòng chọn tài khoản nhận tiền", 400, "INVALID_BANK", req);
    }

    const bank = await Bank.findOne({ where: { id: bankId, status: 1 } });
    if (!bank) return errorResponse(res, "Tài khoản nhận tiền không còn hoạt động", 404, "BANK_NOT_FOUND", req);

    const expiresAt = new Date(Date.now() + sepay.intentTtlMinutes * 60_000);
    let intent;
    // The database unique index remains the final guard even though collisions
    // from 64 random bits are practically impossible.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        intent = await PaymentIntent.create({
          user_id: req.user.id,
          bank_id: bank.id,
          code: createTransferCode(sepay),
          amount,
          status: "pending",
          expires_at: expiresAt,
        });
        break;
      } catch (error) {
        if (error.name !== "SequelizeUniqueConstraintError" || attempt === 2) throw error;
      }
    }

    return successResponse(res, "Đã tạo mã nạp tiền. Vui lòng chuyển đúng số tiền và nội dung.", serializeIntent(intent, bank), 201);
  } catch (error) {
    console.error("CREATE PAYMENT INTENT ERROR:", error);
    return errorResponse(res, "Không thể tạo mã nạp tiền, vui lòng thử lại", 500, "PAYMENT_INTENT_FAILED", req);
  }
}

export async function getPaymentIntent(req, res) {
  try {
    const id = String(req.params.id || "").trim();
    if (!/^\d+$/.test(id)) return errorResponse(res, "Mã yêu cầu không hợp lệ", 400, "INVALID_INTENT", req);

    const intent = await PaymentIntent.findOne({
      where: { id, user_id: req.user.id },
      include: [{ model: Bank, as: "bank" }],
    });
    if (!intent) return errorResponse(res, "Không tìm thấy yêu cầu nạp tiền", 404, "INTENT_NOT_FOUND", req);

    if (markExpired(intent)) {
      await intent.update({ status: "expired" });
    }
    return successResponse(res, "Lấy trạng thái nạp tiền thành công", serializeIntent(intent, intent.bank));
  } catch (error) {
    console.error("GET PAYMENT INTENT ERROR:", error);
    return errorResponse(res, "Không thể lấy trạng thái nạp tiền", 500, "PAYMENT_STATUS_FAILED", req);
  }
}

function hasValidSignature(req, secret) {
  return verifySePaySignature({
    rawBody: req.body,
    signature: req.get("x-sepay-signature"),
    timestamp: req.get("x-sepay-timestamp"),
    secret,
    maxAgeSeconds: WEBHOOK_MAX_AGE_SECONDS,
  });
}

function webhookPayload(payload) {
  const eventId = payload?.id;
  const code = typeof payload?.code === "string" ? payload.code.trim().toUpperCase() : "";
  const amount = requirePositiveMoney(payload?.transferAmount);
  const transferType = typeof payload?.transferType === "string" ? payload.transferType.trim().toLowerCase() : "";
  if ((typeof eventId !== "string" && typeof eventId !== "number") || !/^\d{1,100}$/.test(String(eventId).trim())) {
    return null;
  }
  return { eventId: String(eventId), code, amount, transferType };
}

async function createIgnoredEvent({ details, payload, status, reason, transaction, intent = null }) {
  await PaymentEvent.create({
    provider: "sepay",
    provider_event_id: details.eventId,
    payment_intent_id: intent?.id || null,
    user_id: intent?.user_id || null,
    amount: details.amount || null,
    status,
    failure_reason: reason,
    payload,
    received_at: new Date(),
    processed_at: new Date(),
  }, { transaction });
}

export async function sepayWebhook(req, res) {
  let sepay;
  try {
    sepay = await getSePayConfig();
  } catch (error) {
    console.error("SEPAY CONFIG ERROR:", error);
    return errorResponse(res, "Không thể xử lý webhook", 500, "WEBHOOK_PROCESSING_FAILED", req);
  }
  if (!sepay.enabled || !hasValidSignature(req, sepay.webhookSecret)) {
    // Never reveal whether a key or a payment code was valid.
    return errorResponse(res, "Webhook không hợp lệ", 401, "INVALID_WEBHOOK", req);
  }

  let payload;
  try {
    payload = JSON.parse(req.body.toString("utf8"));
  } catch {
    return errorResponse(res, "Payload webhook không hợp lệ", 400, "INVALID_WEBHOOK_PAYLOAD", req);
  }
  const details = webhookPayload(payload);
  if (!details) return errorResponse(res, "Payload webhook không hợp lệ", 400, "INVALID_WEBHOOK_PAYLOAD", req);

  let dbTransaction;
  try {
    dbTransaction = await sequelize.transaction();
    const existing = await PaymentEvent.findOne({
      where: { provider: "sepay", provider_event_id: details.eventId },
      transaction: dbTransaction,
      lock: true,
    });
    if (existing) {
      await dbTransaction.commit();
      return successResponse(res, "Webhook đã được xử lý", { duplicate: true });
    }

    if (details.transferType !== "in") {
      await createIgnoredEvent({ details, payload, status: "ignored", reason: "not_incoming_transfer", transaction: dbTransaction });
      await dbTransaction.commit();
      return successResponse(res, "Đã bỏ qua giao dịch không phải tiền vào");
    }

    const intent = details.code ? await PaymentIntent.findOne({
      where: { code: details.code }, transaction: dbTransaction, lock: true,
    }) : null;
    if (!intent) {
      await createIgnoredEvent({ details, payload, status: "ignored", reason: "intent_not_found", transaction: dbTransaction });
      await dbTransaction.commit();
      return successResponse(res, "Đã bỏ qua giao dịch không khớp mã nạp");
    }
    if (markExpired(intent)) {
      await intent.update({ status: "expired" }, { transaction: dbTransaction });
      await createIgnoredEvent({ details, payload, status: "rejected", reason: "intent_expired", transaction: dbTransaction, intent });
      await dbTransaction.commit();
      return successResponse(res, "Yêu cầu nạp tiền đã hết hạn");
    }
    if (intent.status !== "pending") {
      await createIgnoredEvent({ details, payload, status: "ignored", reason: `intent_${intent.status}`, transaction: dbTransaction, intent });
      await dbTransaction.commit();
      return successResponse(res, "Yêu cầu nạp tiền đã được xử lý");
    }
    if (!details.amount || Number(intent.amount) !== details.amount) {
      await createIgnoredEvent({ details, payload, status: "rejected", reason: "amount_mismatch", transaction: dbTransaction, intent });
      await dbTransaction.commit();
      return successResponse(res, "Giao dịch không đúng số tiền yêu cầu");
    }

    const user = await User.findByPk(intent.user_id, { transaction: dbTransaction, lock: true });
    if (!user) throw Object.assign(new Error("Người dùng của yêu cầu nạp không tồn tại"), { status: 500 });

    const { balanceBefore, balanceAfter } = await applyWalletMutation({
      user,
      amount: details.amount,
      direction: 1,
      type: "deposit",
      description: `Nạp tiền SePay #${details.eventId}`,
      referenceId: Number(intent.id),
      transaction: dbTransaction,
    });
    const previousTotalDeposit = parseMoney(user.tong_nap);
    const nextTotalDeposit = previousTotalDeposit === null ? null : previousTotalDeposit + details.amount;
    if (!Number.isSafeInteger(nextTotalDeposit)) throw Object.assign(new Error("Tổng tiền nạp không hợp lệ"), { status: 409 });
    await user.update({ tong_nap: nextTotalDeposit }, { transaction: dbTransaction });

    const processedAt = new Date();
    await intent.update({ status: "paid", paid_at: processedAt, sepay_transaction_id: details.eventId }, { transaction: dbTransaction });
    await PaymentEvent.create({
      provider: "sepay",
      provider_event_id: details.eventId,
      payment_intent_id: intent.id,
      user_id: user.id,
      amount: details.amount,
      status: "credited",
      payload,
      received_at: processedAt,
      processed_at: processedAt,
    }, { transaction: dbTransaction });

    await dbTransaction.commit();
    writeLog(user.id, `Nạp SePay ${details.amount}đ, mã giao dịch ${details.eventId}, số dư ${balanceBefore} → ${balanceAfter}`, req.clientIp);
    return successResponse(res, "Đã cộng tiền thành công");
  } catch (error) {
    if (dbTransaction && !dbTransaction.finished) await dbTransaction.rollback();
    // Concurrent retries can lose the unique-insert race. The winner committed
    // all wallet changes atomically, so acknowledge the duplicate safely.
    if (error.name === "SequelizeUniqueConstraintError") {
      const duplicate = await PaymentEvent.findOne({ where: { provider: "sepay", provider_event_id: details.eventId } });
      if (duplicate) return successResponse(res, "Webhook đã được xử lý", { duplicate: true });
    }
    console.error("SEPAY WEBHOOK ERROR:", error);
    return errorResponse(res, "Không thể xử lý webhook", 500, "WEBHOOK_PROCESSING_FAILED", req);
  }
}
