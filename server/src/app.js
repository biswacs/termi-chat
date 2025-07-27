import { createServer } from "http";
import { Server } from "socket.io";
import socketConnection from "./socket/index.js";

const port = 8000;
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});
socketConnection(io);

const startServer = async () => {
  try {
    httpServer.listen(port, () => {
      console.log(`http://localhost:${port}`);
    });
  } catch (error) {
    console.log(error);
  }
};

startServer();
