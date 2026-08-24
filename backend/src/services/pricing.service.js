import { parseMoney, requirePositiveMoney } from "../utils/money.util.js";

function validationError(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

export function parsePositiveId(value, fieldName = "ID") {
  if (typeof value !== "string" && typeof value !== "number") {
    throw validationError(`${fieldName} không hợp lệ`);
  }
  if (typeof value === "string" && !/^\d+$/.test(value.trim())) {
    throw validationError(`${fieldName} không hợp lệ`);
  }
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) throw validationError(`${fieldName} không hợp lệ`);
  return id;
}

export function parseDate(value, fieldName) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) throw validationError(`${fieldName} không hợp lệ`);
  return date;
}

export function parsePercentage(value, fieldName = "Tỷ lệ", { min = 0, max = 100 } = {}) {
  if (typeof value !== "string" && typeof value !== "number") {
    throw validationError(`${fieldName} phải là số nguyên từ ${min} đến ${max}`);
  }
  const number = typeof value === "string" && value.trim() === "" ? NaN : Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) {
    throw validationError(`${fieldName} phải là số nguyên từ ${min} đến ${max}`);
  }
  return number;
}

export function validateSalePrice(listPrice, candidatePrice, { status = 400 } = {}) {
  const base = requirePositiveMoney(listPrice);
  const sale = requirePositiveMoney(candidatePrice);
  if (!base || !sale || sale > base) {
    throw validationError("Giá sale phải lớn hơn 0 và không vượt giá niêm yết", status);
  }
  return sale;
}

/**
 * A listing sale is configured directly on one account when it is created or
 * edited. Unlike a Flash Sale it has no campaign window, therefore a value
 * equal to the normal price is meaningless and rejected at write time.
 */
export function validateListingSalePrice(listPrice, candidatePrice, { status = 400 } = {}) {
  if (candidatePrice === undefined || candidatePrice === null || candidatePrice === "") return null;
  const list = requirePositiveMoney(listPrice);
  const sale = validateSalePrice(list, candidatePrice, { status });
  if (sale >= list) {
    throw validationError("Giá sale phải thấp hơn giá bán gốc", status);
  }
  return sale;
}

function readDiscountedPrice(listPrice, value) {
  if (value === undefined || value === null || value === "") return null;
  const candidate = Number(value);
  return Number.isSafeInteger(candidate) && candidate > 0 && candidate < listPrice
    ? candidate
    : null;
}

/**
 * One account can have a permanent listing sale and temporarily join a Flash
 * Sale campaign. The customer always receives the lower valid price; a Flash
 * Sale never makes an existing listing discount worse.
 */
export function resolveAccountPricing(account, flashSale = null, { status = 409 } = {}) {
  const originalPrice = validateSalePrice(account?.gia, account?.gia, { status });
  const candidates = [];
  const listingSalePrice = readDiscountedPrice(originalPrice, account?.sale_price);
  const flashSalePrice = readDiscountedPrice(originalPrice, flashSale?.sale_price);

  if (listingSalePrice !== null) candidates.push({ price: listingSalePrice, source: "listing", saleId: null });
  if (flashSalePrice !== null) candidates.push({ price: flashSalePrice, source: "flash", saleId: flashSale?.id ?? null });
  candidates.sort((a, b) => a.price - b.price);

  const effectiveSale = candidates[0] || null;
  return {
    originalPrice,
    salePrice: effectiveSale?.price ?? null,
    finalPrice: effectiveSale?.price ?? originalPrice,
    isSale: Boolean(effectiveSale),
    saleSource: effectiveSale?.source ?? null,
    saleId: effectiveSale?.saleId ?? null,
    hasFlashSale: flashSalePrice !== null,
  };
}

/**
 * The checkout path is deliberately stricter than the database schema. A shop
 * listing can never turn into a zero/negative-value order through a malformed
 * promotion. If free products are needed later, they should have a separate,
 * explicitly-audited fulfillment flow rather than bypassing the wallet.
 */
export function calculateDiscountAmount(price, discount, { status = 400 } = {}) {
  const validPrice = requirePositiveMoney(price);
  if (!validPrice) throw validationError("Giá tài khoản không hợp lệ", status);

  if (!discount || !["phantram", "tienmat"].includes(discount.theo)) {
    throw validationError("Cấu hình mã giảm giá không hợp lệ", status);
  }

  let amount;
  if (discount.theo === "phantram") {
    const rate = parsePercentage(discount.giamgia, "Phần trăm giảm", { min: 1, max: 99 });
    amount = Math.floor((validPrice * rate) / 100);
  } else {
    amount = requirePositiveMoney(discount.giamgia);
    if (!amount) throw validationError("Giá trị giảm không hợp lệ", status);
  }

  if (!Number.isSafeInteger(amount) || amount <= 0 || amount >= validPrice) {
    throw validationError("Mã giảm giá phải để lại số tiền thanh toán lớn hơn 0", status);
  }
  return amount;
}

export function normalizeDiscountCode(value) {
  if (typeof value !== "string") throw validationError("Mã giảm giá không hợp lệ");
  const code = value.trim();
  if (!/^[A-Za-z0-9_-]{3,64}$/.test(code)) {
    throw validationError("Mã giảm giá chỉ gồm chữ, số, '_' hoặc '-' (3-64 ký tự)");
  }
  return code;
}

export function validateDiscountDefinition({ magiamgia, giamgia, theo, batdau, ketthuc, soluong, status }, { partial = false } = {}) {
  const output = {};
  if (!partial || magiamgia !== undefined) output.magiamgia = normalizeDiscountCode(magiamgia);
  if (!partial || theo !== undefined) {
    if (!["phantram", "tienmat"].includes(theo)) throw validationError("Loại giảm giá không hợp lệ");
    output.theo = theo;
  }
  if (!partial || giamgia !== undefined) {
    const mode = output.theo ?? theo;
    if (mode === "phantram") output.giamgia = parsePercentage(giamgia, "Phần trăm giảm", { min: 1, max: 99 });
    else {
      output.giamgia = requirePositiveMoney(giamgia);
      if (!output.giamgia) throw validationError("Giá trị giảm không hợp lệ");
    }
  }
  if (!partial || soluong !== undefined) {
    const quantity = parsePositiveId(soluong, "Số lượng");
    output.soluong = quantity;
  }
  if (!partial || status !== undefined) {
    if (![0, 1, "0", "1", false, true].includes(status)) throw validationError("Trạng thái không hợp lệ");
    output.status = Number(status) === 1 || status === true ? 1 : 0;
  }
  if (!partial || batdau !== undefined) output.batdau = batdau == null || batdau === "" ? null : parseDate(batdau, "Thời gian bắt đầu");
  if (!partial || ketthuc !== undefined) output.ketthuc = ketthuc == null || ketthuc === "" ? null : parseDate(ketthuc, "Thời gian kết thúc");
  if (output.batdau && output.ketthuc && output.ketthuc <= output.batdau) {
    throw validationError("Thời gian kết thúc phải sau thời gian bắt đầu");
  }
  return output;
}

export function ensureDiscountIsAvailable(discount, now = new Date()) {
  if (discount.batdau && now < new Date(discount.batdau)) throw validationError("Mã giảm giá chưa có hiệu lực");
  if (discount.ketthuc && now > new Date(discount.ketthuc)) throw validationError("Mã giảm giá đã hết hạn");
  if (!Number.isSafeInteger(Number(discount.soluong)) || Number(discount.soluong) <= 0) {
    throw validationError("Mã giảm giá đã hết lượt sử dụng");
  }
}

export function parseSafeBalance(value) {
  const balance = parseMoney(value);
  if (balance === null) throw validationError("Số dư không hợp lệ", 409);
  return balance;
}
