export const transactional = false;

export async function up({ sequelize }) {
  // An intent binds one exact amount and a one-time transfer code to a user.
  // It is intentionally separate from the provider event ledger: an event is
  // retained even when it is ignored, making replay attempts auditable.
  await sequelize.query(`CREATE TABLE IF NOT EXISTS payment_intents (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    bank_id INT NULL,
    code VARCHAR(32) NOT NULL,
    amount BIGINT UNSIGNED NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    expires_at DATETIME NOT NULL,
    paid_at DATETIME NULL,
    sepay_transaction_id VARCHAR(100) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_payment_intents_code (code),
    UNIQUE KEY uq_payment_intents_sepay_transaction (sepay_transaction_id),
    KEY idx_payment_intents_user_status (user_id, status, created_at),
    CONSTRAINT fk_payment_intents_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_payment_intents_bank FOREIGN KEY (bank_id) REFERENCES list_bank(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await sequelize.query(`CREATE TABLE IF NOT EXISTS payment_events (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    provider VARCHAR(32) NOT NULL,
    provider_event_id VARCHAR(100) NOT NULL,
    payment_intent_id BIGINT UNSIGNED NULL,
    user_id INT NULL,
    amount BIGINT UNSIGNED NULL,
    status VARCHAR(20) NOT NULL,
    failure_reason VARCHAR(255) NULL,
    payload JSON NOT NULL,
    received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_payment_events_provider_event (provider, provider_event_id),
    KEY idx_payment_events_intent (payment_intent_id),
    KEY idx_payment_events_user (user_id, received_at),
    CONSTRAINT fk_payment_events_intent FOREIGN KEY (payment_intent_id) REFERENCES payment_intents(id) ON DELETE SET NULL,
    CONSTRAINT fk_payment_events_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
}
