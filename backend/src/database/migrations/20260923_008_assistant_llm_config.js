import { DataTypes } from "sequelize";

export const transactional = false;

export async function up({ queryInterface }) {
  const columns = await queryInterface.describeTable("setting");
  if (!columns.assistant_llm_provider) await queryInterface.addColumn("setting", "assistant_llm_provider", { type: DataTypes.STRING(24), allowNull: true });
  if (!columns.assistant_llm_api_key) await queryInterface.addColumn("setting", "assistant_llm_api_key", { type: DataTypes.TEXT, allowNull: true });
}
