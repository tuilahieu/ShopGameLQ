import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sequelize } from "../config/database.js";

const migrationDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "migrations");
const statusOnly = process.argv.includes("--status");

async function main() {
  await sequelize.authenticate();
  await sequelize.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name VARCHAR(255) PRIMARY KEY,
    executed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  const [appliedRows] = await sequelize.query("SELECT name FROM schema_migrations ORDER BY name");
  const applied = new Set(appliedRows.map((row) => row.name));
  const files = (await fs.readdir(migrationDir)).filter((file) => file.endsWith(".js")).sort();

  for (const file of files) {
    const state = applied.has(file) ? "applied" : "pending";
    console.info(`${state.padEnd(7)} ${file}`);
    if (statusOnly || applied.has(file)) continue;
    const migration = await import(path.join(migrationDir, file));
    const execute = async (transaction = undefined) => {
      await migration.up({ queryInterface: sequelize.getQueryInterface(), sequelize, transaction });
      await sequelize.query("INSERT INTO schema_migrations (name) VALUES (?)", { replacements: [file], transaction });
    };
    // MySQL DDL causes implicit commits, so index/schema migrations must opt out of a transaction.
    if (migration.transactional === false) await execute();
    else await sequelize.transaction(execute);
    console.info(`migrated ${file}`);
  }
  await sequelize.close();
}

main().catch(async (error) => {
  console.error(`Migration failed: ${error.message}`);
  await sequelize.close();
  process.exit(1);
});
