import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const AssistantThread = sequelize.define("AssistantThread", {
  id: { type: DataTypes.UUID, primaryKey: true },
  token_hash: { type: DataTypes.STRING(64), allowNull: false },
}, {
  tableName: "assistant_threads",
  createdAt: "created_at",
  updatedAt: "updated_at",
  underscored: true,
});
