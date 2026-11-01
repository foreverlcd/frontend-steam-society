import { RequireAuth } from "@/components/auth/require-auth";
import { ProfileView } from "@/components/dashboard/profile-view";

export const instant = false;

export default function ProfilePage() {
  return (
    <RequireAuth roles={["mentee", "mentor"]}>
      <ProfileView />
    </RequireAuth>
  );
}
