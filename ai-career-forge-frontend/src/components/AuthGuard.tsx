"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";
import api from "@/lib/api";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      if (isAuthenticated) {
        try {
          await api.get("/profile");
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

    // Basic route protection logic
    const isAuthRoute = pathname.startsWith("/auth");
    const isDashboardRoute = pathname.startsWith("/dashboard");

    if (isDashboardRoute && !isAuthenticated) {
      router.replace("/auth/login");
    } else if (isAuthRoute && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, pathname, router, isReady]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}
