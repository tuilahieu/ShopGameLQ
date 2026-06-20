import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",

    logging: false,

    timezone: "+07:00",

    dialectOptions: {
      charset: "utf8mb4",
    },

    define: {
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    },
  },
);
