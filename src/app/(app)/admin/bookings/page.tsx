import { Suspense } from "react";
import { AdminBookingsView } from "@/components/admin/admin-bookings-view";
import { RequireAuth } from "@/components/auth/require-auth";

// The session is resolved client-side from an HttpOnly cookie.
export const instant = false;

export default function AdminBookingsPage() {
  return (
    <RequireAuth roles={["admin"]}>
      {/* useSearchParams (person filter) must render inside Suspense. */}
      <Suspense
        fallback={<p className="text-muted px-5 py-10 text-sm">Cargando...</p>}
      >
        <AdminBookingsView />
      </Suspense>
    </RequireAuth>
  );
}
