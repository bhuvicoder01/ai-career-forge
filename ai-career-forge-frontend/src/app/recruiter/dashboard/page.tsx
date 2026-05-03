"use client";

import { 
  Users, Briefcase, TrendingUp, CheckCircle, Clock, 
  ArrowUpRight, MapPin, DollarSign, Calendar
} from "lucide-react";
import useAuthStore from "@/store/useAuthStore";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function RecruiterDashboard() {
  const { user } = useAuthStore();
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const jobsRes = await api.get("/recruiter/jobs");
        const appsRes = await api.get("/recruiter/applicants");
        
        setDashboardStats({
          activeJobs: jobsRes.data.length,
          totalApplicants: appsRes.data.length,
          interviews: appsRes.data.filter((a: any) => a.status === 'INTERVIEW').length,
          hired: appsRes.data.filter((a: any) => a.status === 'OFFER').length,
          recentApplicants: appsRes.data.slice(0, 5)
        });
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const stats = [
    { label: "Active Jobs", value: dashboardStats?.activeJobs || "0", icon: Briefcase, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Total Applicants", value: dashboardStats?.totalApplicants || "0", icon: Users, icon2: ArrowUpRight, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Interviews", value: dashboardStats?.interviews || "0", icon: Calendar, color: "text-orange-500", bg: "bg-orange-500/10" },
    { label: "Hired", value: dashboardStats?.hired || "0", icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10" },
  ];

  const recentApplicants = dashboardStats?.recentApplicants || [];

  if (isLoading) return <div className="p-10 text-center font-black uppercase tracking-widest animate-pulse">Initializing Terminal...</div>;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <header>
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">Command Center</h1>
        <p className="text-muted-foreground font-medium">Welcome back, Agent <span className="text-foreground font-black uppercase">{user?.name}</span>. The talent pipeline is active.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-card border border-border p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-full -mr-8 -mt-8 blur-3xl opacity-50 group-hover:scale-150 transition-transform duration-700`}></div>
            <div className="flex justify-between items-start mb-4">
              <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl`}>
                <stat.icon className="w-6 h-6" />
              </div>
              {stat.icon2 && <stat.icon2 className="w-4 h-4 text-muted-foreground" />}
            </div>
            <div>
              <p className="text-2xl font-black text-foreground">{stat.value}</p>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* Recent Applicants */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
              <Clock className="w-5 h-5 opacity-50" /> Latest Infiltrations
            </h2>
            <button className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4">View All Ops</button>
          </div>

          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-secondary/30 border-b border-border">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Candidate</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">AI Match</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentApplicants.map((app: any) => (
                      <tr key={app.id} className="hover:bg-secondary/10 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center font-black text-xs">
                              {app.jobTitle?.[0] || 'U'}
                            </div>
                            <div>
                              <p className="text-sm font-black uppercase">{app.userId.slice(-6)}</p>
                              <p className="text-[10px] text-muted-foreground font-medium">{app.jobTitle}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                             app.status === 'INTERVIEWING' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                             app.status === 'REVIEWING' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                             app.status === 'APPLIED' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                             'bg-red-500/10 text-red-500 border-red-500/20'
                           }`}>
                             {app.status}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                             <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden max-w-[60px]">
                                <div 
                                  className={`h-full rounded-full bg-blue-500`} 
                                  style={{ width: `85%` }}
                                ></div>
                             </div>
                             <span className="text-[10px] font-black">85%</span>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-[10px] text-muted-foreground font-bold">{new Date(app.appliedDate).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        </div>

        {/* Hiring Funnel / Sidebar */}
        <div className="space-y-6">
           <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
              <TrendingUp className="w-5 h-5 opacity-50" /> System Velocity
           </h2>
           <div className="bg-card border border-border p-8 rounded-3xl space-y-8 shadow-sm">
              <div className="space-y-4">
                 <div className="flex justify-between items-end">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Conversion Rate</p>
                    <p className="text-2xl font-black">24.5%</p>
                 </div>
                 <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full w-[24.5%] bg-foreground rounded-full"></div>
                 </div>
              </div>

              <div className="space-y-4">
                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Top Channels</p>
                 <div className="space-y-3">
                    {[
                      { name: "Direct Search", val: 45, color: "bg-blue-500" },
                      { name: "Referrals", val: 32, color: "bg-purple-500" },
                      { name: "Social Media", val: 23, color: "bg-orange-500" }
                    ].map((c, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${c.color}`}></div>
                        <div className="flex-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{c.name}</div>
                        <div className="text-[10px] font-black">{c.val}%</div>
                      </div>
                    ))}
                 </div>
              </div>

              <button className="w-full py-4 bg-secondary text-foreground text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-border transition-all">
                Export Strategic Intel
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
