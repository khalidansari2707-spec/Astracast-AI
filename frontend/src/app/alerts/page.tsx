"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Bell, CheckCircle2, AlertTriangle, Info, BellOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL } from "@/utils/api";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterUnread, setFilterUnread] = useState(true);

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem("astracast_token");
      const res = await fetch(`${API_BASE_URL}/alerts?unacknowledged_only=${filterUnread}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setAlerts(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [filterUnread]);

  const handleAcknowledge = async (id: number) => {
    try {
      const token = localStorage.getItem("astracast_token");
      const res = await fetch(`${API_BASE_URL}/alerts/${id}/acknowledge`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        // Remove from list or refresh
        setAlerts(prev => prev.filter(a => a.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAcknowledgeAll = async () => {
    try {
      const token = localStorage.getItem("astracast_token");
      const res = await fetch(`${API_BASE_URL}/alerts/acknowledge-all`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setAlerts([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getSeverityStyles = (sev: string) => {
    const map: Record<string, { bg: string, text: string, border: string }> = {
      low: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/15" },
      medium: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/15" },
      high: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/15" },
      critical: { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/20" }
    };
    return map[sev] || map.low;
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 font-sans">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Notification Center
            </h1>
            <p className="text-slate-400 text-xs mt-1">Real-time alerts triggered by threshold deflections and upcoming storm forecasts.</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilterUnread(!filterUnread)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                filterUnread 
                  ? "bg-slate-900 border-slate-800 text-slate-300" 
                  : "bg-blue-600/10 border-blue-500/20 text-blue-400"
              }`}
            >
              {filterUnread ? "Show Read Alerts" : "Show Unread Only"}
            </button>
            
            {alerts.length > 0 && filterUnread && (
              <button
                onClick={handleAcknowledgeAll}
                className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 transition-colors"
              >
                Clear All Alerts
              </button>
            )}
          </div>
        </div>

        {/* Alerts List Container */}
        <div className="bg-slate-900/10 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm min-h-[300px]">
          {loading ? (
            <div className="text-center text-slate-500 text-xs py-12">Loading notifications...</div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <BellOff className="h-10 w-10 text-slate-600 animate-pulse" />
              <div>
                <p className="text-slate-300 font-semibold text-sm">System Quiet</p>
                <p className="text-slate-500 text-xs mt-1">No active warning signals at this time.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {alerts.map((a: any) => {
                  const style = getSeverityStyles(a.severity);
                  return (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className={`p-4 ${style.bg} border ${style.border} rounded-2xl flex items-start justify-between gap-4`}
                    >
                      <div className="flex gap-3">
                        <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${style.text}`} />
                        <div>
                          <p className={`text-xs uppercase font-mono tracking-wider font-bold ${style.text}`}>
                            {a.severity} Severity Alert
                          </p>
                          <p className="text-sm text-slate-200 mt-1 leading-normal">{a.message}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-2">{new Date(a.timestamp).toLocaleString()}</p>
                        </div>
                      </div>

                      {a.acknowledged === false && (
                        <button
                          onClick={() => handleAcknowledge(a.id)}
                          className="px-3 py-1.5 bg-slate-950/40 hover:bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                          title="Acknowledge Alert"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Resolve
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
