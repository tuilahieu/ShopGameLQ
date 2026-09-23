export const transactional = false;

export async function up({ sequelize }) {
  await sequelize.query(`CREATE TABLE IF NOT EXISTS assistant_threads (
    id CHAR(36) NOT NULL,
    token_hash CHAR(64) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_assistant_threads_updated (updated_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await sequelize.query(`CREATE TABLE IF NOT EXISTS assistant_messages (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    thread_id CHAR(36) NOT NULL,
    role VARCHAR(12) NOT NULL,
    text VARCHAR(1000) NOT NULL,
    response_json JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_assistant_messages_thread_id (thread_id, id),
    CONSTRAINT fk_assistant_messages_thread FOREIGN KEY (thread_id) REFERENCES assistant_threads(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
}
