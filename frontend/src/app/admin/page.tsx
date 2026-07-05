"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { ShieldCheck, UserPlus, Trash2, CheckCircle, AlertTriangle, ShieldAlert, History } from "lucide-react";
import { motion } from "framer-motion";
import { API_BASE_URL } from "@/utils/api";

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  // User form states
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("researcher");

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem("astracast_token");
      const storedRole = localStorage.getItem("astracast_role");
      setRole(storedRole);

      if (storedRole !== "admin") {
        setLoading(false);
        return;
      }

      // Fetch users
      const usersRes = await fetch(`${API_BASE_URL}/auth/users`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const usersJson = await usersRes.json();
        setUsers(usersJson);
      }

      // Fetch audit logs
      const logsRes = await fetch(`${API_BASE_URL}/settings/logs`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (logsRes.ok) {
        const logsJson = await logsRes.json();
        setLogs(logsJson);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      const token = localStorage.getItem("astracast_token");
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          role: newUserRole
        })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || "Registration failed.");
      }

      setMessage(`User "${newUsername}" registered successfully.`);
      setNewUsername("");
      setNewPassword("");
      setNewUserRole("researcher");
      fetchAdminData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
      return;
    }
    setMessage(null);
    setError(null);

    try {
      const token = localStorage.getItem("astracast_token");
      const res = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || "Deletion failed.");
      }

      setMessage(`User "${username}" deleted.`);
      fetchAdminData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6 animate-pulse">
          <div className="h-10 bg-slate-900/60 border border-slate-800 rounded-xl w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-slate-900/60 border border-slate-800 rounded-2xl" />
            <div className="h-80 bg-slate-900/60 border border-slate-800 rounded-2xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (role !== "admin") {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3 font-sans">
          <ShieldAlert className="h-12 w-12 text-red-500 animate-bounce" />
          <h2 className="text-lg font-bold text-slate-200">Access Restricted</h2>
          <p className="text-xs text-slate-500">Only operators with the Administrator role can access this terminal page.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 font-sans">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Administrator Terminal
          </h1>
          <p className="text-slate-400 text-xs mt-1">Manage system operators, review audit trail security logs, and control network access.</p>
        </div>

        {/* Feedback banners */}
        {message && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex gap-3 text-xs text-emerald-400">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <div>{message}</div>
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-3 text-xs text-red-400">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div>{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* User Registration Form */}
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
            <h2 className="font-semibold text-slate-200 text-xs uppercase tracking-wider font-mono flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-blue-500" />
              Create Operator Profile
            </h2>

            <form onSubmit={handleRegisterUser} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider mb-2">Ident Username</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. scientist_a"
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-blue-500 placeholder-slate-700"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider mb-2">Access Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-blue-500 placeholder-slate-700"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider mb-2">Role Authority</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs outline-none text-slate-400 focus:border-blue-500"
                >
                  <option value="researcher">Researcher (Read Only)</option>
                  <option value="operator">Operator (Forecaster)</option>
                  <option value="admin">Administrator (Full Access)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/10"
              >
                Create Account
              </button>
            </form>
          </div>

          {/* Active Operator Profiles List */}
          <div className="lg:col-span-2 bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
            <h2 className="font-semibold text-slate-200 text-xs uppercase tracking-wider font-mono flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-500" />
              Active System Accounts
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/40 border-b border-slate-800/40 text-slate-500 uppercase tracking-widest text-[9px] font-bold">
                    <th className="px-4 py-2">Ident Username</th>
                    <th className="px-4 py-2">Authority Level</th>
                    <th className="px-4 py-2 text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-350">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-900/10">
                      <td className="px-4 py-3 font-semibold text-slate-300">{u.username}</td>
                      <td className="px-4 py-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          u.role === "admin" 
                            ? "bg-red-500/10 text-red-400 border border-red-500/10" 
                            : u.role === "operator" 
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/10"
                            : "bg-slate-800 text-slate-400 border border-slate-700/60"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {u.username !== "admin" ? (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.username)}
                            className="p-1 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                            title="Revoke Access"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-600 italic">Root System</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* System Logs Audit trail */}
        <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
          <h2 className="font-semibold text-slate-200 text-xs uppercase tracking-wider font-mono flex items-center gap-2">
            <History className="h-4 w-4 text-blue-500" />
            Security Audit Trail Logs
          </h2>

          <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-4 h-60 overflow-y-auto font-mono text-[10px] text-slate-400 space-y-2 pr-1">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-4 border-b border-slate-900/60 pb-1.5 leading-relaxed">
                <span className="text-slate-600 shrink-0">{new Date(log.timestamp).toISOString()}</span>
                <span className={`uppercase font-bold shrink-0 ${
                  log.level === "error" ? "text-red-500" : log.level === "warning" ? "text-yellow-500" : "text-blue-500"
                }`}>
                  [{log.level}]
                </span>
                <span className="text-slate-350">{log.message}</span>
                {log.user && <span className="ml-auto text-slate-600 shrink-0">By: {log.user}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
