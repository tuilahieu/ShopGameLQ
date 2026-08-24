import { encryptCredential } from "../../utils/credential.util.js";

export const transactional = false;

async function hasIndex(queryInterface, table, name, transaction) {
  const indexes = await queryInterface.showIndex(table, { transaction });
  return indexes.some((index) => index.name === name);
}

export async function up({ queryInterface, sequelize, transaction }) {
  // New writes already use AES-GCM. Upgrade legacy plaintext login records as
  // well, so an accidental database export cannot reveal game credentials.
  let lastId = 0;
  while (true) {
    const [rows] = await sequelize.query(
      "SELECT id, login FROM list_acc_game WHERE id > ? AND login IS NOT NULL AND login NOT LIKE 'enc:v1:%' ORDER BY id ASC LIMIT 250",
      { replacements: [lastId], transaction },
    );
    if (rows.length === 0) break;
    for (const account of rows) {
      lastId = account.id;
      if (!account.login) continue;
      await sequelize.query(
        "UPDATE list_acc_game SET login = ? WHERE id = ? AND login NOT LIKE 'enc:v1:%'",
        { replacements: [encryptCredential(account.login), account.id], transaction },
      );
    }
  }

  // Earlier idempotent purchase responses could contain `login`; keeping the
  // response lean lets a replay re-read the credential only after ownership is
  // checked by the order controller.
  await sequelize.query(
    "UPDATE idempotency_keys SET response_body = JSON_REMOVE(response_body, '$.login') WHERE response_body IS NOT NULL AND JSON_CONTAINS_PATH(response_body, 'one', '$.login')",
    { transaction },
  );

  // An account is a single inventory item. Row locks in checkout are the first
  // line of defense; this unique index remains the database-level backstop if a
  // future code path accidentally tries to create a second completed order.
  if (!(await hasIndex(queryInterface, "orders", "uq_orders_acc_id", transaction))) {
    const [duplicates] = await sequelize.query(
      "SELECT acc_id, COUNT(*) AS total FROM orders GROUP BY acc_id HAVING COUNT(*) > 1 LIMIT 10",
      { transaction },
    );
    if (duplicates.length > 0) {
      throw new Error(
        `Không thể áp dụng ràng buộc một đơn / một tài khoản vì đã có dữ liệu trùng: ${duplicates.map((row) => row.acc_id).join(", ")}`,
      );
    }
    await queryInterface.addIndex("orders", ["acc_id"], { name: "uq_orders_acc_id", unique: true, transaction });
  }
}
