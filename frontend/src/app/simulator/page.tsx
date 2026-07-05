"use client";

import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Cpu, Wind, Compass, Gauge, AlertTriangle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { API_BASE_URL } from "@/utils/api";

export default function SimulatorPage() {
  const [params, setParams] = useState({
    electron_flux: 150.0,
    solar_wind_speed: 400.0,
    imf_bz: -1.0,
    plasma_density: 5.0,
    proton_flux: 10.0
  });

  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const fetchSimulation = async (currentParams = params) => {
    try {
      const token = localStorage.getItem("astracast_token");
      const res = await fetch(`${API_BASE_URL}/predict/simulate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(currentParams)
      });
      if (res.ok) {
        const json = await res.json();
        setPredictions(json.predictions);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Run on mount
  useEffect(() => {
    fetchSimulation();
  }, []);

  const handleSliderChange = (name: string, value: number) => {
    const updated = { ...params, [name]: value };
    setParams(updated);
    
    // Debounce API requests slightly to avoid flooding the backend
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      fetchSimulation(updated);
    }, 150);
  };

  const getStormProbabilityText = () => {
    if (predictions.length === 0) return "";
    
    // Find highest storm probability across all horizons
    const maxProbPred = predictions.reduce((max, p) => p.storm_probability > max.storm_probability ? p : max, predictions[0]);
    const percent = (maxProbPred.storm_probability * 100).toFixed(0);
    const horizon = maxProbPred.horizon;
    const category = maxProbPred.expected_radiation_category;
    
    let text = `If Solar Wind increases to ${params.solar_wind_speed.toFixed(0)} km/s and IMF Bz decreases to ${params.imf_bz.toFixed(1)} nT, there is a ${percent}% probability of a Class ${category} Radiation Storm within the next ${horizon}.`;
    return text;
  };

  const activeStorm = predictions.some(p => p.storm_probability > 0.5);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 font-sans">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            AI Scenario Simulator
          </h1>
          <p className="text-slate-400 text-xs mt-1">Adjust sliders to see instant space weather forecasting calculations.</p>
        </div>

        {/* Dynamic Natural Language Narrative Display */}
        <div className={`p-6 border rounded-2xl relative overflow-hidden transition-all duration-300 ${
          activeStorm 
            ? "bg-red-950/20 border-red-800/40 shadow-lg shadow-red-500/5" 
            : "bg-slate-900/30 border-slate-800/80 shadow-md shadow-blue-500/2"
        }`}>
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/40 border border-slate-800 rounded-lg">
            <Sparkles className={`h-3.5 w-3.5 ${activeStorm ? 'text-red-400 animate-pulse' : 'text-blue-400'}`} />
            <span className="text-[9px] uppercase font-mono tracking-widest text-slate-400 font-bold">Predictive Statement</span>
          </div>

          <div className="flex gap-4 items-start pr-12">
            <div className={`p-2.5 rounded-xl shrink-0 ${activeStorm ? 'bg-red-500/10 text-red-400 border border-red-500/10' : 'bg-blue-500/10 text-blue-400 border border-blue-500/10'}`}>
              <AlertTriangle className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-mono font-bold mb-1.5">Simulation Synthesis</p>
              <h2 className="text-sm md:text-base font-semibold leading-relaxed text-slate-200">
                {predictions.length > 0 ? getStormProbabilityText() : "Simulating scenarios..."}
              </h2>
            </div>
          </div>
        </div>

        {/* Slider Controls and Live Results Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Controls Sliders */}
          <div className="lg:col-span-2 bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-6">
            <h3 className="font-semibold text-slate-200 text-xs uppercase tracking-wider font-mono">Parameters Adjustments</h3>
            
            <div className="space-y-6">
              {/* Solar Wind Speed Slider */}
              <div className="space-y-2.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Wind className="h-4 w-4 text-blue-500" />
                    Solar Wind Speed
                  </span>
                  <span className="text-slate-200 font-mono">{params.solar_wind_speed.toFixed(0)} km/s</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="1000"
                  value={params.solar_wind_speed}
                  onChange={(e) => handleSliderChange("solar_wind_speed", parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[9px] text-slate-600 font-mono">
                  <span>Quiet (200)</span>
                  <span>Disturbed (600)</span>
                  <span>Extreme (1000)</span>
                </div>
              </div>

              {/* IMF Bz Slider */}
              <div className="space-y-2.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Compass className="h-4 w-4 text-blue-500" />
                    IMF Bz Component
                  </span>
                  <span className="text-slate-200 font-mono">{params.imf_bz.toFixed(1)} nT</span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="15"
                  step="0.1"
                  value={params.imf_bz}
                  onChange={(e) => handleSliderChange("imf_bz", parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[9px] text-slate-600 font-mono">
                  <span>Southward (-20)</span>
                  <span>Neutral (0)</span>
                  <span>Northward (15)</span>
                </div>
              </div>

              {/* Electron Flux Slider */}
              <div className="space-y-2.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Gauge className="h-4 w-4 text-blue-500" />
                    Electron Flux
                  </span>
                  <span className="text-slate-200 font-mono">{params.electron_flux.toFixed(0)} PFU</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60000"
                  value={params.electron_flux}
                  onChange={(e) => handleSliderChange("electron_flux", parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[9px] text-slate-600 font-mono">
                  <span>Low (10)</span>
                  <span>Alert (1000)</span>
                  <span>Storm (60000)</span>
                </div>
              </div>

              {/* Plasma Density Slider */}
              <div className="space-y-2.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Plasma Density</span>
                  <span className="text-slate-200 font-mono">{params.plasma_density.toFixed(1)} n/cc</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="60"
                  step="0.1"
                  value={params.plasma_density}
                  onChange={(e) => handleSliderChange("plasma_density", parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[9px] text-slate-600 font-mono">
                  <span>Vapor (0.5)</span>
                  <span>Normal (5)</span>
                  <span>Dense (60)</span>
                </div>
              </div>

              {/* Proton Flux Slider */}
              <div className="space-y-2.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Proton Flux</span>
                  <span className="text-slate-200 font-mono">{params.proton_flux.toFixed(0)} PFU</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5000"
                  value={params.proton_flux}
                  onChange={(e) => handleSliderChange("proton_flux", parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[9px] text-slate-600 font-mono">
                  <span>Background (1)</span>
                  <span>Moderate (100)</span>
                  <span>Severe (5000)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recalculated Projections Output */}
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
            <h3 className="font-semibold text-slate-200 text-xs uppercase tracking-wider font-mono flex items-center gap-2">
              <Cpu className="h-4 w-4 text-blue-500" />
              Recalculated Projections
            </h3>

            <div className="space-y-3">
              {predictions.map((p) => (
                <div 
                  key={p.horizon} 
                  className={`p-3 bg-slate-950/40 border rounded-xl flex items-center justify-between transition-colors ${
                    p.storm_probability > 0.5 
                      ? "border-red-900/40 hover:border-red-800/40" 
                      : "border-slate-800/60 hover:border-slate-700/60"
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold text-slate-300 font-mono">{p.horizon} horizon</span>
                    <p className="text-[10px] text-slate-500 capitalize mt-0.5">Confidence: {p.confidence.toFixed(0)}%</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${p.storm_probability > 0.5 ? "text-red-400" : "text-emerald-400"}`}>
                      {(p.storm_probability * 100).toFixed(0)}% Storm
                    </p>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest font-mono">
                      Cat {p.expected_radiation_category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
