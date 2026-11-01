import { RequireAuth } from "@/components/auth/require-auth";
import { OfferingsView } from "@/components/dashboard/offerings-view";

export const instant = false;

export default function OfferingsPage() {
  return (
    <RequireAuth roles={["mentor"]}>
      <OfferingsView />
    </RequireAuth>
  );
}
