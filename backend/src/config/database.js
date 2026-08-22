import { Sequelize } from "sequelize";
import { env } from "./env.js";

export const sequelize = new Sequelize(
  env.database.name,
  env.database.user,
  env.database.password,
  {
    host: env.database.host,
    port: env.database.port,
    dialect: "mysql",

    logging: false,

    timezone: "+07:00",

    dialectOptions: {
      charset: "utf8mb4",
      ...(env.database.ssl && { ssl: { require: true, rejectUnauthorized: false } }),
    },

    pool: {
      max: 20,
      min: 2,
      acquire: 30_000,
      idle: 10_000,
    },

    define: {
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    },
  },
);
