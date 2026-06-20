import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";

import { sequelize } from "./config/database.js";
import { swaggerSpec } from "./config/swagger.js";

import "./models/index.js";

import authRoute from "./routes/auth.route.js";
import categoryRoute from "./routes/category.route.js";
import accountTypeRoute from "./routes/accountType.route.js";
import accountRoute from "./routes/account.route.js";
import orderRoute from "./routes/order.route.js";
import transactionRoute from "./routes/transaction.route.js";
import discountRoute from "./routes/discount.route.js";
import homeRoute from "./routes/home.route.js";
import profileRoute from "./routes/profile.route.js";
import bankRoute from "./routes/bank.route.js";

import ctvRoute from "./routes/ctv.route.js";
import adminRoute from "./routes/admin.route.js";
import uploadRoute from "./routes/upload.route.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", authRoute);
app.use("/api/categories", categoryRoute);
app.use("/api/account-types", accountTypeRoute);
app.use("/api/accounts", accountRoute);
app.use("/api/orders", orderRoute);
app.use("/api/transactions", transactionRoute);
app.use("/api/discount", discountRoute);
app.use("/api/home", homeRoute);
app.use("/api/profile", profileRoute);
app.use("/api/upload", uploadRoute);
app.use("/api/banks", bankRoute);

app.use("/api/ctv", ctvRoute);
app.use("/api/admin", adminRoute);

async function start() {
  try {
    await sequelize.authenticate();
    console.log("✅ Kết nối cơ sở dữ liệu thành công");

    // Sync database schema
    await sequelize.sync();

    // Alter transactions.type enum to support ctv_earn
    try {
      await sequelize.query(`
        ALTER TABLE transactions 
        MODIFY COLUMN type ENUM('deposit', 'buy_acc', 'refund', 'admin_add', 'admin_sub', 'ctv_earn') NOT NULL
      `);
      console.log("🌱 Altered transactions type column to include ctv_earn");
    } catch (err) {
      // Ignore if it's already updated or has issues (e.g. SQLite if it were used, but dialect is mysql)
      console.log("ℹ️ Transactions column check/alter completed");
    }

    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server đang chạy tại cổng ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("❌ Không thể kết nối cơ sở dữ liệu");
    console.error(error);
  }
}

start();
