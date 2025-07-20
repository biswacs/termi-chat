"use client";
import { useEffect, useState, useRef } from "react";
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

  return <span className="text-yellow-400">[CONNECTING{dots}]</span>;
};

export default function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [systemMessage, setSystemMessage] = useState("");
  const messagesEndRef = useRef(null);
  const client_id_ref = useRef("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const registerClient = () => {
    console.log("registering client");
    let client_id = localStorage.getItem("client_id");
    if (!client_id) {
      client_id = uuidv4();
      localStorage.setItem("client_id", client_id);
    }
    client_id_ref.current = client_id;
    navigator.geolocation.getCurrentPosition(
      (data) => {
        socket.emit("register_client", {
          client_id,
          latitude: data.coords.latitude,
          longitude: data.coords.longitude,
        });
      },
      (error) => console.log(error),
      { enableHighAccuracy: true, timeout: 5000 }
    );
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

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    socket.on("registration_complete", (room) => {
      console.log("connected: ", room);
      setConnected(true);
      setSystemMessage("CONNECTED");
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
      console.log("room_disconnected");
      setConnected(false);
      setSystemMessage("DISCONNECTED");
      registerClient();
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
    <div className="min-h-screen w-full flex items-center justify-center bg-black text-green-600 font-mono p-4">
      <div className="w-full max-w-4xl h-[85vh] flex flex-col bg-black border border-green-950 rounded-lg overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-green-950">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-green-600">STATUS:</span>
            {connected ? (
              <span className="text-green-600 animate-pulse">[CONNECTED]</span>
            ) : (
              <ConnectingAnimation />
            )}
          </div>
        </div>

        <div
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          className="flex-1 overflow-y-auto p-6 space-y-4"
        >
          {systemMessage && (
            <div className="flex justify-center">
              <div className="border border-green-950 rounded px-3 py-1 text-xs text-green-600">
                {systemMessage.toLowerCase()}
              </div>
            </div>
          )}

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
                <div className="px-3 py-1.5 rounded-lg border border-green-950 text-sm leading-relaxed break-words">
                  {msg.text}
                </div>
                <div
                  className={`text-xs text-green-600 mt-1 ${
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

        <div className="border-t border-green-950 bg-black p-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={message}
                placeholder="TYPE MESSAGE..."
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                className="shadow-sm shadow-green-800 hover:shadow-green-600 w-full text-green-600 placeholder-green-800 px-4 py-3 rounded border border-green-950 focus:outline-none font-mono text-sm transition-all duration-200"
                disabled={!connected}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!connected || !message.trim()}
              className="shadow-sm shadow-green-800 hover:shadow-green-600 disabled:text-green-800 text-green-600 font-mono px-6 py-3 rounded border border-green-950 transition-all text-sm disabled:cursor-not-allowed duration-200"
            >
              [SEND]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
