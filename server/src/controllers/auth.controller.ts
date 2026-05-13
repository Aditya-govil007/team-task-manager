import { Request, Response } from "express";
import * as authService from "../services/auth.service";

export async function signup(req: Request, res: Response) {
  const result = await authService.signup(req.body);
  return res.status(201).json(result);
}

export async function login(req: Request, res: Response) {
  const result = await authService.login(req.body);
  return res.status(200).json(result);
}
