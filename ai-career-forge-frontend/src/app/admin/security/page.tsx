"use client";

import { useState } from "react";
import { 
  ShieldAlert, Lock, ShieldCheck, Key, Globe, 
  Activity, Zap, Eye, AlertTriangle, Shield,
  RefreshCw, PlusCircle, Trash2
} from "lucide-react";

export default function AdminSecurity() {
  const [isFirewallActive, setIsFirewallActive] = useState(true);
  
  const securityStats = [
    { label: "Threats Mitigated", val: "4,291", color: "text-green-500", icon: ShieldCheck },
    { label: "Active Blocked IPs", val: "128", color: "text-red-500", icon: Globe },
    { label: "Encryption Strength", val: "AES-256", color: "text-blue-500", icon: Lock },
    { label: "Auth Failures (24h)", val: "14", color: "text-orange-500", icon: AlertTriangle },
  ];

  const apiKeys = [
    { id: 1, name: "Public Job Search", key: "zenith_pk_••••••••••••••••", status: "Active", used: "2.4k calls" },
    { id: 2, name: "Internal Analysis", key: "zenith_sk_••••••••••••••••", status: "Restricted", used: "842 calls" },
    { id: 3, name: "Legacy Bridge", key: "zenith_pk_••••••••••••••••", status: "Inactive", used: "0 calls" },
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Access Protocols</h1>
          <p className="text-muted-foreground font-medium">Manage global security perimeter and cryptographic assets.</p>
        </div>
        <div className="flex items-center gap-4">
           <div className={`px-5 py-2.5 rounded-2xl border flex items-center gap-3 transition-all ${isFirewallActive ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
              <Shield className={`w-5 h-5 ${isFirewallActive ? 'animate-pulse' : ''}`} />
              <span className="text-xs font-black uppercase tracking-widest">Global Firewall: {isFirewallActive ? 'Shield Active' : 'Offline'}</span>
           </div>
        </div>
      </header>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         {securityStats.map((stat, i) => (
           <div key={i} className="bg-card border border-border p-8 rounded-[40px] shadow-sm group hover:shadow-2xl transition-all">
              <div className={`p-4 rounded-2xl bg-secondary mb-6 w-fit group-hover:scale-110 transition-transform`}>
                 <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <p className="text-3xl font-black uppercase tracking-tighter">{stat.val}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">{stat.label}</p>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
         {/* API Key Management */}
         <div className="xl:col-span-2 space-y-8">
            <section className="bg-card border border-border rounded-[40px] overflow-hidden shadow-2xl">
               <div className="px-8 py-6 border-b border-border bg-secondary/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <Key className="w-5 h-5 text-blue-500" />
                     <h2 className="text-lg font-black uppercase tracking-tight">Active API Protocols</h2>
                  </div>
                  <button className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all">
                     <PlusCircle className="w-4 h-4" /> Generate Key
                  </button>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[600px]">
                     <thead className="bg-secondary/10 border-b border-border">
                        <tr>
                           <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Protocol Name</th>
                           <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Access Key</th>
                           <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Usage</th>
                           <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Action</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-border">
                        {apiKeys.map((key) => (
                           <tr key={key.id} className="hover:bg-secondary/5 transition-colors">
                              <td className="px-8 py-5">
                                 <p className="text-sm font-black uppercase">{key.name}</p>
                                 <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${key.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{key.status}</span>
                              </td>
                              <td className="px-8 py-5">
                                 <code className="text-xs bg-secondary/50 px-3 py-2 rounded-lg font-mono text-muted-foreground">{key.key}</code>
                              </td>
                              <td className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase">{key.used}</td>
                              <td className="px-8 py-5">
                                 <button className="p-3 rounded-xl bg-background border border-border hover:bg-red-500/10 hover:text-red-500 transition-all">
                                    <Trash2 className="w-4 h-4" />
                                 </button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </section>
         </div>

         {/* Security Settings Sidebar */}
         <div className="space-y-8">
            <section className="bg-card border border-border rounded-[40px] p-8 shadow-sm space-y-8">
               <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-orange-500" /> Defense Toggles
               </h3>
               <div className="space-y-6">
                  {[
                    { label: "IP Rate Limiting", enabled: true },
                    { label: "SQL Injection Guard", enabled: true },
                    { label: "XSS Sanitation", enabled: true },
                    { label: "Brute Force Lock", enabled: false },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                       <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                       <button className={`w-10 h-5 rounded-full relative transition-all ${item.enabled ? 'bg-blue-600' : 'bg-muted'}`}>
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${item.enabled ? 'right-1' : 'left-1'}`}></div>
                       </button>
                    </div>
                  ))}
               </div>
               <button className="w-full py-4 bg-foreground text-background rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4" /> Reset Security Core
               </button>
            </section>
         </div>
      </div>
    </div>
  );
}
