"use client";

import { BarChart3, TrendingUp, Users, PieChart, ArrowUpRight } from "lucide-react";

export default function RecruiterAnalytics() {
  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <header>
        <h1 className="text-4xl font-black uppercase tracking-tighter">Hiring Insights</h1>
        <p className="text-muted-foreground font-medium">Strategic data visualization of your recruitment velocity.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-card border border-border p-10 rounded-[40px] flex flex-col items-center justify-center text-center space-y-6">
            <div className="p-6 bg-blue-500/10 rounded-3xl">
               <PieChart className="w-12 h-12 text-blue-500" />
            </div>
            <div>
               <h3 className="text-xl font-black uppercase">Candidate Distribution</h3>
               <p className="text-muted-foreground text-sm max-w-xs mx-auto">AI-driven analysis of candidate skills and experience levels across all active missions.</p>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
               <div className="h-full w-2/3 bg-blue-500"></div>
            </div>
         </div>

         <div className="bg-card border border-border p-10 rounded-[40px] flex flex-col items-center justify-center text-center space-y-6">
            <div className="p-6 bg-purple-500/10 rounded-3xl">
               <BarChart3 className="w-12 h-12 text-purple-500" />
            </div>
            <div>
               <h3 className="text-xl font-black uppercase">Time to Hire</h3>
               <p className="text-muted-foreground text-sm max-w-xs mx-auto">Tracking the average duration from mission deployment to operative onboarding.</p>
            </div>
            <div className="flex gap-2">
               {[40, 70, 45, 90, 65].map((h, i) => (
                 <div key={i} className="w-4 bg-purple-500/20 rounded-t-lg flex flex-col justify-end h-12">
                    <div className="bg-purple-500 rounded-t-lg" style={{ height: `${h}%` }}></div>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}
