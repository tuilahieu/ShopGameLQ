import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

export const AssistantMessage = sequelize.define("AssistantMessage", {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  thread_id: { type: DataTypes.UUID, allowNull: false },
  role: { type: DataTypes.STRING(12), allowNull: false, validate: { isIn: [["user", "assistant"]] } },
  text: { type: DataTypes.STRING(1000), allowNull: false },
  response_json: { type: DataTypes.JSON, allowNull: true },
}, {
  tableName: "assistant_messages",
  createdAt: "created_at",
  updatedAt: false,
  underscored: true,
});
