"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Settings, Save, CheckCircle, AlertTriangle, ShieldAlert } from "lucide-react";
import { API_BASE_URL } from "@/utils/api";

export default function SettingsPage() {
  const [thresholds, setThresholds] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("astracast_token");
      const storedRole = localStorage.getItem("astracast_role");
      setRole(storedRole);
      
      const res = await fetch(`${API_BASE_URL}/settings/thresholds`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setThresholds(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleThresholdChange = (param: string, level: string, val: number) => {
    setThresholds((prev: any) => ({
      ...prev,
      [param]: {
        ...prev[param],
        [level]: val
      }
    }));
  };

  const handleSaveThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role !== "admin") return;

    setMessage(null);
    setError(null);

    try {
      const token = localStorage.getItem("astracast_token");
      const res = await fetch(`${API_BASE_URL}/settings/thresholds`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(thresholds)
      });

      if (!res.ok) throw new Error("Failed to save thresholds.");
      
      setMessage("System safety thresholds saved successfully.");
      fetchSettings();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const isAdmin = role === "admin";

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6 animate-pulse">
          <div className="h-10 bg-slate-900/60 border border-slate-800 rounded-xl w-48" />
          <div className="h-80 bg-slate-900/60 border border-slate-800 rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 font-sans">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            System Settings
          </h1>
          <p className="text-slate-400 text-xs mt-1">Configure warning alert limits, profile options, and units.</p>
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
          {/* Threshold Configurations */}
          <div className="lg:col-span-2 bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-slate-200 text-xs uppercase tracking-wider font-mono">Warning Limits & Thresholds</h2>
              {!isAdmin && (
                <span className="px-2 py-1 bg-slate-800 text-slate-400 text-[9px] font-bold rounded-lg uppercase tracking-wider font-mono flex items-center gap-1 border border-slate-700/60">
                  <ShieldAlert className="h-3 w-3" />
                  Read-Only View
                </span>
              )}
            </div>

            <form onSubmit={handleSaveThresholds} className="space-y-6">
              <div className="space-y-5 max-h-[400px] overflow-y-auto pr-1">
                {Object.keys(thresholds || {}).map((param) => {
                  const t = thresholds[param];
                  return (
                    <div key={param} className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl space-y-3">
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest font-mono">
                        {param.replace(/_/g, " ")}
                      </span>
                      <div className="grid grid-cols-4 gap-3 text-center text-xs">
                        {/* Low */}
                        <div>
                          <label className="block text-[8px] text-slate-500 uppercase font-mono tracking-wider mb-1">Low</label>
                          <input
                            type="number"
                            step="0.01"
                            disabled={!isAdmin}
                            value={t.low}
                            onChange={(e) => handleThresholdChange(param, "low", parseFloat(e.target.value) || 0.0)}
                            className="w-full px-2 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-center outline-none focus:border-blue-500 disabled:opacity-50"
                          />
                        </div>
                        {/* Medium */}
                        <div>
                          <label className="block text-[8px] text-slate-500 uppercase font-mono tracking-wider mb-1">Med</label>
                          <input
                            type="number"
                            step="0.01"
                            disabled={!isAdmin}
                            value={t.medium}
                            onChange={(e) => handleThresholdChange(param, "medium", parseFloat(e.target.value) || 0.0)}
                            className="w-full px-2 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-center outline-none focus:border-blue-500 disabled:opacity-50"
                          />
                        </div>
                        {/* High */}
                        <div>
                          <label className="block text-[8px] text-slate-500 uppercase font-mono tracking-wider mb-1">High</label>
                          <input
                            type="number"
                            step="0.01"
                            disabled={!isAdmin}
                            value={t.high}
                            onChange={(e) => handleThresholdChange(param, "high", parseFloat(e.target.value) || 0.0)}
                            className="w-full px-2 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-center outline-none focus:border-blue-500 disabled:opacity-50"
                          />
                        </div>
                        {/* Critical */}
                        <div>
                          <label className="block text-[8px] text-slate-500 uppercase font-mono tracking-wider mb-1">Crit</label>
                          <input
                            type="number"
                            step="0.01"
                            disabled={!isAdmin}
                            value={t.critical}
                            onChange={(e) => handleThresholdChange(param, "critical", parseFloat(e.target.value) || 0.0)}
                            className="w-full px-2 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-center outline-none focus:border-blue-500 disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {isAdmin && (
                <div className="flex justify-end pt-4 border-t border-slate-800/60">
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-blue-500/10 transition-all"
                  >
                    <Save className="h-4 w-4" />
                    Save Safety Parameters
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Unit Settings */}
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
            <h2 className="font-semibold text-slate-200 text-xs uppercase tracking-wider font-mono">System Preferences</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider mb-2">Display Units</label>
                <select className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs outline-none text-slate-300">
                  <option value="si">Standard Metric (km/s, nT, PFU)</option>
                  <option value="imperial">Imperial Equivalent (mi/h, Gauss)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider mb-2">Auto Prediction Interval</label>
                <select className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs outline-none text-slate-300">
                  <option value="5">Every 5 Minutes</option>
                  <option value="15">Every 15 Minutes</option>
                  <option value="30">Every 30 Minutes</option>
                  <option value="60">Hourly</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
