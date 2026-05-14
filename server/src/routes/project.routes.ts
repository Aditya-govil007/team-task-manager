import { Router } from "express";
import { Role } from "@prisma/client";
import * as projectController from "../controllers/project.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { asyncHandler } from "../middlewares/async.middleware";
import { validate } from "../middlewares/validation.middleware";
import {
  addProjectMemberSchema,
  createProjectSchema,
  projectIdParamSchema,
  removeProjectMemberSchema
} from "../validators/project.validator";

const router = Router();

router.use(authenticate);
router.get("/", asyncHandler(projectController.listProjects));
router.get("/:id", validate(projectIdParamSchema), asyncHandler(projectController.getProjectById));
router.post("/", authorize([Role.ADMIN]), validate(createProjectSchema), asyncHandler(projectController.createProject));
router.post(
  "/:id/members",
  authorize([Role.ADMIN]),
  validate(addProjectMemberSchema),
  asyncHandler(projectController.addProjectMember)
);
router.get(
  "/:id/members",
  validate(projectIdParamSchema),
  asyncHandler(projectController.getProjectMembers)
);
router.delete(
  "/:id/members/:userId",
  authorize([Role.ADMIN]),
  validate(removeProjectMemberSchema),
  asyncHandler(projectController.removeProjectMember)
);

export default router;
