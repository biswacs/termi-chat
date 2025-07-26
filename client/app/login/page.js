"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "@/apis/config";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await createUser(username);
      console.log("User created:", response);

      // Store user info in localStorage or handle as needed
      localStorage.setItem("username", username);

      // Redirect to home page
      router.push("/");
    } catch (error) {
      console.error("Login failed:", error);
      setError("Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#080808] text-cyan-400 font-mono p-4">
      <div className="w-full max-w-md border border-cyan-400 rounded-lg overflow-hidden shadow-md shadow-cyan-400 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-cyan-400 mb-2">TERMI</h1>
          <p className="text-white text-sm">
            Create your account to start chatting
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-white mb-2"
            >
              USERNAME
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username..."
              className="shadow-md shadow-neutral-400 w-full placeholder-white text-white px-4 py-3 rounded border border-neutral-400 focus:outline-none focus:border-cyan-400 font-mono text-sm bg-transparent"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="shadow-md shadow-cyan-400 text-cyan-400 font-mono px-6 py-3 rounded border border-cyan-400 transition-all text-sm disabled:opacity-80 disabled:cursor-not-allowed duration-200 w-full hover:bg-cyan-400 hover:text-black"
          >
            {isLoading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
          </button>
        </form>
      </div>
    </div>
  );
}
