import { User } from "../modules/users/user.model.js";
import { Category } from "../modules/catalog/category.model.js";
import { AccountType } from "../modules/catalog/accountType.model.js";
import { GameAccount } from "../modules/catalog/gameAccount.model.js";
import { Order } from "../modules/orders/order.model.js";
import { Transaction } from "../modules/wallet/transaction.model.js";
import { Sale } from "../modules/promotions/sale.model.js";
import { Discount } from "../modules/promotions/discount.model.js";
import { Setting } from "../modules/settings/setting.model.js";
import { HistoryLog } from "../modules/users/historyLog.model.js";
import { Bank } from "../modules/payments/bank.model.js";
import { IdempotencyKey } from "../modules/orders/idempotencyKey.model.js";
import { PaymentIntent } from "../modules/payments/paymentIntent.model.js";
import { PaymentEvent } from "../modules/payments/paymentEvent.model.js";
import { AssistantThread } from "../modules/assistant/assistantThread.model.js";
import { AssistantMessage } from "../modules/assistant/assistantMessage.model.js";

/**
 * Category -> AccountType
 */
Category.hasMany(AccountType, {
  foreignKey: "danhmuc_id",
  as: "accountTypes",
});

AccountType.belongsTo(Category, {
  foreignKey: "danhmuc_id",
  as: "category",
});

/**
 * AccountType -> GameAccount
 */
AccountType.hasMany(GameAccount, {
  foreignKey: "loai_id",
  as: "accounts",
});

GameAccount.belongsTo(AccountType, {
  foreignKey: "loai_id",
  as: "accountType",
});

/**
 * Seller -> GameAccount
 */
User.hasMany(GameAccount, {
  foreignKey: "seller_id",
  as: "sellingAccounts",
});

GameAccount.belongsTo(User, {
  foreignKey: "seller_id",
  as: "seller",
});

/**
 * Buyer -> GameAccount
 */
User.hasMany(GameAccount, {
  foreignKey: "buyer_id",
  as: "purchasedAccounts",
});

GameAccount.belongsTo(User, {
  foreignKey: "buyer_id",
  as: "buyer",
});

/**
 * User -> Orders
 */
User.hasMany(Order, {
  foreignKey: "user_id",
  as: "orders",
});

Order.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

/**
 * GameAccount -> Order (an inventory account can be sold exactly once)
 */
GameAccount.hasOne(Order, {
  foreignKey: "acc_id",
  as: "order",
});

Order.belongsTo(GameAccount, {
  foreignKey: "acc_id",
  as: "account",
});

/**
 * User -> Transactions
 */
User.hasMany(Transaction, {
  foreignKey: "user_id",
  as: "transactions",
});

Transaction.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

/**
 * Sale -> GameAccount
 */
Sale.belongsTo(GameAccount, {
  foreignKey: "acc_id",
  as: "account",
});

GameAccount.hasMany(Sale, {
  foreignKey: "acc_id",
  as: "sales",
});

/**
 * Sale -> Orders
 */
Sale.hasMany(Order, {
  foreignKey: "sale_id",
  as: "orders",
});

Order.belongsTo(Sale, {
  foreignKey: "sale_id",
  as: "sale",
});

/**
 * Discount -> Orders
 */
Discount.hasMany(Order, {
  foreignKey: "discount_id",
  as: "orders",
});

Order.belongsTo(Discount, {
  foreignKey: "discount_id",
  as: "discount",
});

/**
 * User -> HistoryLog
 */
User.hasMany(HistoryLog, {
  foreignKey: "user_id",
  as: "logs",
});

HistoryLog.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

User.hasMany(PaymentIntent, { foreignKey: "user_id", as: "paymentIntents" });
PaymentIntent.belongsTo(User, { foreignKey: "user_id", as: "user" });
Bank.hasMany(PaymentIntent, { foreignKey: "bank_id", as: "paymentIntents" });
PaymentIntent.belongsTo(Bank, { foreignKey: "bank_id", as: "bank" });
PaymentIntent.hasMany(PaymentEvent, { foreignKey: "payment_intent_id", as: "events" });
PaymentEvent.belongsTo(PaymentIntent, { foreignKey: "payment_intent_id", as: "paymentIntent" });
User.hasMany(PaymentEvent, { foreignKey: "user_id", as: "paymentEvents" });
PaymentEvent.belongsTo(User, { foreignKey: "user_id", as: "user" });
AssistantThread.hasMany(AssistantMessage, { foreignKey: "thread_id", as: "messages" });
AssistantMessage.belongsTo(AssistantThread, { foreignKey: "thread_id", as: "thread" });

export {
  User,
  Category,
  AccountType,
  GameAccount,
  Order,
  Transaction,
  Sale,
  Discount,
  Setting,
  HistoryLog,
  Bank,
  IdempotencyKey,
  PaymentIntent,
  PaymentEvent,
  AssistantThread,
  AssistantMessage,
};
