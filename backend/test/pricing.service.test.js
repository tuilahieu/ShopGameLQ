import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateDiscountAmount,
  parsePercentage,
  parsePositiveId,
  validateSalePrice,
} from "../src/services/pricing.service.js";

test("checkout prices must stay positive safe integers", () => {
  assert.equal(validateSalePrice(100_000, 80_000), 80_000);
  assert.throws(() => validateSalePrice(100_000, 0));
  assert.throws(() => validateSalePrice(100_000, 100_001));
});

test("discount rules cannot produce a free or negative order", () => {
  assert.equal(calculateDiscountAmount(100_000, { theo: "phantram", giamgia: 10 }), 10_000);
  assert.equal(calculateDiscountAmount(100_000, { theo: "tienmat", giamgia: 25_000 }), 25_000);
  assert.throws(() => calculateDiscountAmount(100_000, { theo: "phantram", giamgia: 100 }));
  assert.throws(() => calculateDiscountAmount(100_000, { theo: "tienmat", giamgia: 100_000 }));
  assert.throws(() => calculateDiscountAmount(50, { theo: "phantram", giamgia: 1 }));
});

test("IDs and commission rates reject coercion and invalid ranges", () => {
  assert.equal(parsePositiveId("42"), 42);
  assert.throws(() => parsePositiveId("-1"));
  assert.throws(() => parsePositiveId("1.1"));
  assert.throws(() => parsePositiveId(true));
  assert.equal(parsePercentage("25", "Hoa hồng"), 25);
  assert.throws(() => parsePercentage("25.5", "Hoa hồng"));
  assert.throws(() => parsePercentage(101, "Hoa hồng"));
  assert.throws(() => parsePercentage(false, "Hoa hồng"));
});
