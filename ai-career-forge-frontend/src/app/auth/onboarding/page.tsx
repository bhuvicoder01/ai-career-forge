"use client";

import { useState, useRef, useEffect, Suspense } from "react";
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
  Briefcase,
  Key,
} from "lucide-react";

const TOTAL_STEPS = 3;

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { setToken, setNeedsOnboarding, setAuth } = useAuthStore();

  const [step, setStep] = useState(1);
  const [tempPass, setTempPass] = useState<string | null>(null);

  useEffect(() => {
    const savedPass = sessionStorage.getItem('zenith_temp_pass');
    if (savedPass) setTempPass(savedPass);
  }, []);
  const [isLoading, setIsLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [parsedGoals, setParsedGoals] = useState("");
  const [preferredLocation, setPreferredLocation] = useState("");
  const [preferredSalary, setPreferredSalary] = useState("");
  const [preferredLifestyle, setPreferredLifestyle] = useState("balanced");

  // Handled by AuthGuard globally

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
    if (!preferredLocation) {
      alert("Location is required to initialize your career nexus.");
      return;
    }
    setIsLoading(true);
    try {
      const formData = new FormData();
      if (resumeFile) {
        formData.append("file", resumeFile);
      }
      if (headline) formData.append("headline", headline);
      if (bio) formData.append("bio", bio);
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden transition-colors duration-500">
      {/* Background effects - Stealth Intelligence */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-foreground/5 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-foreground/5 rounded-full blur-[120px] animate-pulse delay-1000" />

      <div className="max-w-2xl w-full relative z-10">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-8">
           {tempPass && (
             <div className="absolute top-[-100px] left-0 right-0 animate-in slide-in-from-top-8 duration-700">
               <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 backdrop-blur-xl flex items-start gap-4">
                  <div className="p-2 bg-amber-500/20 rounded-xl">
                    <Key className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-amber-500 uppercase tracking-tight">Temporary Credentials Active</p>
                    <p className="text-xs text-amber-500/80 font-bold">Your auto-generated password is: <span className="bg-amber-500/20 px-2 py-0.5 rounded font-mono text-white select-all cursor-pointer">{tempPass}</span></p>
                    <p className="text-[10px] text-amber-500/50 mt-1 uppercase font-black">Use this for manual login. You can change it in settings later.</p>
                  </div>
               </div>
             </div>
           )}
          {[1, 2, 3].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (s < step) setStep(s);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-500 ${
                  s === step
                    ? "bg-foreground text-background shadow-xl shadow-foreground/10 scale-105"
                    : s < step
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    : "bg-secondary text-muted-foreground border border-border"
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
                    s < step ? "bg-emerald-500/30" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-card backdrop-blur-2xl border border-border p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-black/20">
          {/* Header */}
          <div className="mb-8 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground font-black tracking-[0.2em] text-[10px] uppercase">
              <Sparkles className="w-4 h-4 text-primary" /> Step {step} of {TOTAL_STEPS}
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
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
                    ? "border-primary bg-primary/10 scale-[1.02]"
                    : resumeFile
                    ? "border-emerald-500/50 bg-emerald-500/5"
                    : "border-border bg-secondary/50 hover:border-zinc-500/50 hover:bg-secondary"
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
                    <CheckCircle2 className="w-14 h-14 text-emerald-400 mb-4" />
                    <p className="text-lg font-black text-emerald-400 uppercase tracking-tight">
                      Resume Loaded
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 font-mono bg-secondary/80 px-3 py-1 rounded-lg">
                      {resumeFile.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground/50 mt-3 uppercase font-black">
                      Click to change file
                    </p>
                  </>
                ) : (
                  <>
                    <UploadCloud
                      className={`w-14 h-14 mb-4 transition-all duration-300 ${
                        isDragging
                          ? "text-primary scale-110"
                          : "text-zinc-500 group-hover:text-zinc-400 group-hover:scale-105"
                      }`}
                    />
                    <p className="text-lg font-black text-foreground uppercase tracking-tight">
                      {isDragging ? "Drop to Upload" : "Drag & Drop Resume"}
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-1 uppercase font-black tracking-widest">
                      or click to browse • PDF only
                    </p>
                  </>
                )}

                {isDragging && (
                  <div className="absolute inset-0 bg-primary/5 animate-pulse pointer-events-none" />
                )}
              </div>

              <div className="bg-secondary/30 border border-border rounded-xl p-4 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black text-foreground uppercase tracking-wider">
                    AI-Powered Extraction
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                    We&apos;ll use AI to extract skills, experience, and projects from your resume. 
                    <span className="text-primary ml-1">Don&apos;t have a resume?</span> You can skip this and enter your info manually in your profile later.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={nextStep}
                className="w-full bg-foreground text-background font-black uppercase tracking-[0.2em] text-xs py-5 rounded-2xl flex items-center justify-center gap-2 group transition-all shadow-xl shadow-foreground/5 active:scale-[0.98]"
              >
                {resumeFile ? "Continue" : "Skip for Now"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {/* Step 2: Career Ambitions */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary" /> Professional Headline
                  </label>
                  <input
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. Senior Fullstack Engineer | React & Node.js"
                    className="w-full bg-background border border-border rounded-xl px-4 py-4 text-foreground focus:ring-1 focus:ring-primary/20 outline-none transition-all placeholder:text-zinc-700 text-sm font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" /> Short Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Briefly describe your professional journey..."
                    className="w-full bg-background border border-border rounded-xl px-4 py-4 text-foreground focus:ring-1 focus:ring-primary/20 outline-none h-24 transition-all placeholder:text-zinc-700 resize-none text-sm font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" /> Career Ambition
                  </label>
                  <textarea
                    value={parsedGoals}
                    onChange={(e) => setParsedGoals(e.target.value)}
                    placeholder="What are your long-term goals?"
                    className="w-full bg-background border border-border rounded-xl px-4 py-4 text-foreground focus:ring-1 focus:ring-primary/20 outline-none h-24 transition-all placeholder:text-zinc-700 resize-none text-sm font-medium"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 border border-border hover:bg-secondary text-foreground font-black uppercase tracking-widest text-[10px] py-5 rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-[2] bg-foreground text-background font-black uppercase tracking-[0.2em] text-xs py-5 rounded-2xl flex items-center justify-center gap-2 group transition-all shadow-xl shadow-foreground/5 active:scale-[0.98]"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" /> Preferred Location <span className="text-rose-500">*</span>
                  </label>
                  <input
                    value={preferredLocation}
                    onChange={(e) => setPreferredLocation(e.target.value)}
                    placeholder="e.g. Remote, USA"
                    className="w-full bg-background border border-border rounded-xl px-4 py-4 text-foreground focus:ring-1 focus:ring-primary/20 outline-none placeholder:text-zinc-700 text-sm font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-500" /> Salary Goal
                  </label>
                  <input
                    value={preferredSalary}
                    onChange={(e) => setPreferredSalary(e.target.value)}
                    placeholder="e.g. $150k+"
                    className="w-full bg-background border border-border rounded-xl px-4 py-4 text-foreground focus:ring-1 focus:ring-primary/20 outline-none placeholder:text-zinc-700 text-sm font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500" /> Work-Life Priorities
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      value: "high_growth",
                      label: "High Growth",
                      desc: "Fast-paced velocity",
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
                      desc: "Strictly remote",
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
                          ? "bg-primary/10 border-primary/50 shadow-lg shadow-primary/5"
                          : "bg-background border-border hover:border-zinc-500"
                      }`}
                    >
                      <div className="text-xl mb-1">{option.icon}</div>
                      <p
                        className={`font-black text-xs uppercase tracking-tight ${
                          preferredLifestyle === option.value
                            ? "text-primary"
                            : "text-foreground"
                        }`}
                      >
                        {option.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase mt-0.5">{option.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 border border-border hover:bg-secondary text-foreground font-black uppercase tracking-widest text-[10px] py-5 rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-[2] bg-foreground text-background font-black py-5 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-xl shadow-foreground/5 active:scale-[0.98] uppercase tracking-[0.2em] text-xs"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4" />
                      Launch Agent
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom hint */}
        <p className="text-center text-[10px] text-muted-foreground/50 mt-8 font-black uppercase tracking-widest leading-loose max-w-md mx-auto">
          Secure Intelligence Processing • Adzuna & Remotive Nexus Sync Active
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
