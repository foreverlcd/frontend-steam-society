import { DashboardView } from "@/components/dashboard/dashboard-view";

// The session is resolved client-side from an HttpOnly cookie.
export const instant = false;

export default function DashboardPage() {
  return <DashboardView />;
}
