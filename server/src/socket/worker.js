import { v4 as uuidv4 } from "uuid";
import redis from "../config/redis.js";

async function matchMaker(io) {
  const queueLength = await redis.llen("WAITING_QUEUE");
  if (queueLength >= 2) {
    const user1 = await redis.rpop("WAITING_QUEUE");
    const user2 = await redis.rpop("WAITING_QUEUE");
    const roomId = uuidv4();

    await redis.hset("USER_TO_ROOM", user1, roomId);
    await redis.hset("USER_TO_ROOM", user2, roomId);
    await redis.sadd(`ROOM:${roomId}`, user1, user2);

    const user1SocketId = await redis.hget("USERS", user1);
    const user2SocketId = await redis.hget("USERS", user2);

    if (user1SocketId && user2SocketId) {
      const user1Username = await redis.hget("USERNAMES", user1);
      const user2Username = await redis.hget("USERNAMES", user2);

      const roomData1 = {
        roomId: roomId,
        remoteUsername: user2Username,
      };

      const roomData2 = {
        roomId: roomId,
        remoteUsername: user1Username,
      };

      io.to(user1SocketId).emit("registration_complete", roomData1);
      io.to(user2SocketId).emit("registration_complete", roomData2);
    }
  }
}

export { matchMaker };
