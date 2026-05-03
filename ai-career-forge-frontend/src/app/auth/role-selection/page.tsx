"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Briefcase, ChevronRight, Sparkles } from "lucide-react";
import api from "@/lib/api";
import useAuthStore from "@/store/useAuthStore";

export default function RoleSelectionPage() {
  const router = useRouter();
  const { user, setAuth, token } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // If user already has a role, redirect them
    if (user && user.role !== "PENDING") {
      redirectByRole(user.role);
    }
  }, [user]);

  const redirectByRole = (role: string) => {
    if (role === "ADMIN") router.push("/admin/dashboard");
    else if (role === "RECRUITER") router.push("/recruiter/dashboard");
    else router.push("/dashboard");
  };

  const handleRoleSelect = async (selectedRole: "USER" | "RECRUITER") => {
    setIsLoading(true);
    try {
      const res = await api.post("/auth/set-role", { role: selectedRole });
      const updatedUser = { 
        id: res.data.userId, 
        email: res.data.email, 
        name: res.data.name, 
        role: res.data.role 
      };
      
      // Update store with new role
      setAuth(updatedUser, token || "", res.data.needsOnboarding);
      
      // Redirect based on the newly selected role
      if (selectedRole === "RECRUITER") {
        router.push("/recruiter/dashboard");
      } else {
        router.push("/auth/onboarding");
      }
    } catch (err) {
      console.error("Failed to set role:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px] -z-10" />

      <div className="w-full max-w-4xl space-y-12 text-center relative z-10">
        <header className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-4">
             <Sparkles className="w-4 h-4 text-blue-500" />
             <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Identity Protocol</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none">
             Define Your <br />
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Trajectory</span>
          </h1>
          <p className="text-muted-foreground text-lg font-medium max-w-xl mx-auto">
            Welcome to AI CareerForge. To personalize your experience, please select your primary objective within our ecosystem.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4 md:px-0">
          {/* Seeker Option */}
          <button
            onClick={() => handleRoleSelect("USER")}
            disabled={isLoading}
            className="group relative bg-card border border-border rounded-[40px] p-10 text-left transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-500/30 overflow-hidden active:scale-95"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
               <User className="w-32 h-32" />
            </div>
            
            <div className="relative z-10 space-y-6">
              <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                <User className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight mb-2">I am a Seeker</h2>
                <p className="text-muted-foreground font-medium text-sm leading-relaxed">
                  Discover AI-matched opportunities, optimize your resume, and accelerate your career growth with intelligent insights.
                </p>
              </div>
              <div className="flex items-center gap-2 text-blue-600 text-xs font-black uppercase tracking-widest">
                 Initialize Profile <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </button>

          {/* Recruiter Option */}
          <button
            onClick={() => handleRoleSelect("RECRUITER")}
            disabled={isLoading}
            className="group relative bg-card border border-border rounded-[40px] p-10 text-left transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10 hover:border-purple-500/30 overflow-hidden active:scale-95"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
               <Briefcase className="w-32 h-32" />
            </div>

            <div className="relative z-10 space-y-6">
              <div className="w-16 h-16 bg-purple-600/10 rounded-2xl flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                <Briefcase className="w-8 h-8 text-purple-600 group-hover:text-white transition-colors" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight mb-2">I am a Recruiter</h2>
                <p className="text-muted-foreground font-medium text-sm leading-relaxed">
                  Deploy mission-critical job listings, access pre-vetted AI talent, and streamline your entire acquisition pipeline.
                </p>
              </div>
              <div className="flex items-center gap-2 text-purple-600 text-xs font-black uppercase tracking-widest">
                 Establish Authority <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </button>
        </div>

        {isLoading && (
          <div className="animate-in fade-in zoom-in duration-300">
             <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Configuring Environment...</p>
          </div>
        )}
      </div>
    </div>
  );
}
