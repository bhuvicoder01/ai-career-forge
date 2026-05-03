"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { Briefcase, MapPin, DollarSign, ExternalLink, Star, RotateCcw } from "lucide-react";
import useSyncStore from "@/store/useSyncStore";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salaryMin: number;
  salaryMax: number;
  matchScore: number;
  url?: string;
  companyLogoUrl?: string;
  companyLogoTheme?: string;
  source?: string;
  jobType?: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [activeTab, setActiveTab] = useState<"discovery" | "matched" | "catalog">("discovery");
  
  // Read sync status from the global store (managed at layout level)
  const syncStatus = useSyncStore((state) => state.syncStatus);
  const isSyncing = syncStatus.status === 'SYNCING' || syncStatus.status === 'MATCHING';

  const fetchJobs = async (tab: string) => {
    try {
      const endpoint = tab === "catalog" ? "/jobs/catalog" : "/jobs/recommended";
      const response = await api.get(endpoint);
      setJobs(response.data);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch ${tab} jobs:`, error);
      return [];
    }
  };

  // Local Filtering & Tab Logic
  useEffect(() => {
    const filtered = jobs.filter(job => {
      // 1. Tab Thresholds
      if (activeTab === "matched" && job.matchScore < 80) return false;
      
      // 2. Search Queries
      const matchesQuery = !query || 
        job.title.toLowerCase().includes(query.toLowerCase()) || 
        job.company.toLowerCase().includes(query.toLowerCase()) ||
        job.description.toLowerCase().includes(query.toLowerCase());
      
      const matchesLocation = !location || 
        job.location.toLowerCase().includes(location.toLowerCase());

      return matchesQuery && matchesLocation;
    });
    setFilteredJobs(filtered);
  }, [query, location, jobs, activeTab]);

  // Refresh jobs when sync completes or tab changes
  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      await fetchJobs(activeTab);
      setLoading(false);
    };
    initPage();
  }, [activeTab, syncStatus.status]);

  // Also refresh periodically while syncing to show partial results
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSyncing) {
      interval = setInterval(() => fetchJobs(activeTab), 16000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSyncing, activeTab]);

  const handleReset = async () => {
    if (!confirm("This will clear all current jobs and perform a fresh, diversified sync based on your profile. Continue?")) {
        return;
    }

    setSearching(true);
    try {
        await api.delete("/jobs");
        setJobs([]);
        setFilteredJobs([]);
        setActiveTab("discovery");
    } catch (error) {
        console.error("Reset failed:", error);
    } finally {
      setSearching(false);
    }
  };

  if (loading && jobs.length === 0 && !isSyncing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="text-muted-foreground animate-pulse">Consulting our AI for the best matches...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-card p-8 rounded-3xl border border-border shadow-sm">
        <div className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">Job Discovery</h1>
            <p className="text-muted-foreground font-medium max-w-lg">
              {activeTab === "discovery" 
                ? "AI-powered semantic matches curated specifically for your profile." 
                : activeTab === "matched" 
                  ? "High-precision opportunities that strictly align with your expertise."
                  : "The complete global catalog of verified career opportunities."}
            </p>
          </div>
          
          {/* Tabs */}
          <div className="flex p-1 bg-secondary/30 rounded-xl w-fit">
            {[
              { id: "discovery", label: "Discovery Feed" },
              { id: "matched", label: "Top Matches" },
              { id: "catalog", label: "All Jobs" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="flex-1 lg:w-64 xl:w-72">
            <input
              type="text"
              placeholder="Filter by Skill or Title"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            />
          </div>
          <div className="flex-1 lg:w-48 xl:w-56">
            <input
              type="text"
              placeholder="Filter by Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={searching || isSyncing}
              className="p-2.5 rounded-xl bg-secondary/50 text-secondary-foreground hover:bg-secondary transition-all border border-border disabled:opacity-50"
              title="Reset & Re-sync Profile"
            >
              <RotateCcw className={`w-5 h-5 ${(searching || isSyncing) ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <div key={job.id} className="group relative bg-card border border-border rounded-2xl p-8 hover:shadow-2xl hover:shadow-primary/5 transition-all flex flex-col gap-5">
              {/* Match Score Badge */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                {job.source && (
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                    job.source === 'remotive'
                      ? 'bg-violet-500/10 text-violet-400 border-violet-500/30'
                      : job.source === 'jsearch'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  }`}>
                    {job.source}
                  </span>
                )}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground text-background rounded-full text-[10px] font-black uppercase tracking-widest border border-transparent shadow-lg">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {Math.round(job.matchScore)}% Match
                </div>
              </div>

              <div className="flex items-start gap-4 min-w-0">
                <div className={`flex-shrink-0 h-12 w-auto min-w-[45px] max-w-[140px] rounded-lg border overflow-hidden flex items-center justify-center p-0 shadow-sm transition-all duration-500 ${
                  job.companyLogoTheme === 'light' 
                    ? 'bg-zinc-900 border-zinc-800' 
                    : job.companyLogoTheme === 'dark' 
                      ? 'bg-white border-zinc-200' 
                      : 'bg-zinc-100 border-zinc-200'
                }`}>
                  {job.companyLogoUrl ? (
                    <img 
                      src={job.companyLogoUrl} 
                      alt={job.company} 
                      className="w-full h-full object-contain p-2"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = ""; 
                        (e.target as HTMLImageElement).className = "hidden";
                      }}
                    />
                  ) : (
                    <Briefcase className="w-6 h-6 text-muted-foreground opacity-50" />
                  )}
                  <Briefcase className="absolute w-6 h-6 text-muted-foreground opacity-50 pointer-events-none -z-10" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <h3 className="text-xl font-bold leading-tight pr-12 truncate group-hover:whitespace-normal group-hover:line-clamp-2 transition-all" title={job.title}>{job.title}</h3>
                  <p className="text-muted-foreground font-medium text-sm truncate" title={job.company}>{job.company}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {job.location}
                </div>
                {job.salaryMin && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" /> 
                    ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}
                  </div>
                )}
              </div>

              <div className="text-sm line-clamp-3 text-muted-foreground leading-relaxed">
                {job.description}
              </div>

                <div className="flex gap-3">
                  <Link
                    href={`/dashboard/jobs/${job.id}`}
                    className="flex-1 bg-secondary text-secondary-foreground text-center py-2 rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
                  >
                    View Details
                  </Link>
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-primary text-primary-foreground text-center py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-1"
                  >
                    Apply <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-2xl flex flex-col items-center gap-4">
            <Briefcase className="w-12 h-12 text-muted-foreground opacity-20" />
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">No matches found yet</h2>
              <p className="text-muted-foreground text-sm max-w-sm">
                Try updating your resume profile to help our AI find better recommendations for you.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
