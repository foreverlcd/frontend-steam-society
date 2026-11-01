import { RequireAuth } from "@/components/auth/require-auth";
import { AvailabilityView } from "@/components/dashboard/availability-view";

export const instant = false;

export default function AvailabilityPage() {
  return (
    <RequireAuth roles={["mentor"]}>
      <AvailabilityView />
    </RequireAuth>
  );
}
