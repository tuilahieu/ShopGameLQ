import { DataTypes } from "sequelize";

export const transactional = false;

export async function up({ queryInterface }) {
  const columns = await queryInterface.describeTable("users");
  const additions = {
    admin_second_password_hash: { type: DataTypes.STRING(255), allowNull: true },
    admin_session_hash: { type: DataTypes.STRING(64), allowNull: true },
    admin_session_expires_at: { type: DataTypes.DATE, allowNull: true },
    admin_second_attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    admin_second_locked_until: { type: DataTypes.DATE, allowNull: true },
  };
  for (const [name, definition] of Object.entries(additions)) {
    if (!columns[name]) await queryInterface.addColumn("users", name, definition);
  }
}
