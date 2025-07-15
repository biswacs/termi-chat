const { createServer } = require("http");
const express = require("express");
const { Server } = require("socket.io");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
const port = 8000;

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log(`user connected: `, socket.id);

  socket.on("join_room", (data) => {
    console.log("joined room:", data);
    socket.join(data);
  });

  socket.on("send_message", (data) => {
    console.log(data);
    socket.to(data.room).emit("receive_message", data);
  });
});

httpServer.listen(port, () => {
  console.log(`http://localhost:${port}`);
});
