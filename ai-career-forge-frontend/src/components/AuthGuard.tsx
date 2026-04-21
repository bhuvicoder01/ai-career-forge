"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";
import api from "@/lib/api";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, needsOnboarding, setNeedsOnboarding } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      if (isAuthenticated) {
        try {
          // Validate session and check onboarding status
          const [, onboardingRes] = await Promise.all([
            api.get("/profile"),
            api.get("/profile/onboarding-status"),
          ]);
          const { needsOnboarding: needs } = onboardingRes.data;
          setNeedsOnboarding(needs);
        } catch (error) {
          // 401 is handled by api interceptor
          console.error("Session check failed", error);
        }
      }
      setIsReady(true);
    };

    checkSession();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isReady) return;

    const isAuthRoute = pathname.startsWith("/auth");
    const isOnboardingRoute = pathname === "/auth/onboarding";
    const isDashboardRoute = pathname.startsWith("/dashboard");

    if (isDashboardRoute && !isAuthenticated) {
      // Not logged in → send to login
      router.replace("/auth/login");
    } else if (isDashboardRoute && isAuthenticated && needsOnboarding) {
      // Logged in but needs onboarding → send to onboarding
      router.replace("/auth/onboarding");
    } else if (isOnboardingRoute && isAuthenticated && !needsOnboarding) {
      // Already completed onboarding → send to dashboard
      router.replace("/dashboard");
    } else if (isAuthRoute && !isOnboardingRoute && isAuthenticated) {
      // On login/register page but already authenticated
      if (needsOnboarding) {
        router.replace("/auth/onboarding");
      } else {
        router.replace("/dashboard");
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
