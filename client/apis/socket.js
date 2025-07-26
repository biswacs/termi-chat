import io from "socket.io-client";

let socket = io(`${process.env.NEXT_PUBLIC_SERVER_URL}`);

export default socket;
