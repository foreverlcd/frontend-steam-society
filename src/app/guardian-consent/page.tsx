import { Suspense } from "react";
import type { Metadata } from "next";
import { FullPageStatus } from "@/components/auth/full-page-status";
import { GuardianConsentView } from "@/components/auth/guardian-consent-view";

export const metadata: Metadata = {
  title: "Autoriza la cuenta",
  robots: { index: false, follow: false },
  // The URL carries a single-use token: never send it as a Referer.
  referrer: "no-referrer",
};

// Public: the adult has no account and opens the link from their e-mail.
export const instant = false;

export default function GuardianConsentPage() {
  return (
    <Suspense fallback={<FullPageStatus message="Cargando enlace..." />}>
      <GuardianConsentView />
    </Suspense>
  );
}
