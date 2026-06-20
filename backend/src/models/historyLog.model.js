import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const HistoryLog = sequelize.define(
  "HistoryLog",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    noidung: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },

    ip: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
  },
  {
    tableName: "history_log",
    createdAt: "created_at",
    updatedAt: false,
  },
);
