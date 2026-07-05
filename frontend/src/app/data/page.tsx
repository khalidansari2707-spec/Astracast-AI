"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Upload, Database, RefreshCw, Trash2, CheckCircle, AlertTriangle, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { API_BASE_URL } from "@/utils/api";

export default function DataPage() {
  const [file, setFile] = useState<File | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("astracast_token");
      const res = await fetch(`${API_BASE_URL}/data/statistics`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setStats(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError(null);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("astracast_token");
      const res = await fetch(`${API_BASE_URL}/data/upload`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || "Upload failed.");
      }

      const json = await res.json();
      setMessage(json.message);
      setFile(null);
      fetchStats();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleClean = async () => {
    setMessage(null);
    setError(null);
    try {
      const token = localStorage.getItem("astracast_token");
      const res = await fetch(`${API_BASE_URL}/data/clean`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setMessage(json.message);
        fetchStats();
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleClear = async () => {
    if (!confirm("Are you sure you want to delete all space weather datasets? This action is irreversible.")) {
      return;
    }
    setMessage(null);
    setError(null);
    try {
      const token = localStorage.getItem("astracast_token");
      const res = await fetch(`${API_BASE_URL}/data/clear`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setMessage(json.message);
        fetchStats();
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 font-sans">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Dataset Management
          </h1>
          <p className="text-slate-400 text-xs mt-1">Upload, audit, clean, and manage historical space weather training records.</p>
        </div>

        {/* Action Feedbacks */}
        {(message || error) && (
          <div className="space-y-2">
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
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* File Upload Console */}
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-5">
            <h2 className="font-semibold text-slate-200 text-xs uppercase tracking-wider font-mono">Upload New Dataset</h2>
            
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="border border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-6 text-center cursor-pointer transition-colors relative group">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.json"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="h-8 w-8 text-slate-500 mx-auto mb-3 group-hover:text-blue-500 transition-colors" />
                <span className="text-xs font-semibold text-slate-300 block mb-1">
                  {file ? file.name : "Select data file"}
                </span>
                <span className="text-[10px] text-slate-500 block">CSV, Excel, or JSON format. Max 50MB.</span>
              </div>

              <button
                type="submit"
                disabled={!file || uploading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-850 disabled:text-slate-600 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
              >
                {uploading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Database className="h-4 w-4" />
                    Ingest Dataset
                  </>
                )}
              </button>
            </form>

            <div className="border-t border-slate-800/60 pt-5 space-y-3">
              <h3 className="font-semibold text-slate-200 text-xs uppercase tracking-wider font-mono">Dataset Operations</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleClean}
                  className="py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-800/60 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Clean & Impute
                </button>
                <button
                  onClick={handleClear}
                  className="py-2.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-red-900/30 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear Table
                </button>
              </div>
            </div>
          </div>

          {/* Dataset Statistics summary */}
          <div className="lg:col-span-2 bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col gap-5">
            <h2 className="font-semibold text-slate-200 text-xs uppercase tracking-wider font-mono">Dataset Summary Statistics</h2>

            {loading ? (
              <div className="p-8 text-center text-slate-500 text-xs">Computing stats...</div>
            ) : !stats || stats.count === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">Dataset is empty. Upload CSVs to populate.</div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-950/40 border border-slate-850 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/10">
                      <Database className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Total Database Records</p>
                      <p className="text-lg font-bold text-slate-200">{stats.count}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/10 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Active & Clean
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.keys(stats.summary).slice(0, 4).map((key) => {
                    const item = stats.summary[key];
                    return (
                      <div key={key} className="p-4 bg-slate-950/20 border border-slate-850/60 rounded-xl space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono truncate block">
                          {key.replace(/_/g, " ")}
                        </span>
                        <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-500 pt-1">
                          <div>
                            <span className="block text-[8px] uppercase font-mono">Mean</span>
                            <span className="text-slate-200 font-bold">{item.mean?.toFixed(1)}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] uppercase font-mono">Min</span>
                            <span className="text-slate-200 font-bold">{item.min?.toFixed(1)}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] uppercase font-mono">Max</span>
                            <span className="text-slate-200 font-bold">{item.max?.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
