import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import path from "node:path";

import { swaggerSpec } from "./config/swagger.js";
import { env } from "./config/env.js";
import { requestContext, securityHeaders, notFoundHandler, errorHandler } from "./config/http.js";
import { sequelize } from "./config/database.js";

import authRoute from "./routes/auth.route.js";
import adminSecurityRoute from "./routes/adminSecurity.route.js";
import categoryRoute from "./routes/category.route.js";
import accountTypeRoute from "./routes/accountType.route.js";
import accountRoute from "./routes/account.route.js";
import orderRoute from "./routes/order.route.js";
import transactionRoute from "./routes/transaction.route.js";
import discountRoute from "./routes/discount.route.js";
import homeRoute from "./routes/home.route.js";
import profileRoute from "./routes/profile.route.js";
import bankRoute from "./routes/bank.route.js";
import paymentRoute from "./routes/payment.route.js";
import { sepayWebhook } from "./controllers/payment.controller.js";

import ctvRoute from "./routes/ctv.route.js";
import adminRoute from "./routes/admin.route.js";
import uploadRoute from "./routes/upload.route.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  if (env.trustProxy !== false) app.set("trust proxy", env.trustProxy);

  app.use(requestContext);
  app.use(securityHeaders);
  app.use(cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
      return callback(Object.assign(new Error("Origin không được phép truy cập API"), { status: 403 }));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type", "Idempotency-Key", "X-Request-Id", "X-Admin-Session"],
    maxAge: 86_400,
  }));
  // SePay's HMAC is over the exact bytes it sent. This must be mounted before
  // express.json(), otherwise parsing and serializing would invalidate it.
  app.post("/api/payments/sepay/webhook", express.raw({ type: "application/json", limit: env.maxBodyBytes }), sepayWebhook);
  app.use(express.json({ limit: env.maxBodyBytes }));
  app.use(express.urlencoded({ extended: false, limit: env.maxBodyBytes }));
  app.use(cookieParser());
  app.use("/uploads", express.static(path.resolve(env.uploadDir), { fallthrough: false, maxAge: "7d", etag: true }));

  app.get("/healthz", (_req, res) => res.status(200).json({ status: "ok" }));
  app.get("/readyz", async (_req, res) => {
    try {
      await sequelize.query("SELECT 1");
      return res.status(200).json({ status: "ready" });
    } catch {
      return res.status(503).json({ status: "not_ready" });
    }
  });
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
  app.use("/api/auth", authRoute);
  app.use("/api/auth/admin-security", adminSecurityRoute);
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
  app.use("/api/payments", paymentRoute);
  app.use("/api/ctv", ctvRoute);
  app.use("/api/admin", adminRoute);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
