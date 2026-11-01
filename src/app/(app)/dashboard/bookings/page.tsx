import { RequireAuth } from "@/components/auth/require-auth";
import { BookingsView } from "@/components/dashboard/bookings-view";

export const instant = false;

export default function BookingsPage() {
  return (
    <RequireAuth roles={["mentee", "mentor"]}>
      <BookingsView />
    </RequireAuth>
  );
}
