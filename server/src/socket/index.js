import { v4 as uuidv4 } from "uuid";
let clients = {};
let rooms = {};

function socketConnection(io) {
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
      return rooms[room_id];
    }
  };

  io.on("connection", (socket) => {
    socket.on("register_client", (data) => {
      console.log("registering client: ", data.client_id);
      clients[data.client_id] = {
        socket_id: socket.id,
      };
      const room = match_clients(clients);
      if (!room) {
        return null;
      }
      console.log("clients: ", Object.keys(clients).length);
      console.log("rooms: ", Object.keys(rooms).length);
      io.to(room.client_1.socket_id).emit("registration_complete", room);
      io.to(room.client_2.socket_id).emit("registration_complete", room);
    });

    socket.on("send_message", (message) => {
      let receiver_socket_id;
      for (let room_id in rooms) {
        if (rooms[room_id].client_1.socket_id === socket.id) {
          receiver_socket_id = rooms[room_id].client_2.socket_id;
          break;
        }
        if (rooms[room_id].client_2.socket_id === socket.id) {
          receiver_socket_id = rooms[room_id].client_1.socket_id;
          break;
        }
      }
      socket.to(receiver_socket_id).emit("receive_message", message);
    });

    socket.on("disconnect", () => {
      for (let client_id in clients) {
        if (clients[client_id].socket_id === socket.id) {
          delete clients[client_id];
          break;
        }
      }
      for (let room_id in rooms) {
        let receiver_socket_id;
        if (rooms[room_id].client_1.socket_id === socket.id) {
          receiver_socket_id = rooms[room_id].client_2.socket_id;
          delete rooms[room_id];
        } else if (rooms[room_id].client_2.socket_id === socket.id) {
          receiver_socket_id = rooms[room_id].client_1.socket_id;
          delete rooms[room_id];
        }
        if (receiver_socket_id) {
          console.log(
            "notifying other client about disconnection: ",
            receiver_socket_id
          );
          io.to(receiver_socket_id).emit("room_disconnected");
        }
      }
    });

    socket.on("re-register", (data) => {
      clients[data.client_id] = {
        socket_id: socket.id,
      };
      const room = match_clients(clients);
      if (!room) {
        return null;
      }
      io.to(room.client_1.socket_id).emit("registration_complete", room);
      io.to(room.client_2.socket_id).emit("registration_complete", room);
      console.log("clients: ", Object.keys(clients).length);
      console.log("rooms: ", Object.keys(rooms).length);
    });

    socket.on("disconnect_room_client", () => {
      for (let room_id in rooms) {
        let receiver_socket_id;
        if (rooms[room_id].client_1.socket_id === socket.id) {
          receiver_socket_id = rooms[room_id].client_2.socket_id;
          delete rooms[room_id];
        } else if (rooms[room_id].client_2.socket_id === socket.id) {
          receiver_socket_id = rooms[room_id].client_1.socket_id;
          delete rooms[room_id];
        }
        io.to([receiver_socket_id, socket.id]).emit("room_disconnected");
      }
    });
  });
}

export default socketConnection;
