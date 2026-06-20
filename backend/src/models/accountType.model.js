import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const AccountType = sequelize.define(
  "AccountType",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    danhmuc_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    img: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    noidung: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },

    camket: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },

    view: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    buy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    tableName: "loai_tai_khoan",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
