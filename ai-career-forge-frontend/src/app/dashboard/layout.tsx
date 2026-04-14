"use client";

import Link from "next/link";
import { User, Briefcase, FileText, CheckCircle, LogOut, Menu, X } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import useAuthStore from "@/store/useAuthStore";

import AuthGuard from "@/components/AuthGuard";
import FloatingAiAssistant from "@/components/FloatingAiAssistant";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);

  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar when clicking a link (on mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: "/dashboard", label: "Profile", icon: User },
    { href: "/dashboard/jobs", label: "Job Matches", icon: Briefcase },
    { href: "/dashboard/applications", label: "Tracker", icon: CheckCircle },
  ];

  return (
    <>
      <div className={`flexbox ${isMobile ? 'flex-col' : ''}`}>
        {/* Desktop Sidebar / Mobile Top Bar */}
        <nav className={`flex navbar ${isMobile ? 'flex-row items-center px-4 py-2 w-full border-b' : 'flex-col border-r'} justify-between bg-card border-border`}>
          
          <div className="flex items-center justify-between w-full md:w-auto">
            <Link href="/" className="flex nav-logo items-center gap-3 hover:opacity-80 transition-opacity">
              <Image src="/logo-transparent.png" alt="CareerForge Logo" width={48} height={48} className="object-contain" />
              <div className="font-bold text-xl tracking-tighter text-blue-400">CareerForge</div>
            </Link>

            {isMobile && (
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-md hover:bg-secondary text-secondary-foreground transition-colors"
                aria-label="Toggle Menu"
              >
                {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
          </div>

          {!isMobile && (
            <div className="flex flex-col flex-1 mt-8 space-y-2 nav-links">
              {navLinks.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium ${
                    pathname === link.href 
                      ? "bg-secondary text-blue-400" 
                      : "hover:bg-secondary/50 text-secondary-foreground/70 hover:text-secondary-foreground"
                  }`}
                >
                  <link.icon className="w-5 h-5" /> {link.label}
                </Link>
              ))}
              
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-red-500/10 text-red-500 font-medium transition-colors mt-auto mb-4"
              >
                <LogOut className="w-5 h-5" /> Logout
              </button>
            </div>
          )}
        </nav>

        {/* Mobile Sidebar Overlay */}
        {isMobile && (
          <div 
            className={`fixed inset-0 z-[1100] transition-opacity duration-300 ${
              isSidebarOpen ? 'bg-black/40 backdrop-blur-sm opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setIsSidebarOpen(false)}
          >
            <div 
              className={`fixed left-0 top-0 bottom-0 w-[280px] glass p-6 flex flex-col transition-transform duration-300 ease-in-out ${
                isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-8">
                <Image src="/logo-transparent.png" alt="Logo" width={40} height={40} />
                <span className="font-bold text-lg text-blue-400">CareerForge</span>
              </div>

              <div className="flex flex-col space-y-3">
                {navLinks.map((link) => (
                  <Link 
                    key={link.href}
                    href={link.href} 
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium ${
                      pathname === link.href 
                        ? "bg-blue-500/20 text-blue-400" 
                        : "hover:bg-white/10 text-secondary-foreground/70"
                    }`}
                  >
                    <link.icon className="w-5 h-5" /> {link.label}
                  </Link>
                ))}
              </div>

              <div className="mt-auto pt-6 border-t border-white/10">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-500 font-medium transition-colors"
                >
                  <LogOut className="w-5 h-5" /> Logout
                </button>
              </div>
            </div>
          </div>
        )}

        <main className={`flex-1 bg-background ${isMobile ? 'p-4' : 'p-8'} overflow-y-auto w-full`}>
          {children}
        </main>
      </div>
      <FloatingAiAssistant />
    </>
  );
}
