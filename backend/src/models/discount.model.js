import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Discount = sequelize.define(
  "Discount",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    magiamgia: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    giamgia: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    theo: {
      type: DataTypes.ENUM("phantram", "tienmat"),
      allowNull: false,
    },

    batdau: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    ketthuc: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    soluong: {
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
    tableName: "ma_giam_gia",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
