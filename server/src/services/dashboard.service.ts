import { TaskStatus } from "@prisma/client";
import { prisma } from "../config/prisma";

export async function getDashboardSummary(userId: string) {
  const now = new Date();
  const baseWhere = {
    OR: [{ assignedToId: userId }, { createdById: userId }]
  };

  const [totalTasks, completedTasks, pendingTasks, overdueTasks] = await Promise.all([
    prisma.task.count({ where: baseWhere }),
    prisma.task.count({
      where: {
        ...baseWhere,
        status: TaskStatus.COMPLETED
      }
    }),
    prisma.task.count({
      where: {
        ...baseWhere,
        status: {
          in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS]
        }
      }
    }),
    prisma.task.count({
      where: {
        ...baseWhere,
        dueDate: { lt: now },
        status: { not: TaskStatus.COMPLETED }
      }
    })
  ]);

  return {
    totalTasks,
    completedTasks,
    pendingTasks,
    overdueTasks
  };
}
