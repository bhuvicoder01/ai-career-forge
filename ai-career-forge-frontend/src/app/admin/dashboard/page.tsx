"use client";

import { 
  Users, Server, AlertTriangle, Shield, TrendingUp, 
  ArrowUp, ArrowDown, Activity, Globe, Cpu
} from "lucide-react";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/admin/stats");
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch admin stats", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const metrics = [
    { label: "Total Nodes (Users)", value: stats?.totalUsers || "0", change: "+5%", trend: "up", icon: Users },
    { label: "Active Connections", value: stats?.totalApplications || "0", change: "+12%", trend: "up", icon: Activity },
    { label: "System Uptime", value: "99.98%", change: "Stable", trend: "neutral", icon: Server },
    { label: "Security Events", value: "2", change: "Stable", trend: "neutral", icon: Shield },
  ];

  const recentUsers = [
    { id: 1, user: "john.doe@email.com", role: "USER", status: "Active", origin: "US-West" },
    { id: 2, user: "hiring@techcorp.com", role: "RECRUITER", status: "Pending", origin: "EU-Central" },
    { id: 3, user: "admin.aux@zenith.ai", role: "ADMIN", status: "Active", origin: "Root-Local" },
    { id: 4, user: "jane.smith@jobseek.com", role: "USER", status: "Suspended", origin: "ASIA-South" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-4xl font-black uppercase tracking-tighter mb-1">System Oversight</h1>
           <p className="text-muted-foreground font-medium text-sm flex items-center gap-2">
              <Globe className="w-4 h-4" /> Global Infrastructure Management
           </p>
        </div>
        <div className="flex items-center gap-2">
           <div className="px-4 py-2 bg-secondary rounded-xl border border-border flex items-center gap-2">
              <Cpu className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-black uppercase tracking-widest">Load: 42%</span>
           </div>
           <button className="bg-foreground text-background px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 shadow-xl transition-all">
             Initialize Protocol
           </button>
        </div>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {metrics.map((m, i) => (
          <div key={i} className="bg-card border border-border p-6 rounded-3xl relative group">
             <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-secondary rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                   <m.icon className="w-5 h-5" />
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-black uppercase ${
                  m.trend === 'up' ? 'text-green-500' : m.trend === 'down' ? 'text-red-500' : 'text-muted-foreground'
                }`}>
                   {m.trend === 'up' ? <ArrowUp className="w-3 h-3" /> : m.trend === 'down' ? <ArrowDown className="w-3 h-3" /> : null}
                   {m.change}
                </div>
             </div>
             <div>
                <p className="text-2xl font-black">{m.value}</p>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{m.label}</p>
             </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
         {/* User Management */}
         <div className="bg-card border border-border rounded-3xl overflow-hidden">
            <div className="px-8 py-6 border-b border-border flex items-center justify-between">
               <h2 className="text-lg font-black uppercase tracking-tight">Identity Directory</h2>
               <button className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:underline">Manage All Users</button>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-secondary/20">
                     <tr>
                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Entity</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Authorization</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Origin</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                     {recentUsers.map((u) => (
                       <tr key={u.id} className="hover:bg-secondary/5 transition-colors group">
                          <td className="px-8 py-5">
                             <p className="text-sm font-black">{u.user}</p>
                             <span className={`text-[9px] font-black uppercase tracking-widest ${
                               u.status === 'Active' ? 'text-green-500' : u.status === 'Pending' ? 'text-orange-500' : 'text-red-500'
                             }`}>{u.status}</span>
                          </td>
                          <td className="px-8 py-5">
                             <span className="text-[10px] font-black uppercase tracking-widest bg-secondary px-2.5 py-1 rounded-lg border border-border">
                                {u.role}
                             </span>
                          </td>
                          <td className="px-8 py-5 text-xs text-muted-foreground font-medium">{u.origin}</td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         {/* Alerts & System Health */}
         <div className="space-y-6">
            <div className="bg-red-500/5 border border-red-500/20 p-8 rounded-3xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                  <AlertTriangle className="w-32 h-32 text-red-500" />
               </div>
               <h3 className="text-red-500 text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4" /> Priority Intercepts
               </h3>
               <div className="space-y-4">
                  <div className="flex items-start gap-3 bg-white/5 p-4 rounded-2xl border border-red-500/10">
                     <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 shrink-0 animate-pulse"></div>
                     <div>
                        <p className="text-sm font-black text-foreground">Anomalous Login Pattern</p>
                        <p className="text-xs text-muted-foreground">Detected 12 failed attempts on UID: 9482 from IP 192.168.1.1</p>
                     </div>
                  </div>
                  <div className="flex items-start gap-3 bg-white/5 p-4 rounded-2xl border border-red-500/10">
                     <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 shrink-0 animate-pulse"></div>
                     <div>
                        <p className="text-sm font-black text-foreground">Latency Threshold Breached</p>
                        <p className="text-xs text-muted-foreground">API response time increased to 450ms in Region: ASIA-South</p>
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-card border border-border p-8 rounded-3xl shadow-sm">
               <h3 className="text-sm font-black uppercase tracking-widest mb-6">Resource Allocation</h3>
               <div className="space-y-6">
                  {[
                    { label: "Storage Capacity", val: 78, color: "bg-blue-500" },
                    { label: "Memory Usage", val: 42, color: "bg-green-500" },
                    { label: "Network Bandwidth", val: 65, color: "bg-purple-500" }
                  ].map((r, i) => (
                    <div key={i} className="space-y-2">
                       <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                          <span className="text-muted-foreground">{r.label}</span>
                          <span>{r.val}%</span>
                       </div>
                       <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className={`h-full ${r.color} rounded-full`} style={{ width: `${r.val}%` }}></div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
