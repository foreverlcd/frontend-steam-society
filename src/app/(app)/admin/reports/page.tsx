import { AdminReportsView } from "@/components/admin/admin-reports-view";
import { RequireAuth } from "@/components/auth/require-auth";

// The session is resolved client-side from an HttpOnly cookie.
export const instant = false;

export default function AdminReportsPage() {
  return (
    <RequireAuth roles={["admin"]}>
      <AdminReportsView />
    </RequireAuth>
  );
}
