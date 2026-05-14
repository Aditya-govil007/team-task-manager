import axios from "axios";
import { io } from "socket.io-client";
import { Task } from "../types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

const socketURL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/api\/?$/, "");
export const socket = io(socketURL ?? undefined, {
  autoConnect: false
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export type ProjectMember = {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export async function getProjectMembers(projectId: string) {
  const baseURL = (api.defaults.baseURL ?? "").replace(/\/$/, "");
  const path = baseURL.endsWith("/api")
    ? `projects/${projectId}/members`
    : `/api/projects/${projectId}/members`;
  const { data } = await api.get<ProjectMember[]>(path);
  return data;
}

export async function getMyTasks() {
  const { data } = await api.get<Task[]>("/tasks/me");
  return data;
}

export async function getProjectTasks(projectId: string) {
  const { data } = await api.get<Task[]>(`/tasks/project/${projectId}`);
  return data;
}

export default api;
