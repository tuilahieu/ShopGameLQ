import { Transaction, User } from "../models/index.js";
import { requirePositiveMoney } from "../utils/money.util.js";

const TRANSACTION_DIRECTIONS = Object.freeze({
  deposit: 1,
  buy_acc: -1,
  refund: 1,
  admin_add: 1,
  admin_sub: -1,
  ctv_earn: 1,
});

/**
 * Applies a wallet mutation to a row already locked in the caller's DB transaction.
 * Transaction history and balance are deliberately written together, never separately.
 */
export async function applyWalletMutation({ user, amount, direction, type, description, referenceId = null, transaction }) {
  const safeAmount = requirePositiveMoney(amount);
  if (!safeAmount) throw Object.assign(new Error("Số tiền không hợp lệ"), { status: 400 });
  if (TRANSACTION_DIRECTIONS[type] !== direction) {
    throw Object.assign(new Error("Hướng biến động số dư không hợp lệ"), { status: 500 });
  }

  const balanceBefore = Number(user.money);
  const balanceAfter = balanceBefore + direction * safeAmount;
  if (!Number.isSafeInteger(balanceBefore) || balanceBefore < 0 || !Number.isSafeInteger(balanceAfter) || balanceAfter < 0) {
    throw Object.assign(new Error("Số dư không hợp lệ"), { status: 409 });
  }

  // The caller holds a SELECT ... FOR UPDATE lock. This compare-and-swap is a
  // second database-level guard: even if a future caller forgets the lock, a
  // stale balance can never overwrite a newer one or make a debit go negative.
  const [updatedRows] = await User.update(
    { money: balanceAfter },
    { where: { id: user.id, money: balanceBefore }, transaction },
  );
  if (updatedRows !== 1) {
    throw Object.assign(new Error("Số dư vừa thay đổi, vui lòng thử lại"), { status: 409 });
  }
  user.setDataValue("money", balanceAfter);
  await Transaction.create({
    user_id: user.id,
    type,
    amount: direction * safeAmount,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    reference_id: referenceId,
    description,
  }, { transaction });
  return { balanceBefore, balanceAfter };
}
