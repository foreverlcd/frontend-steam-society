import { Suspense } from "react";
import type { Metadata } from "next";
import { SecurityView } from "@/components/account/security-view";

export const metadata: Metadata = {
  title: "Seguridad",
};

// The session is resolved client-side from an HttpOnly cookie.
export const instant = false;

export default function SecurityPage() {
  return (
    <Suspense fallback={null}>
      <SecurityView />
    </Suspense>
  );
}
