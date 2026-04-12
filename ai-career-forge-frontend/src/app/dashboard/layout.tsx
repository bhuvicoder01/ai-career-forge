"use client";

import Link from "next/link";
import { User, Briefcase, FileText, CheckCircle, LogOut, BetweenHorizonalStart, BetweenHorizonalEnd } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import useAuthStore from "@/store/useAuthStore";

import AuthGuard from "@/components/AuthGuard";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const [isMobile, setIsMobile] = useState(false);

 window.addEventListener('resize',()=>{
  if(window.screen.width> 768){
    setIsMobile(false);
  }
  else{
    setIsMobile(true);
  }
})

  return (
    <>
      <div className="flexbox">
        <nav className="flex navbar justify-between bg-card border-r border-border">
         
          <Link href="/" className="flex nav-logo items-center gap-3 hover:opacity-80 transition-opacity">
            <Image src="/logo-transparent.png" alt="CareerForge Logo" width={56} height={56} className="object-contain" />
            <div className="font-bold text-xl tracking-tighter text-blue-400">CareerForge</div>
          </Link>
          <nav className="flex nav-links justify-between space-y-2">
            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary text-secondary-foreground font-medium">
              <User className="w-5 h-5" /> {!isMobile?'Profile':''}
            </Link>
            <Link href="/dashboard/jobs" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary text-secondary-foreground font-medium">
              <Briefcase className="w-5 h-5" /> {!isMobile?'Job Matches':''}
            </Link>
            <Link href="/dashboard/applications" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary text-secondary-foreground font-medium">
              <CheckCircle className="w-5 h-5" /> {!isMobile?'Tracker':''}
            </Link>
            
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-red-500/10 text-red-500 font-medium transition-colors mt-8"
            >
              <LogOut className="w-5 h-5" /> {!isMobile?'Logout':''}
            </button>
          </nav>
          {/* <div className="border-t border-border pt-4 text-sm text-muted-foreground">
            Agent Status: <span className="text-green-400 font-semibold inline-flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 inline-block mr-2 animate-pulse"></span> Active</span>
          </div> */}
        </nav>
        <main className="flex-1 bg-background p-8 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </>
  )
}
