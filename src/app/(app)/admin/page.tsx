import { AdminView } from "@/components/admin/admin-view";

// The session is resolved client-side from an HttpOnly cookie.
export const instant = false;

export default function AdminPage() {
  return <AdminView />;
}
