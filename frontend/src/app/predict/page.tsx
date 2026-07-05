"use client";

import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Play, Sparkles, AlertCircle, CheckCircle, Database } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL } from "@/utils/api";

export default function PredictPage() {
  const [formData, setFormData] = useState({
    electron_flux: 150.0,
    proton_flux: 10.0,
    solar_wind_speed: 400.0,
    imf_bz: -1.0,
    density: 5.0,
    magnetic_field: 4.0,
    xray_flux: 0.05,
    solar_activity_index: 1.2,
    prediction_horizon: "24h"
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [predictionResults, setPredictionResults] = useState<any[] | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "prediction_horizon" ? value : parseFloat(value) || 0.0
    }));
  };

  const handleAutofill = () => {
    // Fills with highly active flare data for simulation
    setFormData({
      electron_flux: 12500.0,
      proton_flux: 840.0,
      solar_wind_speed: 780.0,
      imf_bz: -12.5,
      density: 42.0,
      magnetic_field: 28.0,
      xray_flux: 1.8,
      solar_activity_index: 5.4,
      prediction_horizon: "24h"
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setPredictionResults(null);

    try {
      const token = localStorage.getItem("astracast_token");
      const res = await fetch(`${API_BASE_URL}/predict/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || "Forecasting failed.");
      }

      const json = await res.json();
      setSuccess("Space weather forecast generated and logs saved successfully.");
      setPredictionResults(json.predictions);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Observation Entry Console
          </h1>
          <p className="text-slate-400 text-xs mt-1">Manual entry of latest satellite telemetry data for running fresh predictions.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Form Container */}
          <div className="lg:col-span-2 bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-slate-200 text-sm uppercase tracking-wider font-mono">Telemetry Data</h2>
              <button 
                type="button"
                onClick={handleAutofill}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="h-3 w-3 text-yellow-400" />
                Simulate Solar Flare
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Electron Flux */}
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2 font-mono">Electron Flux (PFU)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="electron_flux"
                    value={formData.electron_flux}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl focus:border-blue-500 text-sm outline-none text-slate-100 placeholder-slate-700"
                  />
                </div>

                {/* Proton Flux */}
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2 font-mono">Proton Flux (PFU)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="proton_flux"
                    value={formData.proton_flux}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl focus:border-blue-500 text-sm outline-none text-slate-100"
                  />
                </div>

                {/* Solar Wind Speed */}
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2 font-mono">Solar Wind Speed (km/s)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="solar_wind_speed"
                    value={formData.solar_wind_speed}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl focus:border-blue-500 text-sm outline-none text-slate-100"
                  />
                </div>

                {/* IMF Bz */}
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2 font-mono">IMF Bz Component (nT)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="imf_bz"
                    value={formData.imf_bz}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl focus:border-blue-500 text-sm outline-none text-slate-100"
                  />
                </div>

                {/* Plasma Density */}
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2 font-mono">Plasma Density (n/cc)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="density"
                    value={formData.density}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl focus:border-blue-500 text-sm outline-none text-slate-100"
                  />
                </div>

                {/* Magnetic Field */}
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2 font-mono">Magnetic Field Bt (nT)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="magnetic_field"
                    value={formData.magnetic_field}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl focus:border-blue-500 text-sm outline-none text-slate-100"
                  />
                </div>

                {/* X-Ray Flux */}
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2 font-mono">X-Ray Flux (Watts/m²)</label>
                  <input
                    type="number"
                    step="0.0001"
                    name="xray_flux"
                    value={formData.xray_flux}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl focus:border-blue-500 text-sm outline-none text-slate-100"
                  />
                </div>

                {/* Solar Activity Index */}
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2 font-mono">Solar Activity Index</label>
                  <input
                    type="number"
                    step="0.01"
                    name="solar_activity_index"
                    value={formData.solar_activity_index}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl focus:border-blue-500 text-sm outline-none text-slate-100"
                  />
                </div>
              </div>

              {/* Status and Action Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-800/60">
                <div className="text-xs text-slate-500 font-mono">
                  All observations will be appended to the sqlite database.
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 group transition-all"
                >
                  {loading ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-white" />
                      Run Space Weather Forecast
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Results / Feedback Area */}
          <div className="flex flex-col gap-6">
            {/* Status updates */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-3 text-xs text-red-400"
                >
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">Execution Aborted</p>
                    <p>{error}</p>
                  </div>
                </motion.div>
              )}

              {success && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex gap-3 text-xs text-emerald-400"
                >
                  <CheckCircle className="h-5 w-5 shrink-0 animate-bounce" />
                  <div>
                    <p className="font-semibold mb-1">Forecast Generated</p>
                    <p>{success}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Prediction results detail list */}
            {predictionResults && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-4"
              >
                <h3 className="font-semibold text-slate-200 text-xs uppercase tracking-wider font-mono flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-500" />
                  Live Output
                </h3>
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {predictionResults.map((p: any) => (
                    <div key={p.horizon} className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-300">{p.horizon} horizon</span>
                        <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold">{p.expected_radiation_category}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                        <div>Risk: <span className="text-slate-200 font-bold">{(p.storm_probability*100).toFixed(0)}%</span></div>
                        <div>Conf: <span className="text-slate-200 font-bold">{p.confidence.toFixed(1)}%</span></div>
                      </div>
                      <p className="text-[10px] text-slate-500 italic leading-normal border-t border-slate-900 pt-2">{p.explanation}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
