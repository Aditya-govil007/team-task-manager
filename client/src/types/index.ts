export type Role = "ADMIN" | "MEMBER";
export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type Project = {
  id: string;
  name: string;
  description?: string;
};

export type Task = {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate?: string;
  projectId: string;
  assignedToId?: string | null;
};
