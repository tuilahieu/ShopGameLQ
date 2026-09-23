import { DataTypes } from "sequelize";

export const transactional = false;

export async function up({ queryInterface }) {
  const columns = await queryInterface.describeTable("setting");
  if (!columns.assistant_name) await queryInterface.addColumn("setting", "assistant_name", { type: DataTypes.STRING(80), allowNull: true });
  if (!columns.assistant_avatar) await queryInterface.addColumn("setting", "assistant_avatar", { type: DataTypes.STRING(1024), allowNull: true });
}
