"use client";

import { useEffect, useState } from "react";
import { 
  Settings, Bell, Shield, Moon, Sun, Monitor, Trash2, 
  Mail, Key, UserCircle, LogOut, ChevronRight, Sparkles,
  Zap, BrainCircuit, Globe, BellRing, Database
} from "lucide-react";
import { useTheme } from "next-themes";
import useAuthStore from "@/store/useAuthStore";
import { toast } from "sonner";
import api from "@/lib/api";

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  
  // Settings states
  const [notifications, setNotifications] = useState(true);
  const [matchingPrecision, setMatchingPrecision] = useState(80);
  const [autoSync, setAutoSync] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleLogout = () => {
    logout();
    window.location.href = "/auth/login";
  };

  const handleClearCache = async () => {
    try {
      // In a real app, this would hit an endpoint to clear vector search caches for the user
      toast.success("Vector search cache cleared");
    } catch (err) {
      toast.error("Failed to clear cache");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black flex items-center gap-4">
          <Settings className="w-10 h-10 text-primary" />
          System Controls
        </h1>
        <p className="text-muted-foreground font-medium">Manage your AI CareerForge experience and account security.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Navigation Sidebar */}
        <div className="space-y-2">
          {[
            { id: 'appearance', label: 'Appearance', icon: Moon },
            { id: 'account', label: 'Account', icon: UserCircle },
            { id: 'matching', label: 'Matching AI', icon: BrainCircuit },
            { id: 'security', label: 'Security', icon: Shield },
            { id: 'data', label: 'Data & Privacy', icon: Database },
          ].map((item) => (
            <button
              key={item.id}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all border ${
                item.id === 'appearance' 
                  ? 'bg-foreground text-background border-transparent shadow-lg' 
                  : 'text-muted-foreground hover:bg-secondary/50 border-transparent'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="md:col-span-2 space-y-10">
          {/* Appearance */}
          <section className="bg-card border border-border rounded-3xl p-8 space-y-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight">Appearance</h3>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { id: 'light', label: 'Light', icon: Sun },
                { id: 'dark', label: 'Dark', icon: Moon },
                { id: 'system', label: 'System', icon: Monitor },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setTheme(mode.id)}
                  className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                    theme === mode.id 
                      ? 'border-primary bg-primary/5 shadow-md' 
                      : 'border-border bg-secondary/20 hover:border-border/50'
                  }`}
                >
                  <mode.icon className="w-6 h-6" />
                  <span className="text-xs font-black uppercase tracking-wider">{mode.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* AI Matching Engine */}
          <section className="bg-card border border-border rounded-3xl p-8 space-y-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight">Matching Intelligence</h3>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">Matching Precision</p>
                  <p className="text-xs text-muted-foreground">Threshold for considering a job a 'match'.</p>
                </div>
                <div className="text-xl font-black text-amber-500">{matchingPrecision}%</div>
              </div>
              <input 
                type="range" 
                min="50" 
                max="100" 
                step="5"
                value={matchingPrecision}
                onChange={(e) => setMatchingPrecision(parseInt(e.target.value))}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-amber-500"
              />

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="font-bold">Aggressive Enrichment</p>
                    <p className="text-xs text-muted-foreground">Use more AI tokens for better insights.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setAutoSync(!autoSync)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${autoSync ? 'bg-primary' : 'bg-border'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${autoSync ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </section>

          {/* Account Security */}
          <section className="bg-card border border-border rounded-3xl p-8 space-y-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight">Security & Account</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-2xl border border-border/50">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Email Address</p>
                  <p className="font-bold">{user?.email}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>

              <button className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 rounded-2xl border border-transparent transition-all">
                <div className="flex items-center gap-4">
                  <Key className="w-5 h-5 text-muted-foreground" />
                  <span className="font-bold">Update Password</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-4 p-4 text-destructive hover:bg-destructive/10 rounded-2xl transition-all font-bold"
              >
                <LogOut className="w-5 h-5" />
                Logout Sessions
              </button>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="bg-destructive/5 border border-destructive/20 rounded-3xl p-8 space-y-6">
             <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-destructive" />
              <h3 className="text-xl font-black text-destructive uppercase tracking-tight">Danger Zone</h3>
            </div>
            
            <div className="flex items-center justify-between gap-6">
              <div className="flex-1">
                <p className="font-bold text-destructive">Erase Career Profile</p>
                <p className="text-xs text-destructive/70">Permanently delete your profile data, resume, and application history.</p>
              </div>
              <button className="px-6 py-3 bg-destructive text-destructive-foreground rounded-xl font-black shadow-lg shadow-destructive/20 hover:scale-105 transition-all">
                Delete Data
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
