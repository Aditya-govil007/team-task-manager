import { Request, Response } from "express";
import * as dashboardService from "../services/dashboard.service";

export async function getDashboard(req: Request, res: Response) {
  const summary = await dashboardService.getDashboardSummary(req.user!.id);
  return res.status(200).json(summary);
}
