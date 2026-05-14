import { Router } from "express";
import { Role } from "@prisma/client";
import * as taskController from "../controllers/task.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { asyncHandler } from "../middlewares/async.middleware";
import { validate } from "../middlewares/validation.middleware";
import {
  createTaskSchema,
  taskProjectParamSchema,
  updateTaskStatusSchema
} from "../validators/task.validator";

const router = Router();

router.use(authenticate);
router.post("/", validate(createTaskSchema), asyncHandler(taskController.createTask));
router.get("/project/:projectId", validate(taskProjectParamSchema), asyncHandler(taskController.getTasksByProject));
router.patch("/:id/status", validate(updateTaskStatusSchema), asyncHandler(taskController.updateTaskStatus));
router.patch("/:id/assign", authorize([Role.ADMIN]), asyncHandler(taskController.assignTask));
router.get("/me", asyncHandler(taskController.getMyTasks));

export default router;
