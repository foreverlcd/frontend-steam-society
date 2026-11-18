import { AdminPeopleView } from "@/components/admin/admin-people-view";
import { RequireAuth } from "@/components/auth/require-auth";

// The session is resolved client-side from an HttpOnly cookie.
export const instant = false;

export default function AdminPeoplePage() {
  return (
    <RequireAuth roles={["admin"]}>
      <AdminPeopleView />
    </RequireAuth>
  );
}
