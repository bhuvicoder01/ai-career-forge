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
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState("");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");

  // Read sync status from the global store (managed at layout level)
  const syncStatus = useSyncStore((state) => state.syncStatus);
  const isSyncing = syncStatus.status === 'SYNCING';

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

  // Refresh jobs when sync completes
  useEffect(() => {
    if (syncStatus.status === 'COMPLETED') {
      fetchRecommended();
    }
  }, [syncStatus.status]);

  // Also refresh periodically while syncing to show partial results
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSyncing) {
      interval = setInterval(fetchRecommended, 8000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSyncing]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    setSearchStatus("Syncing real-time jobs...");
    try {
      await api.get(`/jobs/search?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}`);
      await fetchRecommended();
      setSearchStatus("");
    } catch (error) {
      console.error("Manual search failed:", error);
      setSearchStatus("Manual search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("This will clear all current jobs and perform a fresh, diversified sync based on your profile. Continue?")) {
        return;
    }

    setSearching(true);
    setSearchStatus("Cleaning up database...");
    try {
        await api.delete("/jobs");
        setJobs([]);
        setSearchStatus("Jobs cleared. Upload or update your profile to trigger a fresh sync.");
    } catch (error) {
        console.error("Reset failed:", error);
        setSearchStatus("Reset failed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      await fetchRecommended();
      setLoading(false);
    };
    initPage();
  }, []);

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
              disabled={searching || isSyncing}
              className="p-2.5 rounded-xl bg-secondary/50 text-secondary-foreground hover:bg-secondary transition-all border border-border disabled:opacity-50"
              title="Reset &amp; Re-sync Profile"
            >
              <RotateCcw className={`w-5 h-5 ${(searching || isSyncing) ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="submit"
              disabled={searching || isSyncing}
              className="flex-1 lg:flex-none px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              {searching ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent animate-spin rounded-full"></div>
              ) : (
                <Briefcase className="w-5 h-5" />
              )}
              <span className="lg:hidden xl:inline">Fetch Jobs</span>
            </button>
          </div>
        </form>
      </div>

      {searchStatus && (
        <div className="text-sm text-muted-foreground bg-card/50 px-4 py-2 rounded-xl border border-border/50">
          {searchStatus}
        </div>
      )}

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
