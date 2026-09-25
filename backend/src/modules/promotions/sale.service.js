import { Op } from "sequelize";

/**
 * One source of truth for what "active sale" means. Display, voucher preview
 * and the locked checkout transaction must all use the same time predicate.
 */
export function buildActiveSaleWhere({ now = new Date(), accountId, accountIds } = {}) {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new TypeError("now must be a valid Date");
  }

  const where = {
    status: 1,
    batdau: { [Op.lte]: now },
    ketthuc: { [Op.gte]: now },
  };

  if (accountId !== undefined) where.acc_id = accountId;
  if (accountIds !== undefined) where.acc_id = { [Op.in]: accountIds };

  return where;
}

