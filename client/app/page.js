"use client";
import axios from "axios";
import { useEffect, useState } from "react";
import io from "socket.io-client";
const socket = io.connect("http://localhost:8000");

export default function Home() {
  // const [latitude, setLatitude] = useState("");
  // const [longitude, setLongitude] = useState("");
  const [receivedMessage, setReceivedMessage] = useState("");
  const [receivedPvtMessage, setReceivedPvtMessage] = useState("");
  const [room, setRoom] = useState("");
  const [receiversId, setReceiversId] = useState("");
  const [message, setMessage] = useState("");

  async function onEnter() {
    // navigator.geolocation.getCurrentPosition(
    //   (data) => {
    //     setLatitude(data.coords.latitude);
    //     setLongitude(data.coords.longitude);
    //     console.log(data.coords.latitude, data.coords.longitude);
    //   },
    //   (error) => {
    //     console.error(error);
    //   },
    //   {
    //     enableHighAccuracy: true,
    //     timeout: 5000,
    //   }
    // );
    socket.emit("send_message", {
      message,
      room,
    });
  }

  async function onJoin() {
    if (!room) {
      return;
    }
    socket.emit("join_room", room);
  }

  const sendPrivateMsg = async () => {
    socket.emit("private", receiversId, message);
  };

  useEffect(() => {
    socket.on("receive_message", (data) => {
      console.log(data.message);
      setReceivedMessage(data.message);
    });
  }, [socket]);

  useEffect(() => {
    socket.on("receive_private", (data) => {
      console.log(data);
      setReceivedPvtMessage(data);
    });
  }, [socket]);

  return (
    <div className="h-screen w-full flex flex-col gap-6 justify-center items-center">
      <div className="flex flex-col gap-4 items-center justify-center bg-neutral-900 w-md p-4 rounded-lg">
        <input
          className="bg-neutral-800 w-full h-14 px-4 rounded-md focus:outline-none border border-neutral-600 font-mono"
          onChange={(e) => {
            setRoom(e.target.value);
          }}
        />
        <button
          onClick={onJoin}
          className="w-full h-14 bg-neutral-200 text-center text-xl rounded-md text-black"
        >
          join
        </button>
        <input
          className="bg-neutral-800 w-full h-14 px-4 rounded-md focus:outline-none border border-neutral-600 font-mono"
          onChange={(e) => {
            setMessage(e.target.value);
          }}
        />
        <button
          onClick={onEnter}
          className="w-full h-14 bg-neutral-200 text-center text-xl rounded-md text-black"
        >
          send
        </button>
      </div>
      <div className="text-xl font-bold">Received msg: {receivedMessage}</div>

      <div className="bg-neutral-900 p-4 flex flex-col gap-4 w-md">
        <p>test private messagess</p>
        <input
          className="bg-neutral-800 w-full h-14 px-4 rounded-md focus:outline-none border border-neutral-600 font-mono"
          placeholder="enter your mesage"
          onChange={(e) => {
            setMessage(e.target.value);
          }}
        />{" "}
        <input
          className="bg-neutral-800 w-full h-14 px-4 rounded-md focus:outline-none border border-neutral-600 font-mono"
          placeholder="enter receivers Id"
          onChange={(e) => {
            setReceiversId(e.target.value);
          }}
        />
        <button
          onClick={sendPrivateMsg}
          className="w-full h-14 bg-neutral-200 text-center text-xl rounded-md text-black"
        >
          send
        </button>
        <div className="text-xl font-bold">
          Received msg: {receivedPvtMessage}
        </div>
      </div>
    </div>
  );
}
