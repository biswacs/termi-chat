import "./config/env.js";
import { createServer } from "http";
import { Server } from "socket.io";
import express from "express";
import client from "./config/redis.js";
import socketConnection from "./socket/index.js";

const port = 8000;
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

socketConnection(io);

const start = async () => {
  try {
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
