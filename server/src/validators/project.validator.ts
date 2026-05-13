import { z } from "zod";

export const createProjectSchema = {
  body: z.object({
    name: z.string().trim().min(2).max(150),
    description: z.string().trim().max(500).optional()
  })
};

export const projectIdParamSchema = {
  params: z.object({
    id: z.string().uuid()
  })
};

export const addProjectMemberSchema = {
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    userId: z.string().uuid()
  })
};
