"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { 
  CheckCircle, Clock, FileText, LayoutDashboard, 
  ExternalLink, MousePointer2, Briefcase, ChevronRight,
  TrendingUp, Download, Eye, AlertCircle, Loader2,
  Trash2, Archive, Inbox, Activity
} from "lucide-react";

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  status: 'SAVED' | 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'ARCHIVED';
  appliedDate: string;
  tailoredResumeS3Url?: string;
  coverLetterText?: string;
  emailIntroduction?: string;
  interviewPrepText?: string;
  templateStyle?: string;
}

export default function ApplicationTracker() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');

  const fetchApps = async () => {
    try {
      const response = await api.get("/applications");
      setApps(response.data);
    } catch (error) {
       console.error("Failed to fetch applications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      await api.patch(`/applications/${id}/status?status=${newStatus}`);
      await fetchApps();
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleArchive = (id: string) => {
    handleStatusUpdate(id, 'ARCHIVED');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this application and all generates materials?")) {
        return;
    }
    setUpdatingId(id);
    try {
      await api.delete(`/applications/${id}`);
      await fetchApps();
    } catch (error) {
      console.error("Failed to delete application:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredApps = apps.filter(app => 
    currentTab === 'ACTIVE' ? app.status !== 'ARCHIVED' : app.status === 'ARCHIVED'
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
         <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-white tracking-tight">Application Arsenal</h1>
          <p className="text-slate-400 font-medium">Manage your agent-generated materials and track your mission progress.</p>
        </div>
        
        <div className="flex items-center gap-4">
           {/* Tabs */}
           <div className="flex p-1 bg-slate-900/80 border border-white/10 rounded-2xl">
              <button 
                onClick={() => setCurrentTab('ACTIVE')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                  currentTab === 'ACTIVE' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white'
                }`}
              >
                  <Activity className="w-4 h-4" /> Active Bids
              </button>
              <button 
                onClick={() => setCurrentTab('ARCHIVED')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                  currentTab === 'ARCHIVED' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                  <Inbox className="w-4 h-4" /> Archived
              </button>
           </div>

           <div className="hidden xl:flex bg-slate-900/50 border border-white/10 px-6 py-3 rounded-2xl items-center gap-3">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase">Live Operations</div>
                <div className="text-xl font-black text-white">{apps.filter(a => a.status === 'APPLIED' || a.status === 'INTERVIEW').length}</div>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredApps.length > 0 ? (
          filteredApps.map((app) => (
            <div key={app.id} className="group bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-3xl p-8 hover:bg-slate-900 transition-all border-l-4 border-l-blue-600 relative overflow-hidden">
              <div className="flex flex-col xl:flex-row gap-8 items-start xl:items-center justify-between relative z-10">
                
                {/* Job Info */}
                <div className="flex items-start gap-6">
                  <div className="p-5 bg-blue-600/10 text-blue-400 rounded-2xl border border-blue-500/20 shadow-inner">
                    <Briefcase className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-white">{app.jobTitle}</h3>
                    <p className="text-lg text-slate-400 font-semibold">{app.company}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 mt-4">
                       <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black border tracking-wider ${
                         app.status === 'OFFER' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                         app.status === 'INTERVIEW' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                         app.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                         'bg-blue-500/10 text-blue-400 border-blue-500/20'
                       }`}>
                          <div className={`w-2 h-2 rounded-full ${
                             app.status === 'OFFER' ? 'bg-green-500' :
                             app.status === 'REJECTED' ? 'bg-red-500' :
                             'bg-blue-500 animate-pulse'
                          }`}></div>
                          {app.status}
                       </span>
                       <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(app.appliedDate).toLocaleDateString()}
                       </span>
                    </div>
                  </div>
                </div>

                {/* Status Stepper */}
                <div className="flex flex-wrap items-center gap-2 bg-black/20 p-2 rounded-2xl border border-white/5">
                   {['SAVED', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED'].map((st) => (
                     <button
                       key={st}
                       onClick={() => handleStatusUpdate(app.id, st)}
                       disabled={updatingId === app.id}
                       className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                         app.status === st 
                           ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-105' 
                           : 'hover:bg-white/5 text-slate-500'
                       }`}
                     >
                       {st}
                     </button>
                   ))}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                   <div className="flex gap-2 mr-2 border-r border-white/10 pr-4">
                       {app.status !== 'ARCHIVED' && (
                           <button 
                               onClick={() => handleArchive(app.id)}
                               title="Archive Application"
                               className="p-3 bg-white/5 border border-white/10 text-slate-400 rounded-2xl hover:bg-white/10 hover:text-white transition-all"
                           >
                               <Archive className="w-5 h-5" />
                           </button>
                       )}
                       <button 
                           onClick={() => handleDelete(app.id)}
                           title="Permanent Delete"
                           className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                       >
                           <Trash2 className="w-5 h-5" />
                       </button>
                   </div>

                   <a 
                     href={app.tailoredResumeS3Url}
                     target="_blank"
                     className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white text-black rounded-2xl text-sm font-black hover:bg-slate-200 transition-all shadow-xl shadow-white/5"
                   >
                     <Eye className="w-4 h-4" /> Preview Resume
                   </a>
                   <Link
                     href={`/dashboard/applications/${app.id}/prep`}
                     className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/10"
                   >
                     <LayoutDashboard className="w-4 h-4" /> All Materials
                   </Link>
                </div>
              </div>
              
              {/* Progress Line Background */}
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-slate-800">
                 <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: app.status === 'OFFER' ? '100%' : app.status === 'INTERVIEW' ? '60%' : app.status === 'APPLIED' ? '30%' : '10%' }}></div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-3xl space-y-4">
             <div className="bg-slate-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto border border-white/10">
                <AlertCircle className="w-10 h-10 text-slate-700" />
             </div>
             <div>
                <h3 className="text-2xl font-bold text-white">No applications yet</h3>
                <p className="text-slate-500">Find a job match and use One-Click tailoring to start your arsenal.</p>
             </div>
             <Link href="/dashboard/jobs" className="inline-block px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-500 transition-all">
                Browse Job Matches
             </Link>
          </div>
        )}
      </div>
    </div>
  );
}
