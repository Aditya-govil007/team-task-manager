import { Router } from "express";
import { getDashboard } from "../controllers/dashboard.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { asyncHandler } from "../middlewares/async.middleware";

const router = Router();

router.use(authenticate);
router.get("/", asyncHandler(getDashboard));

export default router;
