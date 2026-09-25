import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

export const PaymentIntent = sequelize.define("PaymentIntent", {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  bank_id: { type: DataTypes.INTEGER, allowNull: true },
  code: { type: DataTypes.STRING(32), allowNull: false, unique: true },
  amount: { type: DataTypes.BIGINT, allowNull: false },
  status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "pending" },
  expires_at: { type: DataTypes.DATE, allowNull: false },
  paid_at: { type: DataTypes.DATE, allowNull: true },
  sepay_transaction_id: { type: DataTypes.STRING(100), allowNull: true, unique: true },
}, {
  tableName: "payment_intents",
  createdAt: "created_at",
  updatedAt: "updated_at",
  underscored: true,
});
