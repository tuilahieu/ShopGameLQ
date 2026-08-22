export const transactional = false;

async function addIndexIfMissing(queryInterface, table, fields, name, transaction) {
  const indexes = await queryInterface.showIndex(table, { transaction });
  if (!indexes.some((index) => index.name === name)) {
    await queryInterface.addIndex(table, fields, { name, transaction });
  }
}

export async function up({ queryInterface, sequelize, transaction }) {
  await sequelize.query(`CREATE TABLE IF NOT EXISTS idempotency_keys (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    scope VARCHAR(80) NOT NULL,
    \`key\` VARCHAR(128) NOT NULL,
    request_hash CHAR(64) NOT NULL,
    status ENUM('processing','completed') NOT NULL DEFAULT 'processing',
    response_status SMALLINT NULL,
    response_body JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id), UNIQUE KEY uq_idempotency_scope_key (scope, \`key\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`, { transaction });

  // Every index maps to a currently executed listing, ownership, or financial-ledger query.
  await addIndexIfMissing(queryInterface, "list_acc_game", ["status", "loai_id", "id"], "idx_accounts_status_type_id", transaction);
  await addIndexIfMissing(queryInterface, "list_acc_game", ["seller_id", "status", "id"], "idx_accounts_seller_status_id", transaction);
  await addIndexIfMissing(queryInterface, "orders", ["user_id", "id"], "idx_orders_user_id", transaction);
  await addIndexIfMissing(queryInterface, "orders", ["acc_id"], "idx_orders_account", transaction);
  await addIndexIfMissing(queryInterface, "transactions", ["user_id", "id"], "idx_transactions_user_id", transaction);
  await addIndexIfMissing(queryInterface, "sale", ["acc_id", "status", "batdau", "ketthuc"], "idx_sale_account_active_window", transaction);
  await addIndexIfMissing(queryInterface, "ma_giam_gia", ["magiamgia", "status"], "idx_discount_code_active", transaction);
}
