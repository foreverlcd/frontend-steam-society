import { AdminView } from "@/components/admin/admin-view";
import { RequireAuth } from "@/components/auth/require-auth";

// The session is resolved client-side from an HttpOnly cookie.
export const instant = false;

export default function AdminMentorsPage() {
  return (
    <RequireAuth roles={["admin"]}>
      <AdminView />
    </RequireAuth>
  );
}
