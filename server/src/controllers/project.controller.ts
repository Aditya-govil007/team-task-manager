import { Request, Response } from "express";
import * as projectService from "../services/project.service";

export async function createProject(req: Request, res: Response) {
  const project = await projectService.createProject({
    ...req.body,
    creatorId: req.user!.id
  });
  return res.status(201).json(project);
}

export async function addProjectMember(req: Request, res: Response) {
  await projectService.assertProjectMember(req.params.id, req.user!.id);
  const member = await projectService.addProjectMember(req.params.id, req.body.userId);
  return res.status(201).json(member);
}

export async function listProjects(req: Request, res: Response) {
  const projects = await projectService.getProjectsForUser(req.user!.id);
  return res.json(projects);
}

export async function getProjectById(req: Request, res: Response) {
  const project = await projectService.getProjectById(req.params.id, req.user!.id);
  return res.status(200).json(project);
}
