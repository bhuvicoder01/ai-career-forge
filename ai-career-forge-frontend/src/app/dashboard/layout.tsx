"use client";

import Link from "next/link";
import { User, Briefcase, FileText, CheckCircle, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import useAuthStore from "@/store/useAuthStore";

import AuthGuard from "@/components/AuthGuard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <aside className="w-64 bg-card border-r border-border p-6 flex flex-col gap-6">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Image src="/logo-transparent.png" alt="CareerForge Logo" width={40} height={40} className="object-contain" />
            <div className="font-bold text-xl tracking-tighter text-blue-400">CareerForge</div>
          </Link>
          <nav className="flex-1 space-y-2">
            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary text-secondary-foreground font-medium">
              <User className="w-5 h-5" /> Profile
            </Link>
            <Link href="/dashboard/jobs" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary text-secondary-foreground font-medium">
              <Briefcase className="w-5 h-5" /> Job Matches
            </Link>
            <Link href="/dashboard/applications" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary text-secondary-foreground font-medium">
              <CheckCircle className="w-5 h-5" /> Tracker
            </Link>
            
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-red-500/10 text-red-500 font-medium transition-colors mt-8"
            >
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </nav>
          <div className="border-t border-border pt-4 text-sm text-muted-foreground">
            Agent Status: <span className="text-green-400 font-semibold inline-flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 inline-block mr-2 animate-pulse"></span> Active</span>
          </div>
        </aside>
        <main className="flex-1 bg-background p-8 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </AuthGuard>
  )
}
