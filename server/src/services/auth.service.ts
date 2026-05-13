import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

export async function signup(input: { name: string; email: string; password: string; role?: Role }) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AppError("Email already in use", 409);

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role ?? Role.MEMBER
    }
  });

  return buildAuthResponse(user.id, user.role, user.name, user.email);
}

export async function login(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw new AppError("Invalid credentials", 401);

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw new AppError("Invalid credentials", 401);

  return buildAuthResponse(user.id, user.role, user.name, user.email);
}

function buildAuthResponse(id: string, role: Role, name: string, email: string) {
  const token = jwt.sign({ id, role }, env.jwtSecret, { expiresIn: "7d" });
  return { token, user: { id, role, name, email } };
}
