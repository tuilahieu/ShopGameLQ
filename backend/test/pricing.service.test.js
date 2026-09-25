import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateDiscountAmount,
  parsePercentage,
  parsePositiveId,
  resolveAccountPricing,
  validateListingSalePrice,
  validateSalePrice,
} from "../src/modules/commerce/pricing.service.js";

test("checkout prices must stay positive safe integers", () => {
  assert.equal(validateSalePrice(100_000, 80_000), 80_000);
  assert.throws(() => validateSalePrice(100_000, 0));
  assert.throws(() => validateSalePrice(100_000, 100_001));
});

test("listing sale is stored separately and the customer gets the lowest valid price", () => {
  assert.equal(validateListingSalePrice(150_000, 100_000), 100_000);
  assert.equal(validateListingSalePrice(150_000, null), null);
  assert.throws(() => validateListingSalePrice(150_000, 150_000));

  const account = { gia: 150_000, sale_price: 100_000 };
  assert.deepEqual(resolveAccountPricing(account), {
    originalPrice: 150_000,
    salePrice: 100_000,
    finalPrice: 100_000,
    isSale: true,
    saleSource: "listing",
    saleId: null,
    hasFlashSale: false,
  });

  assert.deepEqual(resolveAccountPricing(account, { id: 5, sale_price: 90_000 }), {
    originalPrice: 150_000,
    salePrice: 90_000,
    finalPrice: 90_000,
    isSale: true,
    saleSource: "flash",
    saleId: 5,
    hasFlashSale: true,
  });
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
