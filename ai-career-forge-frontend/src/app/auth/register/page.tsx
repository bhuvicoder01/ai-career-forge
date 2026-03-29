"use client";

import Link from "next/link";
import { BrainCircuit } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import useAuthStore from "@/store/useAuthStore";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/register", {
        name,
        email,
        password,
      });

      const { user, token } = response.data;
      setAuth(user, token);
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-3xl -z-10" />
      
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl text-foreground hover:text-blue-400 transition-colors">
            <BrainCircuit className="w-8 h-8 text-blue-500" />
            CareerForge
          </Link>
          <p className="text-muted-foreground mt-2 text-sm">Create your account to get started</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4 bg-card p-6 md:p-8 rounded-2xl border border-border/50 shadow-sm">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-lg text-center">
              {error}
            </div>
          )}
          
          <div>
            <label className="text-sm font-medium mb-1.5 block">Full Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow" 
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow" 
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow" 
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-semibold rounded-lg shadow hover:bg-primary/90 transition-colors mt-2 disabled:opacity-50"
          >
            {isLoading ? "Creating account..." : "Create account"}
          </button>
          
          <div className="text-center text-sm text-muted-foreground pt-4">
            Already have an account? <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 font-medium">Log in</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
