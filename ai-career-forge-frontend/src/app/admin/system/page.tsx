"use client";

import { Database, Server, Cpu, HardDrive, Activity, RefreshCw } from "lucide-react";

export default function AdminSystem() {
  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">Core Services</h1>
          <p className="text-muted-foreground font-medium">Real-time status of ZENITH infrastructure nodes.</p>
        </div>
        <button className="p-4 rounded-2xl bg-secondary hover:rotate-180 transition-all duration-700">
           <RefreshCw className="w-5 h-5" />
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-card border border-border p-8 rounded-[40px] space-y-6">
            <div className="flex items-center gap-4">
               <div className="p-4 bg-green-500/10 rounded-2xl text-green-500">
                  <Database className="w-6 h-6" />
               </div>
               <div>
                  <h3 className="font-black uppercase tracking-tight">Database Cluster</h3>
                  <p className="text-[10px] font-black text-green-500 uppercase">Operational / Optimal</p>
               </div>
            </div>
            <div className="space-y-3">
               <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground">
                  <span>Connections</span>
                  <span>42 / 100</span>
               </div>
               <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full w-[42%] bg-green-500"></div>
               </div>
            </div>
         </div>

         <div className="bg-card border border-border p-8 rounded-[40px] space-y-6">
            <div className="flex items-center gap-4">
               <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-500">
                  <Server className="w-6 h-6" />
               </div>
               <div>
                  <h3 className="font-black uppercase tracking-tight">API Gateway</h3>
                  <p className="text-[10px] font-black text-blue-500 uppercase">Load Balanced / Stable</p>
               </div>
            </div>
            <div className="space-y-3">
               <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground">
                  <span>Request Latency</span>
                  <span>124ms</span>
               </div>
               <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full w-[15%] bg-blue-500"></div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
