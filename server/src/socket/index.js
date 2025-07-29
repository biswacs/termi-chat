import redis from "../config/redis.js";
import { matchMaker } from "./worker.js";

async function disconnectUser(userId, socket, io) {
  const roomId = await redis.hget("USER_TO_ROOM", userId);

  if (roomId) {
    const roomUsers = await redis.smembers(`ROOM:${roomId}`);
    const otherUserId = roomUsers.find((user) => user !== userId);

    if (otherUserId) {
      const otherUserSocket = await redis.hget("USERS", otherUserId);
      if (otherUserSocket) {
        socket.to(otherUserSocket).emit("room_disconnected");
      }

      await redis.lpush("WAITING_QUEUE", otherUserId);
      await redis.hdel("USER_TO_ROOM", otherUserId);
      await matchMaker(io);
    }

    await redis.hdel("USER_TO_ROOM", userId);
    await redis.del(`ROOM:${roomId}`);
  }
}

function socketConnection(io) {
  io.on("connection", (socket) => {
    socket.on("register_user", async (data) => {
      await redis.hset("USERS", data.userId, socket.id);
      await redis.hset("SOCKET_TO_USER", socket.id, data.userId);
      await redis.lpush("WAITING_QUEUE", data.userId);
      await matchMaker(io);
    });

    socket.on("send_message", async (data) => {
      const userId = data.userId;
      const roomId = await redis.hget("USER_TO_ROOM", userId);
      if (!roomId) return;
      const roomUsers = await redis.smembers(`ROOM:${roomId}`);
      let otherUserId = roomUsers.find((user) => user !== userId);
      if (!otherUserId) return;
      const otherUserSocket = await redis.hget("USERS", otherUserId);
      if (otherUserSocket) {
        socket.to(otherUserSocket).emit("receive_message", data.message);
      }
    });

    socket.on("disconnect_room", async (data) => {
      const userId = data.userId;
      await disconnectUser(userId, socket, io);
    });

    socket.on("disconnect", async () => {
      const disconnectedUserId = await redis.hget("SOCKET_TO_USER", socket.id);

      if (disconnectedUserId) {
        await redis.hdel("SOCKET_TO_USER", socket.id);
        await disconnectUser(disconnectedUserId, socket, io);
      }
    });
  });
}

export default socketConnection;
