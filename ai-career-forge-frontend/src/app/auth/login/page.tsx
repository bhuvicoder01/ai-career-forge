"use client";

import Link from "next/link";
import { BrainCircuit } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import api from "@/lib/api";
import useAuthStore from "@/store/useAuthStore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/authenticate", {
        email,
        password,
      });

      const { user, token } = response.data;
      setAuth(user, token);
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-foreground/5 rounded-full blur-3xl -z-10" />
      
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center justify-center hover:opacity-80 transition-opacity">
            <img 
              src={mounted && resolvedTheme === 'dark' ? "/zenith-dark.png" : "/zenith-light.png"} 
              alt="Zenith" 
              className="w-full max-w-[150px] h-auto" 
            />
          </Link>
          <p className="text-muted-foreground mt-2 text-[10px] font-black uppercase tracking-[0.2em]">Access Intelligence Node</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-5 bg-card p-6 md:p-10 rounded-3xl border border-border shadow-2xl">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-lg text-center font-bold">
              {error}
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-border bg-background rounded-xl focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all text-sm font-medium" 
              placeholder="operator@zenith.ai"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-border bg-background rounded-xl focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all text-sm font-medium" 
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-4 px-4 bg-foreground text-background font-black uppercase tracking-[0.2em] text-xs rounded-xl shadow-xl hover:opacity-90 transition-all mt-4 disabled:opacity-50 active:scale-95"
          >
            {isLoading ? "Synchronizing..." : "Initialize Session"}
          </button>
          
          <div className="text-center text-[10px] font-black uppercase tracking-widest pt-6 border-t border-border/50">
            <span className="text-muted-foreground">No account?</span> <Link href="/auth/register" className="text-foreground hover:underline ml-1">Create Access</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
