"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import api from "@/lib/api";
import useAuthStore from "@/store/useAuthStore";
import { Loader2, ArrowRight, CheckCircle2, Heart, DollarSign, MapPin } from "lucide-react";

interface OnboardingForm {
  parsedGoals: string;
  preferredLocation: string;
  preferredSalary: string;
  preferredLifestyle: string;
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const login = useAuthStore((state) => state.setToken);
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, watch } = useForm<OnboardingForm>();

  const onSubmit = async (data: OnboardingForm) => {
    setIsLoading(true);
    try {
      // If there's a token from OAuth, set it first
      if (token) {
        localStorage.setItem("auth_token", token);
        login(token);
      }

      await api.put("/profile", data);
      router.push("/dashboard");
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900 via-slate-900 to-black">
      <div className="max-w-xl w-full bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
        <div className="mb-8 space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-bold tracking-widest text-xs uppercase">
                <CheckCircle2 className="w-4 h-4" /> Final Step
            </div>
            <h1 className="text-4xl font-black text-white">Welcome to Forge!</h1>
            <p className="text-slate-400">Let's fine-tune your career agent.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                   Career Ambition
                </label>
                <textarea
                  {...register("parsedGoals")}
                  placeholder="e.g. I want to build world-class AI products and lead engineering teams."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none h-32 transition-all"
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 group transition-all"
              >
                Next Step <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-400" /> Preferred Location
                    </label>
                    <input
                      {...register("preferredLocation")}
                      placeholder="e.g. Remote, USA"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-400" /> Salary Goal
                    </label>
                    <input
                      {...register("preferredSalary")}
                      placeholder="e.g. $150k+"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                    />
                  </div>
               </div>

               <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                   <Heart className="w-4 h-4 text-pink-500" /> Work-Life Priorities
                 </label>
                 <select
                   {...register("preferredLifestyle")}
                   className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                 >
                   <option value="high_growth">High Growth / High Velocity</option>
                   <option value="balanced">Work-Life Balance Focused</option>
                   <option value="strict_remote">Strictly Remote Only</option>
                   <option value="nomad">Digital Nomad Friendly</option>
                 </select>
               </div>

               <div className="flex gap-4">
                <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 border border-slate-800 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all"
                >
                    Back
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-[2] bg-white hover:bg-slate-200 text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all font-outfit"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Profile"}
                </button>
               </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-white" /></div>}>
      <OnboardingContent />
    </Suspense>
  );
}
