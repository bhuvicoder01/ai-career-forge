"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { 
  ArrowLeft, FileText, LayoutDashboard, 
  Mail, MessageSquare, Download, Eye, Loader2,
  CheckCircle, Sparkles, AlertCircle, Trash2
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  tailoredResumeS3Url?: string;
  coverLetterText?: string;
  emailIntroduction?: string;
  interviewPrepText?: string;
}

interface UserProfile {
  resumeS3Url?: string;
}

export default function ApplicationMaterialsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [app, setApp] = useState<Application | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'RESUME' | 'LETTER' | 'INTRO' | 'PREP'>('RESUME');
  const [isComparing, setIsComparing] = useState(false);

  useEffect(() => {
    const fetchApp = async () => {
      try {
        const [appResponse, profileResponse] = await Promise.all([
            api.get(`/applications/${id}`),
            api.get(`/profile`)
        ]);
        setApp(appResponse.data);
        setProfile(profileResponse.data);
      } catch (error) {
        console.error("Failed to fetch application:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchApp();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this application and all materials?")) {
        return;
    }
    try {
      await api.delete(`/applications/${app?.id}`);
      router.push("/dashboard/applications");
    } catch (error) {
      console.error("Failed to delete application:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!app) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500 pb-20">
      <Link 
        href="/dashboard/applications" 
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Tracker
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
         <div className="space-y-1">
            <h1 className="text-2xl md:text-4xl font-black text-white">{app.jobTitle}</h1>
            <p className="text-lg md:text-xl text-blue-400 font-bold">{app.company}</p>
         </div>
         
         <div className="flex gap-2 md:gap-3 w-full md:w-auto">
            <button 
              onClick={handleDelete}
              className="flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl md:rounded-2xl font-black text-xs md:text-sm flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all"
            >
              <Trash2 className="w-4 h-4" /> <span className="md:inline">Delete</span>
            </button>
            <a 
              href={app.tailoredResumeS3Url}
              target="_blank"
              className="flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-3 bg-white text-black rounded-xl md:rounded-2xl font-black text-xs md:text-sm flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"
            >
              <Download className="w-4 h-4" /> <span className="md:inline">Resume</span>
            </a>
         </div>
      </div>

      <div className="flex flex-wrap gap-1.5 md:gap-2 bg-slate-900/50 p-1.5 md:p-2 rounded-xl md:rounded-2xl border border-white/10">
         {[
           { id: 'RESUME', label: 'Resume', icon: FileText },
           { id: 'LETTER', label: 'Cover Letter', icon: Sparkles },
           { id: 'INTRO', label: 'Email', icon: Mail },
           { id: 'PREP', label: 'Interview', icon: LayoutDashboard }
         ].map(tab => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id as any)}
             className={`flex items-center gap-1.5 md:gap-2 px-3 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl text-[10px] md:text-sm font-bold transition-all ${
               activeTab === tab.id ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-slate-400'
             }`}
           >
             <tab.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
             {tab.label}
           </button>
         ))}
      </div>

      {/* Content Area */}
      <div className="bg-slate-900/40 border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-12 min-h-[500px]">
         {activeTab === 'RESUME' && (
           <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <h2 className="text-2xl font-black flex items-center gap-3">
                    <FileText className="w-6 h-6 text-blue-400" /> Resume Intelligence
                 </h2>
                 <button 
                   onClick={() => setIsComparing(!isComparing)}
                   className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${
                     isComparing ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                   }`}
                 >
                   {isComparing ? 'Exit Comparison' : 'Side-by-Side Comparison'}
                 </button>
              </div>
              
              <div className={`grid gap-6 ${isComparing ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
                 {isComparing && (
                    <div className="space-y-3">
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Original Resume</p>
                       <div className="aspect-[1/1.414] w-full bg-slate-950 rounded-2xl border border-white/5 overflow-hidden">
                          <iframe src={profile?.resumeS3Url} className="w-full h-full border-none opacity-60" />
                       </div>
                    </div>
                 )}
                 <div className="space-y-3">
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-widest text-center">{isComparing ? 'AI-Tailored Version' : ''}</p>
                    <div className="aspect-[1/1.414] w-full bg-white rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                       <iframe src={app.tailoredResumeS3Url} className="w-full h-full border-none" />
                    </div>
                 </div>
              </div>
           </div>
         )}

          {activeTab === 'LETTER' && (
             <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                 <h2 className="text-xl md:text-2xl font-black flex items-center gap-3">
                    <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-purple-400" /> Cover Letter
                 </h2>
                 <div className="bg-slate-950/50 border border-white/5 rounded-xl md:rounded-2xl p-6 md:p-10 text-slate-300 leading-relaxed whitespace-pre-wrap font-serif text-base md:text-lg">
                    {app.coverLetterText}
                 </div>
             </div>
          )}

          {activeTab === 'INTRO' && (
             <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                 <h2 className="text-xl md:text-2xl font-black flex items-center gap-3">
                    <Mail className="w-5 h-5 md:w-6 md:h-6 text-green-400" /> Email Introduction
                 </h2>
                 <div className="bg-slate-950/50 border border-white/5 rounded-xl md:rounded-2xl p-5 md:p-8 text-slate-300 leading-relaxed whitespace-pre-wrap font-mono text-xs md:text-sm relative">
                    <div className="absolute top-2 right-2 text-[8px] text-slate-600 font-bold uppercase tracking-widest md:hidden">Copy</div>
                    <div className="absolute top-4 right-4 text-[10px] text-slate-600 font-bold uppercase tracking-widest hidden md:block">Copy to Clipboard</div>
                    {app.emailIntroduction}
                 </div>
             </div>
          )}

         {activeTab === 'PREP' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h2 className="text-2xl font-black flex items-center gap-3">
                   <LayoutDashboard className="w-6 h-6 text-orange-400" /> Complete Interview Preparation Kit
                </h2>
                 <div className="prose prose-sm md:prose-base prose-invert prose-blue max-w-none">
                    {app.interviewPrepText ? (
                      <div className="bg-slate-950/30 p-4 md:p-12 rounded-2xl md:rounded-3xl border border-white/5">
                         <div className="prose prose-sm md:prose-base prose-invert prose-blue max-w-none prose-p:leading-relaxed prose-headings:font-black prose-li:text-slate-300">
                           <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {app.interviewPrepText}
                           </ReactMarkdown>
                        </div>
                     </div>
                   ) : (
                     <div className="text-center py-20 opacity-50">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                        <p>No prep materials found for this specific application.</p>
                     </div>
                   )}
                </div>
            </div>
         )}
      </div>
    </div>
  );
}
