"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Briefcase, MapPin, DollarSign, ExternalLink, Zap, Star } from "lucide-react";

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

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await api.get("/jobs/recommended");
        setJobs(response.data);
      } catch (error) {
        console.error("Failed to fetch recommended jobs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="text-muted-foreground animate-pulse">Consulting our AI for the best matches...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Job Recommendations</h1>
        <p className="text-muted-foreground italic">
          AI-powered matches based on your unique skills and career goals.
        </p>
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

              <div className="mt-auto pt-4 flex gap-3">
                <button className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-md font-medium text-sm border border-border/50 transition-colors">
                  Details
                </button>
                <button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4" /> Quick Apply
                </button>
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
