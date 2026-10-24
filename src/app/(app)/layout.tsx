import type { ReactNode } from "react";
import { RequireAuth } from "@/components/auth/require-auth";
import { AppHeader } from "@/components/layout/app-header";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <div className="min-h-dvh">
        <AppHeader />
        <main>{children}</main>
      </div>
    </RequireAuth>
  );
}
