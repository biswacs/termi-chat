import { createClient } from "redis";
const client = createClient();
client.on("error", (error) => {
  console.error("redis connection error: ", error);
});
export default client;
