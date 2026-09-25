import { Router } from "express";

import { createPaymentIntent, getPaymentIntent } from "./payment.controller.js";
import { authMiddleware } from "../../shared/middlewares/auth.middleware.js";

const router = Router();

router.post("/intents", authMiddleware, createPaymentIntent);
router.get("/intents/:id", authMiddleware, getPaymentIntent);

export default router;
