"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";
import api from "@/lib/api";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, needsOnboarding, setNeedsOnboarding, setToken, setAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = searchParams.get("token");
      const tempPass = searchParams.get("tempPass");

      if (token) {
        setToken(token);
        if (tempPass) {
          sessionStorage.setItem("zenith_temp_pass", tempPass);
        }
      }

      if (token || isAuthenticated) {
        try {
          // Validate session and fetch full user info
          const userRes = await api.get("/auth/me");
          const { userId, name, email, role, needsOnboarding: needs } = userRes.data;
          
          setAuth({ id: userId, name, email, role }, token || isAuthenticated ? (token || useAuthStore.getState().token!) : "", needs);
          setNeedsOnboarding(needs);
        } catch (error) {
          console.error("Session check failed", error);
        }
      }
      
      setIsReady(true);

      // Clean the URL if token was present
      if (token) {
        const nextUrl = pathname;
        router.replace(nextUrl);
      }
    };

    initializeAuth();
  }, [isAuthenticated, searchParams]);

  useEffect(() => {
    if (!isReady) return;

    const isAuthRoute = pathname.startsWith("/auth");
    const isOnboardingRoute = pathname === "/auth/onboarding";
    const isUserDashboard = pathname.startsWith("/dashboard");
    const isRecruiterDashboard = pathname.startsWith("/recruiter");
    const isAdminDashboard = pathname.startsWith("/admin");

    if ((isUserDashboard || isRecruiterDashboard || isAdminDashboard) && !isAuthenticated) {
      // Not logged in → send to login
      router.replace("/auth/login");
      return;
    }

    if (isAuthenticated) {
      // Role-based access control
      if (user?.role === "RECRUITER") {
        if (!isRecruiterDashboard) {
          router.replace("/recruiter/dashboard");
        }
      } else if (user?.role === "ADMIN") {
        if (!isAdminDashboard) {
          router.replace("/admin/dashboard");
        }
      } else {
        // Standard USER
        if (isRecruiterDashboard || isAdminDashboard) {
           router.replace("/dashboard");
        } else if (needsOnboarding && !isOnboardingRoute) {
           router.replace("/auth/onboarding");
        } else if (!needsOnboarding && isOnboardingRoute) {
           router.replace("/dashboard");
        } else if (isAuthRoute && !isOnboardingRoute) {
           router.replace("/dashboard");
        }
      }
    }
  }, [isAuthenticated, needsOnboarding, pathname, router, isReady]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}
