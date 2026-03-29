"use client";

import { useEffect, useState, use } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { 
  Briefcase, MapPin, DollarSign, ExternalLink, 
  ArrowLeft, Zap, CheckCircle, Shield, Building2, 
  Clock, Share2 
} from "lucide-react";

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent animate-spin rounded-full"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Job Not Found</h2>
        <Link href="/dashboard/jobs" className="text-primary hover:underline">
          Return to Job Board
        </Link>
      </div>
    );
  }

  const { job, matchedSkills, matchScore } = data;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back Button */}
      <Link 
        href="/dashboard/jobs" 
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Jobs
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header Card */}
          <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
                    <p className="text-xl text-muted-foreground font-medium">{job.company}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </div>
                  {job.salaryMin && (
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4" />
                      ₹{job.salaryMin.toLocaleString()} - ₹{job.salaryMax?.toLocaleString()}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    Posted recently
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 min-w-[200px]">
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-primary text-primary-foreground text-center py-3 rounded-lg font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Apply Now <ExternalLink className="w-4 h-4" />
                </a>
                <button className="w-full bg-secondary text-secondary-foreground text-center py-3 rounded-lg font-medium hover:bg-secondary/80 transition-all border border-border">
                  Save for Later
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-card border border-border rounded-xl p-8 shadow-sm space-y-6">
            <h2 className="text-xl font-bold">Job Description</h2>
            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {job.description}
            </div>
          </div>
        </div>

        {/* Sidebar Insights */}
        <div className="space-y-6">
          {/* Match Score Card */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            
            <div className="relative space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary fill-primary" />
                  AI Match Score
                </h3>
                <span className="text-2xl font-black text-primary">{Math.round(matchScore)}%</span>
              </div>
              
              <div className="w-full bg-primary/10 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-1000" 
                  style={{ width: `${matchScore}%` }}
                ></div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Your profile matches this role's requirements based on your verified skills and experiences.
              </p>
            </div>
          </div>

          {/* Matched Skills */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Your Matching Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {matchedSkills.length > 0 ? (
                matchedSkills.map((skill) => (
                  <span 
                    key={skill}
                    className="px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 rounded-full text-xs font-semibold"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No direct skill keywords detected in description.
                </p>
              )}
            </div>
          </div>

          {/* Verification Badge */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-start gap-4">
            <Shield className="w-6 h-6 text-primary flex-shrink-0" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold italic">AI Verified Listing</h4>
              <p className="text-xs text-muted-foreground leading-tight">
                Synced from {job.source?.toUpperCase() || "RELIABLE"} sources. Verified by CareerForge AI.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pt-4 flex items-center justify-center gap-6 border-t border-border">
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
              <Share2 className="w-4 h-4" /> Share
            </button>
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors font-medium">
              Report Listing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
