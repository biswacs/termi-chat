"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../context/auth";

export default function Login() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, isLoading, login } = useAuth();

  useEffect(() => {
    if (user) {
      window.location.href = "/";
    }
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    setLoading(true);
    setError("");

    const result = await login(username);

    if (!result.success) {
      setError(result.error);
    }

    setLoading(false);
  };

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
      <div className="w-full max-w-md border border-cyan-400 rounded-lg overflow-hidden shadow-md shadow-cyan-400 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-cyan-400 mb-2">TERMI</h1>
          <p className="text-white text-sm">
            Create your account to start chatting
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
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
              disabled={loading}
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="shadow-md shadow-cyan-400 text-cyan-400 font-mono px-6 py-3 rounded border border-cyan-400 transition-all text-sm disabled:opacity-80 disabled:cursor-not-allowed duration-200 w-full hover:bg-cyan-400 hover:text-black"
          >
            {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
          </button>
        </form>
      </div>
    </div>
  );
}
