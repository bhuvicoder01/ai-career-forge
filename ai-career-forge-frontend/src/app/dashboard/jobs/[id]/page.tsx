"use client";

import { useEffect, useState, use } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { 
  Briefcase, MapPin, DollarSign, ExternalLink, 
  ArrowLeft, Zap, CheckCircle, Shield, Building2, 
  Clock, Share2, Sparkles, MessageSquare, Target,
  FileText, Layout, ChevronDown, Loader2
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salaryMin?: number;
  salaryMax?: number;
  url?: string;
  source?: string;
  cultureAnalysis?: string;
  fairPayEstimate?: string;
  relevanceExplanation?: string;
}

interface JobDetailResponse {
  job: Job;
  matchedSkills: string[];
  matchScore: number;
}

export default function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<JobDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("MODERN");
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await api.get(`/jobs/${id}`);
        setData(response.data);
      } catch (error) {
        console.error("Failed to fetch job details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  const handleOneClickTailor = async () => {
    if (!data) return;
    setIsGenerating(true);
    try {
      // 1. Create Application
      const appRes = await api.post("/applications", {
        jobId: data.job.id,
        jobTitle: data.job.title,
        company: data.job.company,
        templateStyle: selectedTemplate
      });
      
      // 2. Trigger generation
      await api.post(`/applications/${appRes.data.id}/prepare`, {
        jobDescription: data.job.description,
        company: data.job.company
      });
      
      // Redirect to tracker
      window.location.href = "/dashboard/applications";
    } catch (error) {
       console.error("Tailoring failed:", error);
       alert("AI generation encountered an issue. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const { job, matchedSkills, matchScore } = data;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans pb-24">
      {/* Back Button */}
      <Link 
        href="/dashboard/jobs" 
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Recommendation Engine
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Header Card */}
          <div className="relative bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-3xl p-8 md:p-10 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
            
            <div className="relative flex flex-col md:flex-row gap-8 items-start justify-between">
              <div className="space-y-6 flex-1">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl">
                    <Building2 className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-black text-white">{job.title}</h1>
                    <p className="text-xl text-blue-400 font-bold">{job.company}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm font-medium">
                  <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-slate-300 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-400" /> {job.location}
                  </div>
                  {job.salaryMin && (
                    <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-slate-300 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-400" /> ${job.salaryMin.toLocaleString()} - ${job.salaryMax?.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full md:w-auto space-y-3">
                 <div className="relative">
                    <button 
                      onClick={() => setShowTemplates(!showTemplates)}
                      className="w-full bg-slate-800 text-white px-6 py-4 rounded-2xl font-bold flex items-center justify-between gap-4 border border-white/10 hover:bg-slate-750 transition-all"
                    >
                       <div className="flex items-center gap-2">
                          <Layout className="w-5 h-5 text-blue-400" />
                          <span>Template: {selectedTemplate}</span>
                       </div>
                       <ChevronDown className={`w-4 h-4 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showTemplates && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-2xl p-2 z-50 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        {["MODERN", "CLASSIC"].map(t => (
                          <button 
                            key={t}
                            onClick={() => { setSelectedTemplate(t); setShowTemplates(false); }}
                            className="w-full text-left px-4 py-3 hover:bg-blue-600 rounded-xl transition-all text-sm font-bold"
                          >
                            {t} Style
                          </button>
                        ))}
                      </div>
                    )}
                 </div>

                 <button 
                   onClick={handleOneClickTailor}
                   disabled={isGenerating}
                   className="w-full bg-blue-600 hover:bg-blue-500 text-white px-8 py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-[0_0_40px_-10px_rgba(37,99,235,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                 >
                   {isGenerating ? (
                     <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Forging...
                     </>
                   ) : (
                     <>
                        <Sparkles className="w-6 h-6 fill-white" />
                        One-Click Tailor
                     </>
                   )}
                 </button>
              </div>
            </div>
          </div>

          {/* AI Insights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-8 space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                   <Target className="w-5 h-5 text-purple-400" />
                   Match Intelligence
                </h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  {job.relevanceExplanation || "Generating real-time explanation for match..."}
                </p>
             </div>
             
             <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-8 space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                   <Shield className="w-5 h-5 text-green-400" />
                   Fair-Pay Intelligence
                </h3>
                <div className="text-slate-400 leading-relaxed text-sm">
                  {job.fairPayEstimate ? (
                    <div dangerouslySetInnerHTML={{ __html: job.fairPayEstimate }} />
                  ) : (
                    "Analyzing market standards and company benchmarks..."
                  )}
                </div>
             </div>
          </div>

          {/* Company Culture (RAG) */}
          <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-6 md:p-10 space-y-6">
             <h3 className="text-2xl font-black flex items-center gap-3">
                <Building2 className="w-7 h-7 text-blue-500" />
                Company Culture & Environment
             </h3>
               {job.cultureAnalysis ? (
                 <div className="prose prose-sm md:prose-base prose-invert prose-blue max-w-none prose-p:leading-relaxed prose-headings:font-black prose-li:text-slate-300 prose-strong:text-white">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                       {job.cultureAnalysis}
                    </ReactMarkdown>
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center py-10 gap-4 opacity-50">
                    <Loader2 className="w-10 h-10 animate-spin" />
                    <p className="font-bold">Crawling Glassdoor and Quora for real insights...</p>
                 </div>
               )}
          </div>

          {/* JD */}
          <div className="bg-slate-900/20 border border-white/5 rounded-3xl p-10 space-y-6">
             <h3 className="text-xl font-bold">Original Job Description</h3>
             <div className="text-slate-400 text-sm leading-8 whitespace-pre-wrap">
               {job.description}
             </div>
          </div>
        </div>

        {/* Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
           {/* Dynamic Match Score */}
           <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10 rounded-3xl p-8 relative overflow-hidden ring-1 ring-white/20">
              <div className="relative z-10 space-y-4 text-center">
                 <h4 className="font-bold text-slate-400 uppercase tracking-widest text-xs">AI Confidence</h4>
                 <div className="text-7xl font-black text-white">{Math.round(matchScore)}%</div>
                 <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-1000" style={{ width: `${matchScore}%` }}></div>
                 </div>
                 <p className="text-xs text-slate-400 italic pt-2">Match verified via MongoDB Atlas Vector Search</p>
              </div>
           </div>

           {/* Matched Skills */}
           <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 space-y-6">
              <h4 className="font-bold flex items-center gap-2">
                 <CheckCircle className="w-5 h-5 text-green-500" />
                 Verified Skills Match
              </h4>
              <div className="flex flex-wrap gap-2">
                {matchedSkills.map(skill => (
                  <span key={skill} className="px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl text-xs font-bold">
                    {skill}
                  </span>
                ))}
              </div>
           </div>

           {/* Quick Support */}
           <div className="bg-slate-900/30 border border-white/10 rounded-3xl p-6 text-center space-y-4">
              <div className="bg-blue-600/20 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto">
                 <MessageSquare className="w-6 h-6 text-blue-400" />
              </div>
              <h5 className="font-bold">Need a specific prep kit?</h5>
              <p className="text-xs text-slate-500">Ask our AI Assistant in the bottom right bubble to generate deeper company insights.</p>
           </div>
        </div>
      </div>
    </div>
  );
}
