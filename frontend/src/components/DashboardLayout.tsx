"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Play, 
  Cpu, 
  BarChart3, 
  History, 
  Database, 
  FileSpreadsheet, 
  Bell, 
  Settings, 
  ShieldAlert, 
  LogOut, 
  User,
  Activity,
  Menu,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL } from "@/utils/api";
import { isMockMode } from "@/utils/mockApi";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [alertsCount, setAlertsCount] = useState(0);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    setIsDemoMode(isMockMode());
    const token = localStorage.getItem("astracast_token");
    const storedRole = localStorage.getItem("astracast_role");
    const storedUser = localStorage.getItem("astracast_user");
    
    if (!token) {
      router.push("/");
    } else {
      setRole(storedRole);
      setUsername(storedUser);
      fetchAlertsCount();
    }
  }, [router]);

  const fetchAlertsCount = async () => {
    try {
      const token = localStorage.getItem("astracast_token");
      const res = await fetch(`${API_BASE_URL}/alerts?unacknowledged_only=true`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAlertsCount(data.length);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("astracast_token");
    localStorage.removeItem("astracast_role");
    localStorage.removeItem("astracast_user");
    router.push("/");
  };

  const menuItems = [
    { name: "Live Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "operator", "researcher"] },
    { name: "Run Prediction", href: "/predict", icon: Play, roles: ["admin", "operator"] },
    { name: "Scenario Simulator", href: "/simulator", icon: Cpu, roles: ["admin", "operator", "researcher"] },
    { name: "Analytics & ML", href: "/analytics", icon: BarChart3, roles: ["admin", "operator", "researcher"] },
    { name: "Prediction History", href: "/history", icon: History, roles: ["admin", "operator", "researcher"] },
    { name: "Dataset Manager", href: "/data", icon: Database, roles: ["admin", "operator", "researcher"] },
    { name: "Report Generator", href: "/reports", icon: FileSpreadsheet, roles: ["admin", "operator", "researcher"] },
    { name: "Notifications", href: "/alerts", icon: Bell, roles: ["admin", "operator", "researcher"], badge: alertsCount > 0 ? alertsCount : undefined },
    { name: "System Settings", href: "/settings", icon: Settings, roles: ["admin", "operator", "researcher"] },
    { name: "Admin Portal", href: "/admin", icon: ShieldAlert, roles: ["admin"] },
  ];

  const filteredMenu = menuItems.filter(item => role && item.roles.includes(role));

  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 overflow-hidden font-sans">
      {/* Particle Aurora background */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-950/20 via-slate-950/90 to-[#020617] z-0" />
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none z-0 animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-purple-900/5 blur-[120px] pointer-events-none z-0" />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-800/60 bg-slate-950/40 backdrop-blur-md z-10">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800/40">
          <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-lg shadow-lg shadow-blue-500/20">
            <Activity className="h-5 w-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="font-semibold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              AstraCast AI
            </h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Space Weather Platform</p>
            {isDemoMode && (
              <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                ⚡ Demo Mode
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {filteredMenu.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <span className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  active 
                    ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 shadow-inner" 
                    : "text-slate-400 hover:bg-slate-800/30 hover:text-slate-200 border border-transparent"
                }`}>
                  <span className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${active ? "text-blue-400" : "text-slate-400"}`} />
                    {item.name}
                  </span>
                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-full min-w-[18px] text-center">
                      {item.badge}
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User profile footer */}
        <div className="p-4 border-t border-slate-800/40 bg-slate-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                <User className="h-4 w-4 text-slate-300" />
              </div>
              <div className="truncate max-w-[120px]">
                <p className="text-xs font-semibold text-slate-200 truncate">{username}</p>
                <p className="text-[10px] text-slate-500 font-mono capitalize">{role}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-slate-400 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b border-slate-800/60 bg-slate-950/60 backdrop-blur-md flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-blue-500" />
          <span className="font-semibold text-white tracking-tight">AstraCast AI</span>
          {isDemoMode && (
            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
              Demo
            </span>
          )}
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 hover:bg-slate-800 rounded-lg">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="lg:hidden fixed inset-y-0 left-0 w-64 bg-slate-950/95 backdrop-blur-lg border-r border-slate-800 z-30 flex flex-col pt-16"
          >
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {filteredMenu.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                    <span className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      active ? "bg-blue-600/15 text-blue-400" : "text-slate-400 hover:bg-slate-800/30"
                    }`}>
                      <span className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        {item.name}
                      </span>
                      {item.badge !== undefined && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-200">{username}</p>
                  <p className="text-[10px] text-slate-500 capitalize">{role}</p>
                </div>
                <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-400 rounded-lg">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto z-10 pt-16 lg:pt-0">
        <div className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
