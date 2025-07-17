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
    console.log("userId for joining room: ", socket.id, " roomNo:", data);
    socket.join(data);
  });

  socket.on("private", (userId, data) => {
    console.log("Receivers userId: ", userId, " data: ", data);
    socket.to(userId).emit("receive_private", data);
  });

  socket.on("send_message", (data) => {
    console.log("Senders userId: ", socket.id, " data: ", data);
    console.log("All userIds stored in local memory: ", users);
    socket.to(data.room).emit("receive_message", data);
  });

  socket.on("disconnect",(reason)=>{
    console.log(`SocketId disconnected with id ${socket.id} for reason: ${reason}`)
  })
});

httpServer.listen(port, () => {
  console.log(`http://localhost:${port}`);
});
