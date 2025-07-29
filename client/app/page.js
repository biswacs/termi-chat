"use client";
import { useEffect, useState, useRef } from "react";
import { Rewind } from "lucide-react";
import socket from "@/apis/socket";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [remoteUsername, setRemoteUsername] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getUserId = () => {
    if (typeof window !== "undefined") {
      let storedUserId = localStorage.getItem("userId");
      if (!storedUserId) {
        storedUserId = uuidv4();
        localStorage.setItem("userId", storedUserId);
      }
      return storedUserId;
    }
    return "";
  };

  const validateUsername = (value) => {
    return /^[a-z0-9]+$/.test(value);
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value.toLowerCase();
    if (validateUsername(value) || value === "") {
      setUsername(value);
    }
  };

  const isUsernameValid = () => {
    return (
      username.length >= 1 &&
      username.length <= 16 &&
      validateUsername(username)
    );
  };

  const handleOnboardingSubmit = (e) => {
    e.preventDefault();
    if (isUsernameValid()) {
      localStorage.setItem("username", username);
      setShowOnboarding(false);
      registerUser();
    }
  };

  const registerUser = () => {
    const userId = getUserId();
    const storedUsername = localStorage.getItem("username");
    setUserId(userId);
    setUsername(storedUsername);

    socket.emit("register_user", {
      userId: userId,
      username: storedUsername,
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
      socket.emit("send_message", {
        userId: userId,
        message,
      });
      setMessage("");
    }
  };

  const disConnectRoomUser = () => {
    socket.emit("disconnect_room", {
      userId: userId,
      isManualDisconnect: true,
    });
    setConnected(false);
    setMessages([]);
    setRemoteUsername("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey && connected) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    socket.on("registration_complete", (roomData) => {
      setConnected(true);
      if (roomData.remoteUsername) {
        setRemoteUsername(roomData.remoteUsername);
      }
    });

    socket.on("receive_message", (messageData) => {
      const newMsg = {
        sender: "remote",
        text: messageData.message,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, newMsg]);
    });

    socket.on("room_disconnected", () => {
      setConnected(false);
      setMessages([]);
      setRemoteUsername("");
    });

    const storedUsername = localStorage.getItem("username");
    if (!storedUsername) {
      setShowOnboarding(true);
      return;
    }

    registerUser();

    return () => {
      socket.off("registration_complete");
      socket.off("receive_message");
      socket.off("room_disconnected");
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (showOnboarding) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#080808] text-cyan-400 font-mono p-4">
        <div className="w-full max-w-md border border-cyan-400 rounded-lg p-8 shadow-md shadow-cyan-400">
          <h1 className="text-2xl font-bold mb-6 text-center">
            Welcome to TERMI
          </h1>
          <form onSubmit={handleOnboardingSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Enter your username:</label>
              <input
                type="text"
                value={username}
                maxLength={16}
                onChange={handleUsernameChange}
                placeholder="Your username..."
                className="w-full px-4 py-3 rounded border border-white bg-transparent text-white placeholder-white focus:outline-none font-mono"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={!isUsernameValid()}
              className="w-full px-4 py-3 rounded font-mono transition-all disabled:opacity-80 disabled:cursor-not-allowed bg-green-400 text-black"
            >
              START CHATTING
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#080808] text-cyan-400 font-mono p-4">
      <div className="w-full max-w-4xl h-[85vh] flex flex-col border border-cyan-400 rounded-lg overflow-hidden shadow-md shadow-cyan-400">
        <div className="flex justify-between items-center p-4 border-b border-cyan-400 relative">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm px-2 py-1 rounded border border-green-400 shadow-md shadow-green-400">
              <span className="text-green-400">TERMI:</span>
              {connected ? (
                <span className="text-pink-400">
                  CONNECTED {remoteUsername && `- ${remoteUsername}`}
                </span>
              ) : (
                <span className="animate-pulse text-white">CONNECTING...</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={disConnectRoomUser}
              disabled={!connected}
              className="shadow-md shadow-green-400 disabled:opacity-80 text-green-400 font-mono px-2 py-1 rounded border border-green-400 transition-all disabled:cursor-not-allowed duration-200"
            >
              <Rewind className="size-5 rotate-180" />
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
                <div className="px-3 py-1.5 rounded-lg border border-cyan-400 text-sm leading-relaxed break-words text-white shadow-md shadow-cyan-400">
                  {msg.text}
                </div>
                <div
                  className={`text-[10px] mt-2 text-white ${
                    msg.sender === "user" ? "text-right" : "text-left"
                  }`}
                >
                  {msg.timestamp} ·{" "}
                  {msg.sender === "user" ? username : remoteUsername}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-cyan-400 p-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={message}
                placeholder="TYPE MESSAGE..."
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                className="shadow-md shadow-neutral-400 w-full placeholder-white text-white px-4 py-3 rounded border border-neutral-400 focus:outline-none font-mono text-sm"
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!connected}
              className="shadow-md shadow-neutral-400 text-white font-mono px-4 py-3 rounded border border-neutral-400 transition-all text-sm disabled:cursor-not-allowed duration-200"
            >
              SEND
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
