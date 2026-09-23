import { DataTypes } from "sequelize";

export const transactional = false;

export async function up({ queryInterface }) {
  const columns = await queryInterface.describeTable("setting");
  if (!columns.assistant_llm_model) await queryInterface.addColumn("setting", "assistant_llm_model", { type: DataTypes.STRING(120), allowNull: true });
  if (!columns.assistant_llm_endpoint) await queryInterface.addColumn("setting", "assistant_llm_endpoint", { type: DataTypes.STRING(255), allowNull: true });
}
