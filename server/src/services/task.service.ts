import { TaskStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { assertProjectMember } from "./project.service";

type CreateTaskInput = {
  projectId: string;
  title: string;
  description?: string;
  dueDate?: string;
  assignedToId?: string;
  createdById: string;
};

export async function createTask(input: CreateTaskInput) {
  await assertProjectMember(input.projectId, input.createdById);

  if (input.assignedToId) {
    await assertProjectMember(input.projectId, input.assignedToId);
  }

  return prisma.task.create({
    data: {
      projectId: input.projectId,
      title: input.title,
      description: input.description,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      assignedToId: input.assignedToId,
      createdById: input.createdById
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true } }
    }
  });
}

export async function getTasksByProject(projectId: string, userId: string) {
  await assertProjectMember(projectId, userId);

  return prisma.task.findMany({
    where: { projectId },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true } }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function updateTaskStatus(taskId: string, status: TaskStatus, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, projectId: true }
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  await assertProjectMember(task.projectId, userId);

  return prisma.task.update({
    where: { id: taskId },
    data: { status },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true } }
    }
  });
}

export async function getMyTasks(userId: string) {
  return prisma.task.findMany({
    where: { OR: [{ assignedToId: userId }, { createdById: userId }] },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true } }
    },
    orderBy: { createdAt: "desc" }
  });
}
