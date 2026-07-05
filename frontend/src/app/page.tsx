"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Activity, ShieldCheck, Key, Lock, AlertCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If token exists, direct user to dashboard
    if (localStorage.getItem("astracast_token")) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const res = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString()
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Authentication failed. Invalid username or password.");
      }

      const data = await res.json();
      localStorage.setItem("astracast_token", data.access_token);
      localStorage.setItem("astracast_role", data.role);
      localStorage.setItem("astracast_user", data.username);
      
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#020617] text-slate-100 font-sans overflow-hidden">
      {/* Premium Aurora Background and Floating Lights */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-950/20 via-slate-950/90 to-[#020617] z-0" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-500/5 blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: "6s" }} />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[140px] pointer-events-none animate-pulse" style={{ animationDuration: "10s" }} />

      {/* Decorative Starfield Particles */}
      <div className="absolute inset-0 opacity-30 pointer-events-none z-0">
        <div className="absolute top-12 left-1/3 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDuration: "3s" }} />
        <div className="absolute top-1/2 left-10 w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse" style={{ animationDuration: "4s" }} />
        <div className="absolute bottom-20 left-1/4 w-0.5 h-0.5 bg-slate-300 rounded-full" />
        <div className="absolute top-20 right-1/4 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDuration: "2s" }} />
        <div className="absolute bottom-32 right-12 w-1.5 h-1.5 bg-purple-300 rounded-full animate-pulse" style={{ animationDuration: "5s" }} />
      </div>

      <div className="w-full max-w-md px-6 py-12 z-10">
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="p-4 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl shadow-xl shadow-blue-500/20 mb-4"
          >
            <Activity className="h-8 w-8 text-white animate-pulse" />
          </motion.div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            AstraCast AI
          </h1>
          <p className="text-slate-400 mt-2 text-sm max-w-xs">
            Predicting Space Weather Before It Happens.
          </p>
        </div>

        {/* Login Glassmorphic Panel */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl"
        >
          <h2 className="text-lg font-semibold text-slate-200 mb-6">Portal Authorization</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Input */}
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Ident Code / Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Key className="h-4 w-4" />
                </span>
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 text-slate-100 placeholder-slate-600 outline-none text-sm transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Security Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 text-slate-100 placeholder-slate-600 outline-none text-sm transition-all"
                />
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-2.5 items-start text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-sm font-semibold tracking-wide text-white shadow-lg shadow-blue-500/10 hover:shadow-blue-500/25 flex items-center justify-center gap-2 group transition-all"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Enter Control Center
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Credentials hints for demoing */}
        <div className="mt-8 bg-slate-950/20 border border-slate-900 rounded-xl p-4 text-center">
          <p className="text-[11px] text-slate-500 mb-2">🔓 Simple Access — No registration needed</p>
          <div className="text-[11px] text-slate-400 font-mono">
            <span>Enter any username + any password to login</span>
          </div>
        </div>

        {/* System classification disclaimer */}
        <p className="text-center text-[10px] text-slate-600 font-mono mt-8 uppercase tracking-widest">
          AstraCast Space Weather Prediction Node
        </p>
      </div>
    </div>
  );
}
