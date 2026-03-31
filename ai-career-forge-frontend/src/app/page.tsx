"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BrainCircuit, Briefcase, FileText } from "lucide-react";
import useAuthStore from "@/store/useAuthStore";

export default function Home() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-background/50 relative overflow-hidden">
      
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-900/20 rounded-full blur-3xl" />

      <main className="max-w-4xl text-center space-y-8 z-10 relative">
        <Image src="/logo-transparent.png" alt="AI CareerForge Logo" width={120} height={120} className="mx-auto drop-shadow-2xl hover:scale-105 transition-transform duration-500 mb-2" priority />
        <div className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-400 backdrop-blur-3xl mb-4">
          <BrainCircuit className="w-4 h-4 mr-2" />
          <span>AI-Powered Career Accelerator</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
          Supercharge Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Career Forge</span>
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Automate your job search, tailor your resume for every application, and ace interviews with our intelligent Agentic system.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          {isAuthenticated ? (
            <Link href="/dashboard" className="inline-flex h-12 animate-shimmer items-center justify-center rounded-md border border-blue-800 bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] px-6 font-medium text-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-blue-50">
              Go to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link href="/auth/register" className="inline-flex h-12 animate-shimmer items-center justify-center rounded-md border border-blue-800 bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] px-6 font-medium text-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-blue-50">
                Get Started <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              <Link href="/auth/login" className="px-6 py-3 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 font-medium transition-all">
                Login
              </Link>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16">
          <div className="p-6 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow text-left">
            <Briefcase className="w-10 h-10 text-blue-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Smart Job Matching</h3>
            <p className="text-sm text-muted-foreground">Vector-based matching finds jobs that align perfectly with your skills and culture fit.</p>
          </div>
          <div className="p-6 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow text-left">
            <FileText className="w-10 h-10 text-green-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Resume Tailoring</h3>
            <p className="text-sm text-muted-foreground">AI automatically rewrites your resume for each specific job description you apply to.</p>
          </div>
          <div className="p-6 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow text-left">
            <BrainCircuit className="w-10 h-10 text-purple-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Interview Prep Kit</h3>
            <p className="text-sm text-muted-foreground">Custom behavioral and technical questions generated instantly for every role.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
