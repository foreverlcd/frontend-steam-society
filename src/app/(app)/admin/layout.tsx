import type { ReactNode } from "react";
import { RequireAuth } from "@/components/auth/require-auth";

// The session is resolved client-side from an HttpOnly cookie.
export const instant = false;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <RequireAuth roles={["admin"]}>{children}</RequireAuth>;
}
