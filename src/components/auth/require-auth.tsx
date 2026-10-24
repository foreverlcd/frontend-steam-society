"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { homePathForRole } from "@/lib/auth/roles";
import { AuthError } from "./auth-error";
import { FullPageStatus } from "./full-page-status";

export function RequireAuth({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: readonly UserRole[];
}) {
  const { user, status, error, refresh } = useAuth();
  const router = useRouter();
  const roleAllowed = !roles || (user ? roles.includes(user.role) : false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (
      status === "authenticated" &&
      user &&
      roles &&
      !roles.includes(user.role)
    ) {
      router.replace(homePathForRole(user.role));
    }
  }, [roles, router, status, user]);

  if (status === "loading") {
    return <FullPageStatus message="Comprobando tu sesión..." />;
  }

  if (status === "error") {
    return <AuthError message={error} onRetry={refresh} />;
  }

  if (status === "unauthenticated" || !user) {
    return <FullPageStatus message="Redirigiendo al inicio de sesión..." />;
  }

  if (!roleAllowed) {
    return <FullPageStatus message="Redirigiendo..." />;
  }

  return <>{children}</>;
}
