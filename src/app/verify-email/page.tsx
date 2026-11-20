import { Suspense } from "react";
import type { Metadata } from "next";
import { FullPageStatus } from "@/components/auth/full-page-status";
import { VerifyEmailView } from "@/components/auth/verify-email-view";

export const metadata: Metadata = {
  title: "Confirma tu correo",
  // The URL carries a single-use token: never send it as a Referer.
  referrer: "no-referrer",
};

// Works signed in or out: the link may be opened on another device.
export const instant = false;

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<FullPageStatus message="Cargando enlace..." />}>
      <VerifyEmailView />
    </Suspense>
  );
}
