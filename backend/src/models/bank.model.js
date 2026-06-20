import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Bank = sequelize.define(
  "Bank",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    account_no: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "account_no"
    },
    account_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "account_name"
    },
    bank_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "bank_id"
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
    },
    logo: {
      type: DataTypes.STRING(255),
      allowNull: true,
    }
  },
  {
    tableName: "list_bank",
    createdAt: "created_at",
    updatedAt: "updated_at",
    underscored: true
  }
);
