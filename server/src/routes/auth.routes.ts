import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { asyncHandler } from "../middlewares/async.middleware";
import { validate } from "../middlewares/validation.middleware";
import { loginSchema, signupSchema } from "../validators/auth.validator";

const router = Router();

router.post("/signup", validate(signupSchema), asyncHandler(authController.signup));
router.post("/login", validate(loginSchema), asyncHandler(authController.login));

export default router;
