import test from "node:test";
import assert from "node:assert/strict";
import { Op } from "sequelize";

import { buildActiveSaleWhere } from "../src/services/sale.service.js";

test("active sale predicate scopes account and effective time consistently", () => {
  const now = new Date("2026-08-24T12:00:00.000Z");
  const where = buildActiveSaleWhere({ now, accountId: 44 });

  assert.equal(where.status, 1);
  assert.equal(where.acc_id, 44);
  assert.equal(where.batdau[Op.lte], now);
  assert.equal(where.ketthuc[Op.gte], now);
});

test("active sale predicate supports a bounded account collection", () => {
  const now = new Date("2026-08-24T12:00:00.000Z");
  const where = buildActiveSaleWhere({ now, accountIds: [40, 44] });

  assert.deepEqual(where.acc_id[Op.in], [40, 44]);
  assert.throws(() => buildActiveSaleWhere({ now: new Date("invalid") }), TypeError);
});
