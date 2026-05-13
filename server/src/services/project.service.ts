import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";

type CreateProjectInput = {
  name: string;
  description?: string;
  creatorId: string;
};

export async function createProject(input: CreateProjectInput) {
  return prisma.project.create({
    data: {
      name: input.name,
      description: input.description,
      createdById: input.creatorId,
      members: {
        create: {
          userId: input.creatorId
        }
      }
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      }
    }
  });
}

export async function getProjectsForUser(userId: string) {
  return prisma.project.findMany({
    where: { members: { some: { userId } } },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function getProjectById(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, members: { some: { userId } } },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      },
      tasks: {
        include: {
          assignedTo: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  return project;
}

export async function addProjectMember(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  return prisma.projectMember.upsert({
    where: { projectId_userId: { projectId, userId } },
    create: { projectId, userId },
    update: {},
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true }
      }
    }
  });
}

export async function assertProjectMember(projectId: string, userId: string) {
  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId
      }
    }
  });

  if (!membership) {
    throw new AppError("Forbidden", 403);
  }
}
