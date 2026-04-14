"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { Briefcase, MapPin, DollarSign, ExternalLink, Zap, Star, RotateCcw } from "lucide-react";

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
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const isSyncingRef = useRef(false);

  const fetchRecommended = async () => {
    try {
      const response = await api.get("/jobs/recommended");
      setJobs(response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch recommended jobs:", error);
      return [];
    }
  };

  const autoSyncJobs = async (skills: string[], preferredLoc?: string) => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setSyncing(true);
    
    // Select top 3 distinct and descriptive skills (length > 2)
    const targetSkills = skills
      .filter(s => s.length > 2)
      .slice(0, 3);
      
    if (targetSkills.length === 0) {
      targetSkills.push("Software Developer");
    }
    
    const searchLocation = preferredLoc || "";
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (let i = 0; i < targetSkills.length; i++) {
      const currentSkill = targetSkills[i];
      setRetryCount(i + 1);
      setStatus(`Syncing ${currentSkill} roles... (${i + 1}/${targetSkills.length})`);

      try {
        await api.get(`/jobs/search?q=${encodeURIComponent(currentSkill)}&l=${encodeURIComponent(searchLocation)}`);
        // Refresh periodically so the user starts seeing results
        await fetchRecommended();
        
        // Brief pause to respect Adzuna rate limits (25 per minute = 2.4s per call ideally, but 1.2s is usually safe)
        if (i < targetSkills.length - 1) {
            await sleep(1200);
        }
      } catch (error) {
        console.error(`Sync for ${currentSkill} failed:`, error);
      }
    }

    setStatus("");
    setSyncing(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncing(true);
    setStatus("Syncing real-time jobs...");
    try {
      await api.get(`/jobs/search?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}`);
      await fetchRecommended();
      setStatus("");
    } catch (error) {
      console.error("Manual search failed:", error);
      setStatus("Manual search failed. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("This will clear all current jobs and perform a fresh, diversified sync based on your profile. Continue?")) {
        return;
    }

    setSyncing(true);
    setStatus("Cleaning up database...");
    try {
        await api.delete("/jobs");
        setJobs([]);
        isSyncingRef.current = false; // Reset the ref to allow a new auto-sync
        
        // Fetch profile and restart sync
        const profileRes = await api.get("/profile");
        const profile = profileRes.data;
        if (profile.skills && profile.skills.length > 0) {
            autoSyncJobs(profile.skills, profile.preferredLocation);
        } else {
            setSyncing(false);
            setStatus("");
        }
    } catch (error) {
        console.error("Reset failed:", error);
        setStatus("Reset failed. Please try again.");
        setSyncing(false);
    }
  };

  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      const recommendedJobs = await fetchRecommended();

      // If no jobs exist currently, let's try to auto-sync once based on profile
      if (recommendedJobs.length === 0 && !isSyncingRef.current) {
        try {
          const profileRes = await api.get("/profile");
          const profile = profileRes.data;
          
          if (profile.skills && profile.skills.length > 0) {
            autoSyncJobs(profile.skills, profile.preferredLocation);
          } else {
            setLoading(false);
          }
        } catch (error) {
          console.error("Failed to load profile for auto-sync:", error);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    initPage();
  }, []);

  // Update loading state once sync completes
  useEffect(() => {
    if (!syncing && jobs.length > 0) {
       setLoading(false);
    }
  }, [syncing, jobs]);

  if (loading && jobs.length === 0 && !syncing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="text-muted-foreground animate-pulse">Consulting our AI for the best matches...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {syncing && (
        <div className="fixed top-24 right-8 z-50 bg-card border border-primary/20 p-4 rounded-xl shadow-xl flex items-center gap-4 animate-in slide-in-from-right duration-300">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-primary"></div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">{status}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-card/30 p-6 rounded-2xl border border-border/50 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Job Recommendations</h1>
          <p className="text-muted-foreground font-medium max-w-lg">
            AI-powered matches curated specifically for your profile and career growth.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="flex-1 lg:w-64 xl:w-72">
            <input
              type="text"
              placeholder="Skill or Title (e.g. Java)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-background/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            />
          </div>
          <div className="flex-1 lg:w-48 xl:w-56">
            <input
              type="text"
              placeholder="Where (e.g. London)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-background/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={syncing}
              className="p-2.5 rounded-xl bg-secondary/50 text-secondary-foreground hover:bg-secondary transition-all border border-border disabled:opacity-50"
              title="Reset & Re-sync Profile"
            >
              <RotateCcw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="submit"
              disabled={syncing}
              className="flex-1 lg:flex-none px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              {syncing ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent animate-spin rounded-full"></div>
              ) : (
                <Briefcase className="w-5 h-5" />
              )}
              <span className="lg:hidden xl:inline">Fetch Jobs</span>
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <div key={job.id} className="group relative bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:shadow-primary/5 transition-all flex flex-col gap-4">
              {/* Match Score Badge */}
              <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold border border-primary/20">
                <Star className="w-4 h-4 fill-primary" />
                {Math.round(job.matchScore)}% Match
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold leading-none pr-20">{job.title}</h3>
                <p className="text-muted-foreground font-medium">{job.company}</p>
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
