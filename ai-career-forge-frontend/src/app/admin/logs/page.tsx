"use client";

import { useState } from "react";
import { 
  Activity, Search, Filter, Clock, AlertTriangle, 
  Shield, Database, User as UserIcon, Terminal,
  ChevronRight, RefreshCcw, Download
} from "lucide-react";

export default function AdminLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const logs = [
    { id: "LOG-9482", type: "AUTH", severity: "INFO", message: "User session initialized for entity: operative@zenith.ai", actor: " operative@zenith.ai", timestamp: "2026-05-03 12:45:12" },
    { id: "LOG-9483", type: "SECURITY", severity: "WARN", message: "Multiple failed login attempts detected from IP: 192.168.1.1", actor: "System-Guard", timestamp: "2026-05-03 12:42:05" },
    { id: "LOG-9484", type: "JOBS", severity: "INFO", message: "New mission deployed: 'Senior AI Engineer' by Recruiter: tech-lead@globex.com", actor: "tech-lead@globex.com", timestamp: "2026-05-03 12:38:44" },
    { id: "LOG-9485", type: "SYSTEM", severity: "CRITICAL", message: "Database connection latency exceeded 500ms in Region: ASIA-South", actor: "Root-Monitor", timestamp: "2026-05-03 12:30:00" },
    { id: "LOG-9486", type: "AUTH", severity: "INFO", message: "New user registered with role: RECRUITER", actor: "New-User", timestamp: "2026-05-03 12:15:22" },
    { id: "LOG-9487", type: "SYSTEM", severity: "INFO", message: "Cache invalidated for JobRecommendationEngine", actor: "Scheduled-Task", timestamp: "2026-05-03 12:00:01" },
    { id: "LOG-9488", type: "SECURITY", severity: "INFO", message: "Privileged Access Key rotated for ADMIN user", actor: "Security-Officer", timestamp: "2026-05-03 11:45:33" },
  ];

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500 text-white border-transparent';
      case 'WARN': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'ERROR': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SECURITY': return <Shield className="w-3.5 h-3.5" />;
      case 'JOBS': return <Terminal className="w-3.5 h-3.5" />;
      case 'DATABASE': return <Database className="w-3.5 h-3.5" />;
      default: return <Activity className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Activity Stream</h1>
          <p className="text-muted-foreground font-medium">Real-time audit trail of all global operations and security events.</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="p-4 bg-secondary rounded-2xl hover:bg-border transition-all">
              <RefreshCcw className="w-5 h-5" />
           </button>
           <button className="bg-foreground text-background px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:opacity-90 shadow-xl shadow-foreground/10 transition-all">
              <Download className="w-4 h-4" /> Export Audit Trail
           </button>
        </div>
      </header>

      {/* Stats QuickView */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: "Total Events", val: "1,248", color: "text-foreground" },
           { label: "Critical Intercepts", val: "2", color: "text-red-500" },
           { label: "Security Warnings", val: "14", color: "text-orange-500" },
           { label: "System Uptime", val: "99.9%", color: "text-blue-500" },
         ].map((stat, i) => (
           <div key={i} className="bg-card border border-border p-6 rounded-3xl">
              <p className={`text-2xl font-black ${stat.color}`}>{stat.val}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</p>
           </div>
         ))}
      </div>

      {/* Log Terminal */}
      <div className="bg-card border border-border rounded-[40px] overflow-hidden shadow-2xl">
         <div className="px-8 py-6 border-b border-border bg-secondary/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-xl">
                  <Filter className="w-3 h-3 text-muted-foreground" />
                  <select className="bg-transparent text-[10px] font-black uppercase tracking-widest focus:outline-none cursor-pointer">
                     <option>All Sources</option>
                     <option>Auth</option>
                     <option>Security</option>
                     <option>Jobs</option>
                  </select>
               </div>
               <div className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-xl">
                  <select className="bg-transparent text-[10px] font-black uppercase tracking-widest focus:outline-none cursor-pointer">
                     <option>All Severities</option>
                     <option>Critical</option>
                     <option>Warn</option>
                  </select>
               </div>
            </div>
            <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
               <input 
                 type="text" 
                 placeholder="Search logs (Message, ID, Actor)..."
                 className="bg-background border border-border rounded-xl pl-12 pr-6 py-2.5 text-xs font-bold w-full md:w-80 focus:ring-1 focus:ring-foreground/10 transition-all focus:outline-none"
               />
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
               <thead>
                  <tr className="border-b border-border">
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Timestamp</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Entity Type</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Event Payload</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Executioner</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-border">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-secondary/5 transition-colors group">
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                             <Clock className="w-3.5 h-3.5" /> {log.timestamp}
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                             <div className="p-2 bg-secondary rounded-lg">
                                {getTypeIcon(log.type)}
                             </div>
                             <span className="text-[10px] font-black uppercase tracking-widest">{log.type}</span>
                          </div>
                       </td>
                       <td className="px-8 py-6 max-w-md">
                          <div className="flex flex-col gap-1.5">
                             <span className={`self-start text-[9px] font-black px-2 py-0.5 rounded-md border ${getSeverityStyles(log.severity)}`}>
                                {log.severity}
                             </span>
                             <p className="text-sm font-medium leading-relaxed">{log.message}</p>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground">
                             <UserIcon className="w-3 h-3" /> {log.actor}
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
