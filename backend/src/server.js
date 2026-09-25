import { createApp } from "./app.js";
import { sequelize } from "./config/database.js";
import { env } from "./config/env.js";
import { runMigrations } from "./database/run-migrations.js";
import "./database/models.js";

const app = createApp();
let server;

async function shutdown(signal) {
  console.info(JSON.stringify({ level: "info", event: "shutdown_started", signal }));
  if (server) await new Promise((resolve) => server.close(resolve));
  await sequelize.close();
  process.exit(0);
}

async function start() {
  try {
    await runMigrations();
    server = app.listen(env.port, () => {
      console.info(JSON.stringify({ level: "info", event: "server_started", port: env.port, environment: env.nodeEnv }));
    });
    for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => shutdown(signal));
  } catch (error) {
    console.error(JSON.stringify({ level: "fatal", event: "startup_failed", message: error.message }));
    process.exit(1);
  }
}

start();
