"use client";

import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { FileDown, FileSpreadsheet, FileText, CheckCircle, Info } from "lucide-react";
import { API_BASE_URL } from "@/utils/api";

export default function ReportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (format: string) => {
    setDownloading(format);
    try {
      const token = localStorage.getItem("astracast_token");
      const res = await fetch(`${API_BASE_URL}/reports/download/${format}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Report generation failed.");

      // Trigger download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      const ext = format === "excel" ? "xlsx" : format;
      a.download = `astracast_forecast_report_${new Date().toISOString().split('T')[0]}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Failed to download report.");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 font-sans">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Report Generator
          </h1>
          <p className="text-slate-400 text-xs mt-1">Compile and download operational space weather forecast reports.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* PDF Report Card */}
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between min-h-[220px]">
            <div>
              <div className="p-3 bg-red-500/10 text-red-400 rounded-xl border border-red-500/15 w-fit mb-4">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-slate-200">Analytical PDF Report</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Contains executive summaries, tables of predictions, model confidence ratings, and operator action items.
              </p>
            </div>
            
            <button
              onClick={() => handleDownload("pdf")}
              disabled={downloading !== null}
              className="mt-6 w-full py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-800 transition-colors"
            >
              {downloading === "pdf" ? "Compiling..." : "Export PDF Document"}
              <FileDown className="h-4 w-4" />
            </button>
          </div>

          {/* Excel Spreadsheet Card */}
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between min-h-[220px]">
            <div>
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/15 w-fit mb-4">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-slate-200">Operations Excel Matrix</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Complete structured matrix of predictions and confidence scores for spreadsheets and analytics import.
              </p>
            </div>
            
            <button
              onClick={() => handleDownload("excel")}
              disabled={downloading !== null}
              className="mt-6 w-full py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-800 transition-colors"
            >
              {downloading === "excel" ? "Compiling..." : "Export Excel Spreadsheet"}
              <FileDown className="h-4 w-4" />
            </button>
          </div>

          {/* CSV File Card */}
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between min-h-[220px]">
            <div>
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/15 w-fit mb-4">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-slate-200">Raw Predictions CSV</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Flat comma-separated file representing raw prediction vectors, perfect for ingestion into automated cron engines.
              </p>
            </div>
            
            <button
              onClick={() => handleDownload("csv")}
              disabled={downloading !== null}
              className="mt-6 w-full py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-800 transition-colors"
            >
              {downloading === "csv" ? "Compiling..." : "Export CSV File"}
              <FileDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Info panel */}
        <div className="p-4 bg-blue-950/20 border border-blue-900/35 rounded-2xl flex gap-3 text-xs text-slate-400">
          <Info className="h-5 w-5 text-blue-400 shrink-0" />
          <div className="leading-relaxed">
            All generated reports pull the most recent active forecast run stored in the SQLite metadata storage layer.
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
