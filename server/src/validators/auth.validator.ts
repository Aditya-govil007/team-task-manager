import { Role } from "@prisma/client";
import { z } from "zod";

export const signupSchema = {
  body: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email(),
    password: z.string().min(6).max(128),
    role: z.nativeEnum(Role).optional()
  })
};

export const loginSchema = {
  body: z.object({
    email: z.string().trim().email(),
    password: z.string().min(6).max(128)
  })
};
