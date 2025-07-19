const { createServer } = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");
const port = 8000;

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

let clients = {};
let rooms = {};

const match_clients = (clients) => {
  const keys = Object.keys(clients);
  let clients_count = Object.keys(clients).length;
  if (clients_count >= 2) {
    const client_1_id = clients[keys[0]];
    const client_2_id = clients[keys[keys.length - 1]];
    const room_id = uuidv4();
    rooms[room_id] = {
      client_1: client_1_id,
      client_2: client_2_id,
    };
    delete clients[keys[0]];
    delete clients[keys[keys.length - 1]];
    console.log("deleted client_1 from pool: ", client_1_id);
    console.log("deleted client_2 from pool: ", client_2_id);
    return rooms[room_id];
  }
};

io.on("connection", (socket) => {
  // console.log(`user connected: `, socket.id);
  socket.on("register_client", (data) => {
    clients[data.client_id] = {
      socket_id: socket.id,
      // latitude: data.latitude,
      // longitude: data.longitude,
    };
    console.log(clients);
    const room = match_clients(clients);
    if (!room) {
      return null;
    }
    console.log("created room: ", room);
    io.to(room.client_1.socket_id).emit("registration_complete", room);
    io.to(room.client_2.socket_id).emit("registration_complete", room);
  });

  socket.on("send_message", (message) => {
    let receiver_socket_id;
    for (room_id in rooms) {
      if (rooms[room_id].client_1.socket_id === socket.id) {
        receiver_socket_id = rooms[room_id].client_2.socket_id;
        break;
      }
      if (rooms[room_id].client_2.socket_id === socket.id) {
        receiver_socket_id = rooms[room_id].client_1.socket_id;
        break;
      }
    }
    console.log("all clients:", clients);
    console.log("all rooms:", rooms);
    socket.to(receiver_socket_id).emit("receive_message", message);
  });

  socket.on("disconnect", (reason) => {
    console.log(
      `client_id disconnected with socket_id: ${socket.id} for reason: ${reason}`
    );
    for (client_id in clients) {
      if (clients[client_id].socket_id === socket.id) {
        delete clients[client_id];
        break;
      }
    }
  });
});

httpServer.listen(port, () => {
  console.log(`http://localhost:${port}`);
});
