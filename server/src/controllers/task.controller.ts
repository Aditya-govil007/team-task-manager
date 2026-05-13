import { Request, Response } from "express";
import * as taskService from "../services/task.service";

export async function createTask(req: Request, res: Response) {
  const task = await taskService.createTask({
    ...req.body,
    createdById: req.user!.id
  });
  return res.status(201).json(task);
}

export async function getTasksByProject(req: Request, res: Response) {
  const tasks = await taskService.getTasksByProject(req.params.projectId, req.user!.id);
  return res.status(200).json(tasks);
}

export async function updateTaskStatus(req: Request, res: Response) {
  const task = await taskService.updateTaskStatus(req.params.id, req.body.status, req.user!.id);
  return res.status(200).json(task);
}

export async function getMyTasks(req: Request, res: Response) {
  const tasks = await taskService.getMyTasks(req.user!.id);
  return res.status(200).json(tasks);
}
