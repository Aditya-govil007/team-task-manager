import { TaskStatus } from "@prisma/client";
import { z } from "zod";

export const createTaskSchema = {
  body: z.object({
    projectId: z.string().uuid(),
    title: z.string().trim().min(2).max(200),
    description: z.string().trim().max(1000).optional(),
    dueDate: z.string().datetime().optional(),
    assignedToId: z.string().uuid().optional()
  })
};

export const taskProjectParamSchema = {
  params: z.object({
    projectId: z.string().uuid()
  })
};

export const updateTaskStatusSchema = {
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    status: z.nativeEnum(TaskStatus)
  })
};
