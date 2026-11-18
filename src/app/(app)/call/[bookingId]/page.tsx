import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/require-auth";
import { CallView } from "@/components/call/call-view";

export const metadata: Metadata = {
  title: "Videollamada",
};

// The session is resolved client-side from an HttpOnly cookie.
export const instant = false;

export default async function CallPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;

  return (
    <RequireAuth roles={["mentee", "mentor"]}>
      <CallView bookingId={bookingId} />
    </RequireAuth>
  );
}
