"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { FullPageStatus } from "./full-page-status";

export const SECURITY_PATH = "/account/security";

/**
 * Admin screens need 2FA (ADR-024). The API enforces it with 403
 * MFA_ENROLLMENT_REQUIRED; this sends the admin to set it up first.
 */
export function RequireMfaEnrollment({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const enrolled = user?.mfaEnabled ?? false;

  useEffect(() => {
    if (user && !enrolled) {
      router.replace(`${SECURITY_PATH}?required=1`);
    }
  }, [enrolled, router, user]);

  if (!enrolled) {
    return (
      <FullPageStatus message="Primero activa la verificación en dos pasos..." />
    );
  }

  return <>{children}</>;
}
