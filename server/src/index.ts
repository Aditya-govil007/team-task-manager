import { createServer } from "http";
import { Server } from "socket.io";
import app from "./app";
import { env } from "./config/env";
import { setSocketServer } from "./config/socket";

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: env.corsOrigin
  }
});

setSocketServer(io);

httpServer.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});
