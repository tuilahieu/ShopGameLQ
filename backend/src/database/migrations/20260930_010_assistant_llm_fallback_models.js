import { DataTypes } from "sequelize";

export const transactional = false;

export async function up({ queryInterface }) {
  const columns = await queryInterface.describeTable("setting");
  if (!columns.assistant_llm_fallback_models) {
    await queryInterface.addColumn("setting", "assistant_llm_fallback_models", { type: DataTypes.TEXT, allowNull: true });
  }
}
