import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminRoleMiddleware, requireAdminSession } from "../middlewares/admin.middleware.js";
import { createRateLimit } from "../config/http.js";
import { adminSecurityStatus, adminSessionStatus, changeAdminSecondPassword, setupAdminSecondPassword, verifyAdminSecondPassword } from "../controllers/adminSecurity.controller.js";

const router = Router();
const attemptLimit = createRateLimit({ windowMs: 15 * 60_000, max: 10 });
router.use((_req, res, next) => { res.setHeader("Cache-Control", "no-store"); next(); });
router.use(authMiddleware, adminRoleMiddleware);
router.get("/status", adminSecurityStatus);
router.post("/setup", attemptLimit, setupAdminSecondPassword);
router.post("/verify", attemptLimit, verifyAdminSecondPassword);
router.get("/session", requireAdminSession, adminSessionStatus);
router.post("/change", requireAdminSession, attemptLimit, changeAdminSecondPassword);
export default router;
