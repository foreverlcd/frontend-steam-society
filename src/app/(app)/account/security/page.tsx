import { Suspense } from "react";
import type { Metadata } from "next";
import { AccountSections } from "@/components/account/account-sections";
import { SecurityView } from "@/components/account/security-view";

export const metadata: Metadata = {
  title: "Seguridad y cuenta",
};

// The session is resolved client-side from an HttpOnly cookie.
export const instant = false;

export default function SecurityPage() {
  return (
    <Suspense fallback={null}>
      <SecurityView />
      <AccountSections />
    </Suspense>
  );
}
