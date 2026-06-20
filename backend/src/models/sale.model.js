import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Sale = sequelize.define(
  "Sale",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    acc_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    sale_price: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    batdau: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    ketthuc: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    tableName: "sale",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
