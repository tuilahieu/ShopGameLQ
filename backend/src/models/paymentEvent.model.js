import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const PaymentEvent = sequelize.define("PaymentEvent", {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  provider: { type: DataTypes.STRING(32), allowNull: false },
  provider_event_id: { type: DataTypes.STRING(100), allowNull: false },
  payment_intent_id: { type: DataTypes.BIGINT, allowNull: true },
  user_id: { type: DataTypes.INTEGER, allowNull: true },
  amount: { type: DataTypes.BIGINT, allowNull: true },
  status: { type: DataTypes.STRING(20), allowNull: false },
  failure_reason: { type: DataTypes.STRING(255), allowNull: true },
  payload: { type: DataTypes.JSON, allowNull: false },
  received_at: { type: DataTypes.DATE, allowNull: false },
  processed_at: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: "payment_events",
  createdAt: false,
  updatedAt: false,
  underscored: true,
});
