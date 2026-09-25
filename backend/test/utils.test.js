import test from "node:test";
import assert from "node:assert/strict";
import { parsePagination } from "../src/shared/utils/pagination.util.js";
import { parseMoney, requirePositiveMoney } from "../src/shared/utils/money.util.js";

test("parsePagination clamps untrusted values", () => {
  assert.deepEqual(parsePagination({ page: "-2", limit: "100000" }), { page: 1, limit: 100, offset: 0 });
  assert.deepEqual(parsePagination({ page: "3", limit: "10" }), { page: 3, limit: 10, offset: 20 });
});

test("money input only accepts safe non-negative integers", () => {
  assert.equal(parseMoney("100000"), 100000);
  assert.equal(parseMoney("100.5"), null);
  assert.equal(parseMoney(-1), null);
  assert.equal(parseMoney(true), null);
  assert.equal(parseMoney(null), null);
  assert.equal(parseMoney(Number.MAX_SAFE_INTEGER + 1), null);
  assert.equal(requirePositiveMoney(0), null);
});
