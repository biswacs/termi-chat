"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
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

  return <span className="text-cyan-400">CONNECTING{dots}</span>;
};

export default function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Check authentication on component mount
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (!storedUsername) {
      router.push("/login");
      return;
    }
    setUsername(storedUsername);
    setIsLoading(false);
  }, [router]);

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

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("client_id");
    router.push("/login");
  };

  useEffect(() => {
    if (isLoading) return;

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
  }, [isLoading]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#080808] text-cyan-400 font-mono">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p>Loading...</p>
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
                <span className="animate-pulse text-green-400">CONNECTED</span>
              ) : (
                <ConnectingAnimation />
              )}
            </div>
            <div className="text-sm text-white">
              Welcome, <span className="text-cyan-400">{username}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={disConnectRoomClient}
              disabled={!connected}
              className="shadow-md shadow-green-400 disabled:opacity-80 text-green-400 font-mono px-2 py-1 rounded border border-green-400 transition-all disabled:cursor-not-allowed duration-200"
            >
              <Rewind className="size-5 rotate-180" />
            </button>
            <button
              onClick={handleLogout}
              className="shadow-md shadow-red-400 text-red-400 font-mono px-2 py-1 rounded border border-red-400 transition-all duration-200 hover:bg-red-400 hover:text-black"
            >
              LOGOUT
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
                  className={`text-[10px]  mt-2 text-white ${
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

        <div className="border-t border-cyan-400 p-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={message}
                placeholder="TYPE MESSAGE..."
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                className="shadow-md shadow-neutral-400 w-full  placeholder-white text-white px-4 py-3 rounded border border-neutral-400 focus:outline-none font-mono text-sm"
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
