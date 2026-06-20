import { User } from "./user.model.js";
import { Category } from "./category.model.js";
import { AccountType } from "./accountType.model.js";
import { GameAccount } from "./gameAccount.model.js";
import { Order } from "./order.model.js";
import { Transaction } from "./transaction.model.js";
import { Sale } from "./sale.model.js";
import { Discount } from "./discount.model.js";
import { Setting } from "./setting.model.js";
import { HistoryLog } from "./historyLog.model.js";
import { Bank } from "./bank.model.js";

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
 * GameAccount -> Orders
 */
GameAccount.hasMany(Order, {
  foreignKey: "acc_id",
  as: "orders",
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
};
