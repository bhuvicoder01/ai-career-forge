"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Briefcase, MapPin, Users, Plus, ExternalLink, Trash2, Edit2 } from "lucide-react";
import Link from "next/link";

export default function RecruiterJobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await api.get("/recruiter/jobs");
      setJobs(res.data);
    } catch (err) {
      console.error("Failed to fetch recruiter jobs", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">My Job Postings</h1>
          <p className="text-muted-foreground font-medium">Manage and track your active recruitment missions.</p>
        </div>
        <Link 
          href="/recruiter/jobs/new"
          className="bg-foreground text-background px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-xl"
        >
          <Plus className="w-5 h-5" /> Deploy New Job
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-secondary/20 rounded-3xl animate-pulse border border-border" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-24 bg-muted/20 border border-dashed border-border rounded-[40px]">
          <Briefcase className="w-16 h-16 mx-auto opacity-10 mb-4" />
          <p className="text-muted-foreground font-black uppercase tracking-widest text-sm">No active postings detected in this sector.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div key={job.id} className="bg-card border border-border rounded-[32px] p-8 shadow-sm hover:shadow-2xl transition-all group flex flex-col h-full relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button className="p-2 rounded-xl bg-background border border-border hover:bg-secondary text-muted-foreground"><Edit2 className="w-4 h-4" /></button>
                  <button className="p-2 rounded-xl bg-background border border-border hover:bg-red-500/10 text-red-500"><Trash2 className="w-4 h-4" /></button>
               </div>
               
               <div className="mb-6">
                  <div className="w-14 h-14 bg-secondary rounded-2xl flex items-center justify-center mb-4 font-black text-xl text-foreground">
                    {job.company[0]}
                  </div>
                  <h3 className="text-xl font-black leading-tight group-hover:text-blue-500 transition-colors">{job.title}</h3>
                  <div className="flex items-center gap-2 mt-2 text-muted-foreground text-sm font-semibold uppercase tracking-tight">
                    <MapPin className="w-3 h-3" /> {job.location}
                  </div>
               </div>

               <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between py-3 border-y border-border/50">
                     <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type</span>
                     <span className="text-xs font-black uppercase">{job.jobType?.replace('_', ' ') || 'Full Time'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Applicants</span>
                     <div className="flex items-center gap-2 text-blue-500 font-black">
                        <Users className="w-4 h-4" /> 24
                     </div>
                  </div>
               </div>

               <Link 
                 href={`/recruiter/applicants?jobId=${job.id}`}
                 className="mt-8 w-full py-4 rounded-2xl bg-secondary text-foreground text-[10px] font-black uppercase tracking-widest text-center hover:bg-foreground hover:text-background transition-all"
               >
                 View Talent Pipeline
               </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
