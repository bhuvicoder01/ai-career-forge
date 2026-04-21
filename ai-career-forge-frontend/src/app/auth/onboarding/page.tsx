"use client";

import { useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import useAuthStore from "@/store/useAuthStore";
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Heart,
  DollarSign,
  MapPin,
  UploadCloud,
  FileText,
  Sparkles,
  Target,
  Rocket,
} from "lucide-react";

const TOTAL_STEPS = 3;

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { setToken, setNeedsOnboarding, setAuth } = useAuthStore();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [parsedGoals, setParsedGoals] = useState("");
  const [preferredLocation, setPreferredLocation] = useState("");
  const [preferredSalary, setPreferredSalary] = useState("");
  const [preferredLifestyle, setPreferredLifestyle] = useState("balanced");

  // Handle OAuth token from URL
  if (token && typeof window !== "undefined") {
    localStorage.setItem("auth_token", token);
    setToken(token);
  }

  const handleFileSelect = (file: File) => {
    if (file && file.type === "application/pdf") {
      setResumeFile(file);
    } else {
      alert("Please upload a PDF file.");
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      if (resumeFile) {
        formData.append("file", resumeFile);
      }
      if (parsedGoals) formData.append("parsedGoals", parsedGoals);
      if (preferredLocation) formData.append("preferredLocation", preferredLocation);
      if (preferredSalary) formData.append("preferredSalary", preferredSalary);
      if (preferredLifestyle) formData.append("preferredLifestyle", preferredLifestyle);

      await api.post("/profile/onboarding", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setNeedsOnboarding(false);
      router.push("/dashboard");
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const stepIcons = [
    <FileText key="1" className="w-5 h-5" />,
    <Target key="2" className="w-5 h-5" />,
    <Rocket key="3" className="w-5 h-5" />,
  ];
  const stepLabels = ["Resume", "Ambition", "Preferences"];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-950 via-slate-950 to-black relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="max-w-2xl w-full relative z-10">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (s < step) setStep(s);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-500 ${
                  s === step
                    ? "bg-white text-black shadow-lg shadow-white/20 scale-105"
                    : s < step
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-white/5 text-white/40 border border-white/10"
                }`}
              >
                {s < step ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  stepIcons[i]
                )}
                <span className="hidden sm:inline">{stepLabels[i]}</span>
                <span className="sm:hidden">{s}</span>
              </button>
              {i < 2 && (
                <div
                  className={`w-8 h-0.5 transition-all duration-500 ${
                    s < step ? "bg-green-500/50" : "bg-white/10"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 p-8 md:p-10 rounded-3xl shadow-2xl shadow-black/50">
          {/* Header */}
          <div className="mb-8 space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-bold tracking-widest text-xs uppercase">
              <Sparkles className="w-4 h-4" /> Step {step} of {TOTAL_STEPS}
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white">
              {step === 1 && "Upload Your Resume"}
              {step === 2 && "Define Your Ambition"}
              {step === 3 && "Set Preferences"}
            </h1>
            <p className="text-slate-400">
              {step === 1 &&
                "Our AI will extract your skills, experience, and achievements to find the best matching jobs."}
              {step === 2 &&
                "Tell us about your career goals so we can curate the most relevant opportunities."}
              {step === 3 &&
                "Fine-tune your preferences to get personalized job recommendations."}
            </p>
          </div>

          {/* Step 1: Resume Upload */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer group relative overflow-hidden ${
                  isDragging
                    ? "border-blue-400 bg-blue-500/10 scale-[1.02]"
                    : resumeFile
                    ? "border-green-500/50 bg-green-500/5"
                    : "border-slate-700 bg-slate-950/50 hover:border-slate-600 hover:bg-slate-950/80"
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f);
                  }}
                  className="hidden"
                  accept=".pdf"
                />

                {resumeFile ? (
                  <>
                    <CheckCircle2 className="w-14 h-14 text-green-400 mb-4" />
                    <p className="text-lg font-black text-green-400">
                      Resume Loaded
                    </p>
                    <p className="text-sm text-slate-400 mt-1 font-mono bg-slate-800/50 px-3 py-1 rounded-lg">
                      {resumeFile.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-3">
                      Click to change file
                    </p>
                  </>
                ) : (
                  <>
                    <UploadCloud
                      className={`w-14 h-14 mb-4 transition-all duration-300 ${
                        isDragging
                          ? "text-blue-400 scale-110"
                          : "text-slate-500 group-hover:text-slate-400 group-hover:scale-105"
                      }`}
                    />
                    <p className="text-lg font-black text-white">
                      {isDragging ? "Drop to Upload" : "Drag & Drop Resume"}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      or click to browse • PDF only
                    </p>
                  </>
                )}

                {isDragging && (
                  <div className="absolute inset-0 bg-blue-500/5 animate-pulse pointer-events-none" />
                )}
              </div>

              <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-slate-300">
                    AI-Powered Extraction
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    We&apos;ll use AI to extract skills, experience, projects,
                    and certifications from your resume to find the best job
                    matches from multiple sources.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={nextStep}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 group transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
              >
                {resumeFile ? "Continue" : "Skip for Now"}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {/* Step 2: Career Ambitions */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-400" /> Career
                  Ambition
                </label>
                <textarea
                  value={parsedGoals}
                  onChange={(e) => setParsedGoals(e.target.value)}
                  placeholder="e.g. I want to build world-class AI products, transition into a leadership role, and work at a high-growth startup."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none h-36 transition-all placeholder:text-slate-600 resize-none"
                />
                <p className="text-xs text-slate-600">
                  This helps our AI align job recommendations with your long-term career trajectory.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 border border-slate-800 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" /> Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 group transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                >
                  Continue
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-400" /> Preferred
                    Location
                  </label>
                  <input
                    value={preferredLocation}
                    onChange={(e) => setPreferredLocation(e.target.value)}
                    placeholder="e.g. Remote, USA"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none placeholder:text-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-400" /> Salary
                    Goal
                  </label>
                  <input
                    value={preferredSalary}
                    onChange={(e) => setPreferredSalary(e.target.value)}
                    placeholder="e.g. $150k+"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-500" /> Work-Life
                  Priorities
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      value: "high_growth",
                      label: "High Growth",
                      desc: "Fast-paced, high velocity",
                      icon: "🚀",
                    },
                    {
                      value: "balanced",
                      label: "Balanced",
                      desc: "Work-life harmony",
                      icon: "⚖️",
                    },
                    {
                      value: "strict_remote",
                      label: "Remote Only",
                      desc: "Strictly remote work",
                      icon: "🏠",
                    },
                    {
                      value: "nomad",
                      label: "Digital Nomad",
                      desc: "Location independent",
                      icon: "🌍",
                    },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPreferredLifestyle(option.value)}
                      className={`p-4 rounded-xl border text-left transition-all duration-300 ${
                        preferredLifestyle === option.value
                          ? "bg-blue-500/10 border-blue-500/50 shadow-lg shadow-blue-500/10"
                          : "bg-slate-950 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="text-xl mb-1">{option.icon}</div>
                      <p
                        className={`font-bold text-sm ${
                          preferredLifestyle === option.value
                            ? "text-blue-400"
                            : "text-white"
                        }`}
                      >
                        {option.label}
                      </p>
                      <p className="text-xs text-slate-500">{option.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 border border-slate-800 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" /> Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-[2] bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-violet-500/20 active:scale-[0.98] uppercase tracking-wider text-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Initializing AI Agent...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-5 h-5" />
                      Launch Career Agent
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom hint */}
        <p className="text-center text-xs text-slate-600 mt-6 font-medium">
          Your data is processed securely. Multi-source job matching from Adzuna
          & Remotive will begin after setup.
        </p>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-white" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
