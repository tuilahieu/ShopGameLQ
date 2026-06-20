import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Category = sequelize.define(
  "Category",
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

    noidung: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },

    type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    tableName: "danh_muc_tai_khoan",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
