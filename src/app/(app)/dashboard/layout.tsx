import type { ReactNode } from "react";
import { RequireAuth } from "@/components/auth/require-auth";

// The session is resolved client-side from an HttpOnly cookie.
export const instant = false;

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <RequireAuth roles={["mentee", "mentor"]}>{children}</RequireAuth>;
}
