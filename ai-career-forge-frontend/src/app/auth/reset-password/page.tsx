"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import api from "@/lib/api";
import { BrainCircuit, Lock, CheckCircle2, AlertCircle } from "lucide-react";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // Fallback to manual parsing if hook fails
      const urlToken = token || new URLSearchParams(window.location.search).get("token");
      
      if (!urlToken) {
        setError("Authorization token missing. Please request a new recovery link.");
      } else {
        setError("");
      }
    }
  }, [token, mounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await api.post("/auth/reset-password", { token, newPassword: password });
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reset password. The link may have expired.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-foreground/5 rounded-full blur-3xl -z-10" />
      
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center justify-center hover:opacity-80 transition-opacity">
            <img 
              src={resolvedTheme === 'dark' ? "/zenith-dark.png" : "/zenith-light.png"} 
              alt="Zenith" 
              className="w-full max-w-[150px] h-auto" 
            />
          </Link>
          <p className="text-muted-foreground mt-2 text-[10px] font-black uppercase tracking-[0.2em]">Credential Re-Initialization</p>
        </div>

        <div className="bg-card p-8 md:p-10 rounded-3xl border border-border shadow-2xl space-y-6">
          {!isSuccess ? (
            <>
              <div className="space-y-2">
                <h1 className="text-xl font-bold tracking-tight">Set New Password</h1>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  Establish a new neural access key for your account. Ensure it is secure and unique.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] rounded-lg font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-border bg-background rounded-xl focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all text-sm font-medium" 
                      placeholder="••••••••"
                      disabled={!token}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                      type="password" 
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-border bg-background rounded-xl focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all text-sm font-medium" 
                      placeholder="••••••••"
                      disabled={!token}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading || !token}
                  className="w-full py-4 px-4 bg-foreground text-background font-black uppercase tracking-[0.2em] text-xs rounded-xl shadow-xl hover:opacity-90 transition-all mt-2 disabled:opacity-50"
                >
                  {isLoading ? "Synchronizing..." : "Update Credentials"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-6 py-4 animate-in fade-in zoom-in duration-500">
              <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold tracking-tight">Access Restored</h2>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  Your credentials have been successfully updated. Redirecting to Intelligence Node...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
