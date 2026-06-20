import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },

    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    refresh_token_hash: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    refresh_token_expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    level: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },

    money: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },

    tong_nap: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },

    banned: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    ip: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
  },
  {
    tableName: "users",

    createdAt: "created_at",
    updatedAt: "updated_at",

    underscored: true,
  },
);
