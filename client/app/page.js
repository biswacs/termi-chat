"use client";
import { useEffect, useState, useRef } from "react";
import { Rewind } from "lucide-react";
import socket from "@/apis/socket";
import { v4 as uuidv4 } from "uuid";

const ConnectingAnimation = () => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev === "..." ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return <span className="text-yellow-400">CONNECTING{dots}</span>;
};

export default function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getClientId = () => {
    let client_id = localStorage.getItem("client_id");
    if (!client_id) {
      client_id = uuidv4();
      localStorage.setItem("client_id", client_id);
    }
    return client_id;
  };

  const registerClient = () => {
    console.log("registering client");
    const client_id = getClientId();
    socket.emit("register_client", {
      client_id,
    });
  };

  const sendMessage = () => {
    if (message.trim() !== "") {
      const newMsg = {
        sender: "user",
        text: message,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, newMsg]);
      socket.emit("send_message", message);
      setMessage("");
    }
  };

  const disConnectRoomClient = () => {
    socket.emit("disconnect_room_client");
    setConnected(false);
    setMessages([]);
    const client_id = getClientId();
    socket.emit("re-register", { client_id });
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey && connected) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    socket.on("registration_complete", (room) => {
      console.log("connected: ", room);
      setConnected(true);
    });

    socket.on("receive_message", (message) => {
      console.log("received: ", message);
      const newMsg = {
        sender: "remote",
        text: message,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, newMsg]);
    });

    socket.on("room_disconnected", () => {
      console.log("room_disconnected", socket.id);
      setConnected(false);
      setMessages([]);
      const client_id = getClientId();
      socket.emit("re-register", { client_id });
    });

    registerClient();

    return () => {
      socket.off("registration_complete");
      socket.off("receive_message");
      socket.off("room_disconnected");
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black text-cyan-400 font-mono p-4">
      <div className="w-full max-w-4xl h-[85vh] flex flex-col border border-cyan-600 rounded-lg overflow-hidden shadow-lg shadow-cyan-800">
        <div className="flex justify-between items-center h-14 px-4 border-b border-cyan-600 relative">
          <div className="flex items-center gap-2 text-sm px-2 py-1 rounded border border-cyan-600 shadow-md shadow-cyan-800">
            <span>TERMI:</span>
            {connected ? (
              <span className="animate-pulse text-green-400">CONNECTED</span>
            ) : (
              <ConnectingAnimation />
            )}
          </div>

          <div>
            <button
              onClick={disConnectRoomClient}
              disabled={!connected}
              className="shadow-sm disabled:opacity-80 text-yellow-400 font-mono px-2 py-1 rounded border border-yellow-600 transition-all disabled:cursor-not-allowed duration-200 rotate-180"
            >
              <Rewind className="size-5"/>
            </button>
          </div>
        </div>

        <div
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          className="flex-1 overflow-y-auto p-6 space-y-4"
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] ${
                  msg.sender === "user" ? "ml-auto" : "mr-auto"
                }`}
              >
                <div className="px-3 py-1.5 rounded-lg border border-cyan-600 text-sm leading-relaxed break-words text-white">
                  {msg.text}
                </div>
                <div
                  className={`text-xs  mt-1 ${
                    msg.sender === "user" ? "text-right" : "text-left"
                  }`}
                >
                  {msg.timestamp} ·{" "}
                  {msg.sender === "user" ? "YOU" : "REMOTE_USER"}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-cyan-600 bg-black p-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={message}
                placeholder="TYPE MESSAGE..."
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                className="shadow-md shadow-green-800 hover:shadow-green-600 w-full  placeholder-white text-white px-4 py-3 rounded border border-green-600 focus:outline-none font-mono text-sm transition-all duration-200"
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!connected || !message.trim()}
              className="shadow-md shadow-green-800 text-white hover:shadow-green-600 font-mono px-4 py-3 rounded border border-green-600 transition-all text-sm disabled:cursor-not-allowed duration-200"
            >
              [SEND]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
