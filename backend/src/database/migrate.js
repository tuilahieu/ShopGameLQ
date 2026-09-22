import { sequelize } from "../config/database.js";
import { runMigrations } from "./run-migrations.js";

try {
  await runMigrations({ statusOnly: process.argv.includes("--status") });
} catch (error) {
  console.error(`Migration failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
