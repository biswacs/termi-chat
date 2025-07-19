"use client";
import { useEffect, useState } from "react";
import socket from "@/apis/socket";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
  const [message, setMessage] = useState("");
  const [receivedMessage, setReceivedMessage] = useState("");

  const sendMessage = async () => {
    socket.emit("send_message", message);
  };

  useEffect(() => {
    socket.on("receive_message", (message) => {
      console.log(message);
      setReceivedMessage(message);
    });
  }, [socket]);

  useEffect(() => {
    socket.on("registration_complete", (room) => {
      console.log("joined room: ", room);
    });
  }, [socket]);

  useEffect(() => {
    let client_id = localStorage.getItem("client_id");
    if (!client_id) {
      client_id = uuidv4();
      localStorage.setItem("client_id", client_id);
    }

    navigator.geolocation.getCurrentPosition(
      (data) => {
        console.log(
          `client_id: ${client_id}, latitude: ${data.coords.latitude}, longitude: ${data.coords.longitude}`
        );
        socket.emit("register_client", {
          client_id: client_id,
          latitude: data.coords.latitude,
          longitude: data.coords.longitude,
        });
      },
      (error) => {
        console.error(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
      }
    );
  }, []);

  return (
    <div className="h-screen w-full flex flex-col gap-6 justify-center items-center">
      <div className="bg-neutral-900 p-4 flex flex-col gap-4 w-md">
        <input
          className="bg-neutral-800 w-full h-14 px-4 rounded-md focus:outline-none border border-neutral-600 font-mono"
          placeholder="enter your mesage"
          onChange={(e) => {
            setMessage(e.target.value);
          }}
        />
        <button
          onClick={sendMessage}
          className="w-full h-14 bg-neutral-200 text-center text-xl rounded-md text-black"
        >
          send
        </button>
        <div className="text-xl">received message: {receivedMessage}</div>
      </div>
    </div>
  );
}
