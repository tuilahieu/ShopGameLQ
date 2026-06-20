import { Router } from "express";
import { getBanks } from "../controllers/bank.controller.js";

const router = Router();

router.get("/", getBanks);

export default router;
