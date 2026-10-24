"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { homePathForRole } from "@/lib/auth/roles";
import { AuthError } from "./auth-error";
import { FullPageStatus } from "./full-page-status";

export function RequireGuest({ children }: { children: ReactNode }) {
  const { user, status, error, refresh } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace(homePathForRole(user.role));
    }
  }, [router, status, user]);

  if (status === "loading") {
    return <FullPageStatus message="Comprobando tu sesión..." />;
  }

  if (status === "error") {
    return <AuthError message={error} onRetry={refresh} />;
  }

  if (status === "authenticated" && user) {
    return <FullPageStatus message="Redirigiendo..." />;
  }

  return <>{children}</>;
}
