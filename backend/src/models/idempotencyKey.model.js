import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const IdempotencyKey = sequelize.define(
  "IdempotencyKey",
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    scope: { type: DataTypes.STRING(80), allowNull: false },
    key: { type: DataTypes.STRING(128), allowNull: false },
    request_hash: { type: DataTypes.STRING(64), allowNull: false },
    status: { type: DataTypes.ENUM("processing", "completed"), allowNull: false, defaultValue: "processing" },
    response_status: { type: DataTypes.INTEGER, allowNull: true },
    response_body: { type: DataTypes.JSON, allowNull: true },
  },
  {
    tableName: "idempotency_keys",
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [{ unique: true, fields: ["scope", "key"], name: "uq_idempotency_scope_key" }],
  },
);
