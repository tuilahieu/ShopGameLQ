import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

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

    admin_second_password_hash: { type: DataTypes.STRING(255), allowNull: true },
    admin_session_hash: { type: DataTypes.STRING(64), allowNull: true },
    admin_session_expires_at: { type: DataTypes.DATE, allowNull: true },
    admin_second_attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    admin_second_locked_until: { type: DataTypes.DATE, allowNull: true },

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

// Keep credential and session material out of accidental JSON responses.
User.prototype.toJSON = function toJSON() {
  const values = { ...this.get({ plain: true }) };
  for (const field of [
    "password", "refresh_token_hash", "admin_second_password_hash",
    "admin_session_hash", "admin_session_expires_at",
    "admin_second_attempts", "admin_second_locked_until",
  ]) delete values[field];
  return values;
};
