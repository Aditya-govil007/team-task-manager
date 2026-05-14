import { Server } from "socket.io";

let io: Server | null = null;

export function setSocketServer(server: Server) {
  io = server;
}

export function emitTaskStatusUpdated(task: { id: string; projectId: string; status: string }) {
  io?.emit("task:status-updated", task);
}

export function emitTaskAssigned(task: { id: string; projectId: string; assignedToId: string | null }) {
  io?.emit("task:assigned", task);
}
