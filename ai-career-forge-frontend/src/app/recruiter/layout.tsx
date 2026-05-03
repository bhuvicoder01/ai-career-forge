"use client";

import Link from "next/link";
import { 
  Users, Briefcase, LayoutDashboard, LogOut, Menu, X, 
  Settings, Bell, Search, PlusCircle, PieChart
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import useAuthStore from "@/store/useAuthStore";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const navLinks = [
    { href: "/recruiter/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/recruiter/jobs", label: "My Postings", icon: Briefcase },
    { href: "/recruiter/applicants", label: "Talent Pool", icon: Users },
    { href: "/recruiter/analytics", label: "Insights", icon: PieChart },
    { href: "/recruiter/settings", label: "Settings", icon: Settings },
  ];

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen bg-background font-sans">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full p-6">
          <div className="mb-10">
            <Link href="/recruiter/dashboard" className="flex items-center gap-3">
              <Image 
                src={resolvedTheme === 'dark' ? "/zenith-dark.png" : "/zenith-light.png"} 
                alt="Zenith" 
                width={120} 
                height={40} 
                className="w-auto h-auto"
              />
            </Link>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-2">Recruitment Terminal</p>
          </div>

          <nav className="flex-1 space-y-2">
            {navLinks.map((link) => (
              <Link 
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold border ${
                  pathname === link.href 
                    ? "bg-foreground text-background border-transparent shadow-lg" 
                    : "hover:bg-secondary text-muted-foreground hover:text-foreground border-transparent"
                }`}
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-border">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/30 mb-6">
              <div className="w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center font-black">
                {user?.name?.[0] || 'R'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black truncate">{user?.name || "Recruiter"}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest truncate">Talent Acquisition</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-destructive/10 text-destructive text-xs font-black uppercase tracking-widest hover:bg-destructive hover:text-white transition-all"
            >
              <LogOut className="w-4 h-4" /> Terminate Session
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 lg:pl-72 w-full overflow-hidden">
        <header className="h-20 border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-40 px-6 md:px-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-secondary"
            >
              {isSidebarOpen ? <X /> : <Menu />}
            </button>
            <div className="hidden md:flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-xl border border-border w-64 lg:w-96">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search candidates or jobs..." 
                className="bg-transparent border-none focus:outline-none text-sm w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
             <button className="relative p-2 rounded-xl hover:bg-secondary transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></span>
             </button>
             <Link 
               href="/recruiter/jobs/new"
               className="hidden md:flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-foreground/10"
             >
                <PlusCircle className="w-4 h-4" /> Post New Mission
             </Link>
          </div>
        </header>

        <main className="p-6 md:p-10 w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
