import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Transaction = sequelize.define(
  "Transaction",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    type: {
      type: DataTypes.ENUM(
        "deposit",
        "buy_acc",
        "refund",
        "admin_add",
        "admin_sub",
        "ctv_earn",
      ),
      allowNull: false,
    },

    amount: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    balance_before: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    balance_after: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    reference_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "transactions",
    createdAt: "created_at",
    updatedAt: false,
  },
);
