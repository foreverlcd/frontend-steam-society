import { AdminOverviewView } from "@/components/admin/admin-overview";
import { RequireAuth } from "@/components/auth/require-auth";

// The session is resolved client-side from an HttpOnly cookie.
export const instant = false;

export default function AdminPage() {
  return (
    <RequireAuth roles={["admin"]}>
      <AdminOverviewView />
    </RequireAuth>
  );
}
