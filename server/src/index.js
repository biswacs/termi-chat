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

let users = [];

io.on("connection", (socket) => {
  console.log(`user connected: `, socket.id);
  users.push(socket.id);

  socket.on("join_room", (data) => {
    console.log("joined room:", data);
    console.log("user: ", socket.id);
    socket.join(data);
  });

  socket.on("send_message", (data) => {
    console.log("user for msg: ", socket.id);
    console.log(data);
    console.log(users);
    socket.to(data.room).emit("receive_message", data);
  });
});

httpServer.listen(port, () => {
  console.log(`http://localhost:${port}`);
});
