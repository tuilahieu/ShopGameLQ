import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Order = sequelize.define(
  "Order",
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

    acc_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    original_price: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    sale_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    sale_price: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },

    discount_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    discount_amount: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },

    final_price: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    tableName: "orders",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
