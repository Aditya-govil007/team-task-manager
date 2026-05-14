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
    where: {
      OR: [
        { createdById: userId },
        { members: { some: { userId } } }
      ]
    },
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
    where: {
      id: projectId,
      OR: [
        { createdById: userId },
        { members: { some: { userId } } }
      ]
    },
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

  const existingMember = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } }
  });

  if (existingMember) {
    throw new AppError("User is already a project member", 409);
  }

  return prisma.projectMember.create({
    data: { projectId, userId },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true }
      }
    }
  });
}

export async function getProjectMembers(projectId: string) {
  return prisma.projectMember.findMany({
    where: { projectId },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true }
      }
    },
    orderBy: { createdAt: "asc" }
  });
}

export async function removeProjectMember(projectId: string, userId: string) {
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } }
  });

  if (!membership) {
    throw new AppError("Project member not found", 404);
  }

  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId } }
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
