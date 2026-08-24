import { DataTypes } from "sequelize";

// MySQL DDL commits implicitly. Keep this migration safely repeatable because
// deployments may retry after an interrupted release.
export const transactional = false;

export async function up({ queryInterface }) {
  const columns = await queryInterface.describeTable("list_acc_game");
  if (!columns.sale_price) {
    await queryInterface.addColumn("list_acc_game", "sale_price", {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: null,
      comment: "direct listing sale price; Flash Sale campaigns remain in sale table",
    });
  }
}
