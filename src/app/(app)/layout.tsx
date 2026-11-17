import type { ReactNode } from "react";
import { EmailVerificationBanner } from "@/components/auth/email-verification-banner";
import { RequireAuth } from "@/components/auth/require-auth";
import { AppHeader } from "@/components/layout/app-header";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <div className="min-h-dvh">
        <AppHeader />
        <EmailVerificationBanner />
        <main>{children}</main>
      </div>
    </RequireAuth>
  );
}
