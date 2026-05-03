"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { Users, FileText, CheckCircle, XCircle, Clock, ChevronRight, Filter } from "lucide-react";

function ApplicantsContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");
  const [applicants, setApplicants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchApplicants();
  }, [jobId]);

  const fetchApplicants = async () => {
    try {
      const res = await api.get("/recruiter/applicants");
      let data = res.data;
      if (jobId) {
        data = data.filter((app: any) => app.jobId === jobId);
      }
      setApplicants(data);
    } catch (err) {
      console.error("Failed to fetch applicants", err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (appId: string, newStatus: string) => {
    try {
      await api.patch(`/recruiter/applications/${appId}/status?status=${newStatus}`);
      setApplicants(prev => prev.map(app => app.id === appId ? { ...app, status: newStatus } : app));
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">Talent Pool</h1>
          <p className="text-muted-foreground font-medium">Review and process operatives for your active missions.</p>
        </div>
        <div className="flex items-center gap-2 bg-secondary/50 p-2 rounded-2xl border border-border">
           <Filter className="w-4 h-4 ml-2 text-muted-foreground" />
           <select className="bg-transparent text-xs font-black uppercase tracking-widest px-4 py-2 focus:outline-none">
              <option>All Candidates</option>
              <option>High AI Match</option>
              <option>Pending Review</option>
           </select>
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-secondary/20 rounded-[32px] animate-pulse border border-border" />
          ))}
        </div>
      ) : applicants.length === 0 ? (
        <div className="text-center py-24 bg-muted/20 border border-dashed border-border rounded-[40px]">
          <Users className="w-16 h-16 mx-auto opacity-10 mb-4" />
          <p className="text-muted-foreground font-black uppercase tracking-widest text-sm">No operatives have applied for this mission yet.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-[40px] overflow-hidden shadow-2xl">
           <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead className="bg-secondary/30 border-b border-border">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Candidate Entity</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Mission Target</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Protocol Execution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {applicants.map((app) => (
                    <tr key={app.id} className="hover:bg-secondary/10 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-foreground text-background flex items-center justify-center font-black text-lg">
                            {app.jobTitle?.[0] || 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-black uppercase">{app.userId.slice(-6)}</p>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold">
                               <Clock className="w-3 h-3" /> {new Date(app.appliedDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-black text-foreground">{app.jobTitle}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{app.company}</p>
                      </td>
                      <td className="px-8 py-6">
                         <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${
                            app.status === 'APPLIED' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                            app.status === 'INTERVIEW' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                            app.status === 'OFFER' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                            'bg-red-500/10 text-red-500 border-red-500/20'
                         }`}>
                           {app.status}
                         </span>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex items-center gap-3">
                            <button 
                              onClick={() => updateStatus(app.id, 'INTERVIEW')}
                              className="p-3 rounded-xl bg-background border border-border hover:bg-orange-500/10 hover:text-orange-500 hover:border-orange-500/20 transition-all text-muted-foreground"
                              title="Schedule Interview"
                            >
                               <Clock className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => updateStatus(app.id, 'OFFER')}
                              className="p-3 rounded-xl bg-background border border-border hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/20 transition-all text-muted-foreground"
                              title="Send Offer"
                            >
                               <CheckCircle className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => updateStatus(app.id, 'REJECTED')}
                              className="p-3 rounded-xl bg-background border border-border hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all text-muted-foreground"
                              title="Terminate Application"
                            >
                               <XCircle className="w-4 h-4" />
                            </button>
                            <div className="w-px h-6 bg-border mx-1" />
                            <button className="p-3 rounded-xl bg-foreground text-background hover:opacity-80 transition-all">
                               <FileText className="w-4 h-4" />
                            </button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>
      )}
    </div>
  );
}

export default function ApplicantsPage() {
  return (
    <Suspense fallback={<div>Loading terminal...</div>}>
      <ApplicantsContent />
    </Suspense>
  );
}
