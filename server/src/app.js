import "./config/env.js";
import { createServer } from "http";
import { Server } from "socket.io";
import express from "express";
import jwt from "jsonwebtoken";
import * as z from "zod";
import redis from "./config/redis.js";
import socketConnection from "./socket/index.js";

const port = 8000;
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});
app.use(express.json());
socketConnection(io);
app.get("/", (req, res) => {
  res.status(200).json({ message: "termi is runningq" });
});

const userSchema = z.object({
  username: z
    .string()
    .min(4, { message: "username must be at least 4 characters" })
    .max(16, { message: "username must be at most 16 characters" })
    .regex(/^[a-z0-9]+$/, {
      message: "username must contain only lowercase letters and numbers",
    }),
  password: z
    .string()
    .min(6, { message: "password must be at least 6 characters" }),
});

app.post("/register", async (req, res) => {
  const result = userSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.issues.map((e) => e.message);
    return res.status(400).json({
      message: "validation failed",
      errors,
    });
  }
  const { username, password } = req.body;

  const user = await redis.hget("users", username);
  if (user) {
    return res.status(400).json({
      message: "username already taken",
    });
  }

  await redis.hset("users", username, password);

  const authToken = jwt.sign({ username }, process.env.JWT_SECRET);

  return res.status(200).json({
    message: "registration successful",
    data: authToken,
  });
});

app.post("/login", async (req, res) => {
  const result = userSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.issues.map((e) => e.message);
    return res.status(400).json({
      message: "validation failed",
      errors,
    });
  }
  const { username, password } = req.body;

  const userPassword = await redis.hget("users", username);
  if (!userPassword) {
    return res.status(400).json({ message: "invalid username" });
  }
  if (userPassword !== password) {
    return res.status(200).json({ message: "invalid password" });
  }
  const authToken = jwt.sign({ username }, process.env.JWT_SECRET);
  return res.status(200).json({ message: "login successful", data: authToken });
});

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
