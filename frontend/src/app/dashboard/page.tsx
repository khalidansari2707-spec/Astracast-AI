"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Activity, 
  Wind, 
  Compass, 
  Gauge, 
  ShieldAlert, 
  Percent, 
  Clock, 
  Sparkles, 
  HelpCircle, 
  ChevronRight, 
  AlertTriangle 
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState("solar_activity_index");

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("astracast_token");
      const res = await fetch("http://localhost:8000/api/v1/dashboard/summary", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6 animate-pulse">
          <div className="h-10 bg-slate-900/60 border border-slate-800 rounded-xl w-48" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 bg-slate-900/60 border border-slate-800 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-slate-900/60 border border-slate-800 rounded-2xl" />
            <div className="h-96 bg-slate-900/60 border border-slate-800 rounded-2xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const cc = data?.current_conditions || {};
  const stats = data?.stats || {};
  const predictions = data?.predictions || [];
  const chartData = data?.chart_data || [];
  const alerts = data?.recent_alerts || [];
  const countdown = data?.countdown;

  // Format chart timestamp for display
  const formattedChart = chartData.map((d: any) => ({
    ...d,
    time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }));

  const getRiskColor = (score: number) => {
    if (score < 30) return "text-emerald-400";
    if (score < 60) return "text-amber-400";
    if (score < 85) return "text-orange-400";
    return "text-red-400";
  };

  const getRiskGradient = (score: number) => {
    if (score < 30) return "from-emerald-500 to-teal-500";
    if (score < 60) return "from-amber-500 to-orange-500";
    if (score < 85) return "from-orange-500 to-red-500";
    return "from-red-600 to-rose-600";
  };

  const getSeverityBadge = (sev: string) => {
    const map: Record<string, string> = {
      low: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
      medium: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
      high: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
      critical: "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse"
    };
    return map[sev] || map.low;
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              Space Weather Command Center
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            </h1>
            <p className="text-slate-400 text-xs mt-1">Real-time solar wind streams and ionospheric particle observations.</p>
          </div>
          
          {countdown && (
            <div className="flex items-center gap-3 px-4 py-2 bg-red-950/20 border border-red-800/30 rounded-xl">
              <AlertTriangle className="h-4 w-4 text-red-400 animate-bounce" />
              <div>
                <p className="text-[10px] uppercase font-mono tracking-wider text-red-400 font-bold">Storm Countdown</p>
                <p className="text-xs font-semibold text-slate-200">
                  {countdown.category} Peak forecast at {new Date(countdown.peak_time).toLocaleTimeString()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Top Key KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Solar Activity Index */}
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700/80 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Solar Index</span>
              <Activity className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-semibold text-slate-100">{cc.solar_activity_index?.toFixed(2)}</p>
            <p className="text-[10px] text-slate-500 mt-1">Current ionospheric load value</p>
          </div>

          {/* Solar Wind Speed */}
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700/80 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Solar Wind Speed</span>
              <Wind className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-semibold text-slate-100">{cc.solar_wind_speed?.toFixed(1)} <span className="text-sm font-normal text-slate-500">km/s</span></p>
            <p className="text-[10px] text-slate-500 mt-1">IMF propagation speed</p>
          </div>

          {/* Electron Flux */}
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700/80 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Electron Flux</span>
              <Gauge className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-semibold text-slate-100">{cc.electron_flux?.toFixed(1)} <span className="text-sm font-normal text-slate-500">PFU</span></p>
            <p className="text-[10px] text-slate-500 mt-1">GOES Electron detector band</p>
          </div>

          {/* IMF Bz */}
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700/80 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">IMF Bz</span>
              <Compass className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-semibold text-slate-100">{cc.imf_bz?.toFixed(2)} <span className="text-sm font-normal text-slate-500">nT</span></p>
            <p className={`text-[10px] mt-1 ${cc.imf_bz < 0 ? 'text-red-400' : 'text-slate-500'}`}>
              {cc.imf_bz < 0 ? 'Southward deflection' : 'Northward deflection'}
            </p>
          </div>
        </div>

        {/* Central Dashboard Analytics Visualizers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart Area */}
          <div className="lg:col-span-2 bg-slate-900/20 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-slate-200">Space Weather Timeline</h3>
                <p className="text-[10px] text-slate-500">Historical observations merged with 7-day AI projections</p>
              </div>
              <div className="flex gap-2 bg-slate-950/60 p-1 rounded-xl border border-slate-800/60">
                {[
                  { id: "solar_activity_index", label: "Index" },
                  { id: "solar_wind_speed", label: "Wind" },
                  { id: "electron_flux", label: "Electron" },
                  { id: "imf_bz", label: "Bz" }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveMetric(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeMetric === tab.id 
                        ? "bg-slate-800 text-white shadow-sm" 
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedChart}>
                  <defs>
                    <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#475569" 
                    fontSize={10}
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="#475569" 
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#cbd5e1',
                      fontSize: '11px'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey={activeMetric} 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorMetric)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk Level Gauges & Active Warnings */}
          <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm flex flex-col gap-6">
            <div>
              <h3 className="font-semibold text-slate-200">Alert Center & Risk Profile</h3>
              <p className="text-[10px] text-slate-500">Live forecasting metrics</p>
            </div>

            {/* Risk Progress Circle */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="relative h-28 w-28 flex items-center justify-center">
                <svg className="absolute w-full h-full transform -rotate-90">
                  <circle cx="56" cy="56" r="48" stroke="#1e293b" strokeWidth="6" fill="transparent" />
                  <circle cx="56" cy="56" r="48" stroke="url(#riskGrad)" strokeWidth="8" strokeDasharray="301" strokeDashoffset={301 - (301 * stats.risk_score) / 100} fill="transparent" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="riskGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="text-center">
                  <p className={`text-2xl font-bold ${getRiskColor(stats.risk_score)}`}>{stats.risk_score?.toFixed(0)}%</p>
                  <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold font-mono">Storm Risk</p>
                </div>
              </div>
              
              <div className="flex gap-8 mt-5 text-center">
                <div>
                  <p className="text-xs font-semibold text-slate-200">{stats.avg_confidence?.toFixed(1)}%</p>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">Confidence</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">{alerts.length}</p>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">Active Alerts</p>
                </div>
              </div>
            </div>

            {/* Recent Warnings */}
            <div className="flex-1 flex flex-col gap-3 min-h-[160px]">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Active Signals</span>
              {alerts.length === 0 ? (
                <div className="flex-1 flex items-center justify-center bg-slate-950/20 border border-slate-900/60 rounded-xl p-4 text-center">
                  <p className="text-slate-500 text-xs">No warning flags or storms detected.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts.map((a: any) => (
                    <div key={a.id} className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl flex gap-2.5 items-start">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider mt-0.5 shrink-0 ${getSeverityBadge(a.severity)}`}>
                        {a.severity}
                      </span>
                      <p className="text-xs text-slate-300 leading-normal">{a.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Prediction Cards Grid */}
        <div className="flex flex-col gap-4">
          <h3 className="font-semibold text-slate-200">AI Horizon Projections</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {predictions.map((p: any) => (
              <motion.div
                key={p.horizon}
                whileHover={{ y: -4 }}
                className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between min-h-[190px] hover:border-slate-700/80 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-300 font-mono">{p.horizon} horizon</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      p.expected_radiation_category === "S0" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10" : "bg-red-500/10 text-red-400 border border-red-500/10 animate-pulse"
                    }`}>
                      {p.expected_radiation_category}
                    </span>
                  </div>
                  
                  <div className="space-y-1 mt-1">
                    <p className="text-xs text-slate-500">Storm Probability</p>
                    <p className="text-lg font-bold text-white">{(p.storm_probability * 100).toFixed(0)}%</p>
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-slate-800/60 pt-3 mt-4 text-[10px] text-slate-400">
                  <div className="flex justify-between">
                    <span>Wind:</span>
                    <span className="text-slate-300 font-semibold">{p.expected_solar_wind_speed?.toFixed(0)} km/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Electron:</span>
                    <span className="text-slate-300 font-semibold">{p.expected_electron_flux?.toFixed(0)} PFU</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
