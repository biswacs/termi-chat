import "./config/env.js";
import { createServer } from "http";
import { Server } from "socket.io";
import express from "express";
import client from "./config/redis.js";
import socketConnection from "./socket/index.js";
import { sequelize } from "./model/index.js";

const port = 8000;
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

socketConnection(io);

import userRoutes from "./routes/user.route.js";
app.use("/v1/user", userRoutes);

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log("database connected");
    await sequelize.sync({ alter: true });
    console.log("database synced");

    client.connect();
    console.log("redis connected");

    httpServer.listen(port, () => {
      console.log(`http://localhost:${port}`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
