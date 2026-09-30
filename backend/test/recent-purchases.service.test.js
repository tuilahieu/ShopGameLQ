import test from "node:test";
import assert from "node:assert/strict";

import { buildRecentPurchases, maskPublicUsername } from "../src/modules/storefront/recentPurchases.service.js";

test("public purchase usernames are masked at the server boundary", () => {
  assert.equal(maskPublicUsername("admin123"), "ad*****23");
  assert.equal(maskPublicUsername("ab"), "a*****b");
  assert.equal(maskPublicUsername(""), "kh*****ch");
});

test("real completed purchases take priority over simulated activity", () => {
  const result = buildRecentPurchases({
    orders: [{
      id: 12,
      final_price: 125000,
      created_at: "2026-09-30T00:00:00.000Z",
      user: { username: "customer99" },
      account: { accountType: { name: "ACC VIP", category: { name: "Liên Quân" } } },
    }],
    categories: [{ id: 1, name: "Liên Quân", status: 1 }],
    accountTypes: [{ id: 2, danhmuc_id: 1, name: "ACC GIÁ RẺ", status: 1 }],
    random: () => 0,
  });

  assert.equal(result.simulated, false);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].masked_user, "cu*****99");
  assert.equal(result.items[0].account_type_name, "ACC VIP");
  assert.equal(result.items[0].category_name, "Liên Quân");
  assert.equal("username" in result.items[0], false);
});

test("fallback activity uses active storefront account types and inventory prices", () => {
  const result = buildRecentPurchases({
    orders: [],
    categories: [{ id: 1, name: "Liên Quân", status: 1 }],
    accountTypes: [{ id: 2, danhmuc_id: 1, name: "ACC GIÁ RẺ", status: 1 }],
    accounts: [{ id: 8, loai_id: 2, final_price: 88000 }],
    now: new Date("2026-09-30T01:00:00.000Z"),
    random: () => 0,
    fallbackCount: 2,
  });

  assert.equal(result.simulated, true);
  assert.equal(result.items.length, 2);
  assert.ok(result.items.every((item) => item.account_type_name === "ACC GIÁ RẺ"));
  assert.ok(result.items.every((item) => item.category_name === "Liên Quân"));
  assert.ok(result.items.every((item) => item.price === 88000));
});
