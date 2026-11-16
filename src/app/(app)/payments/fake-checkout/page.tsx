import { Suspense } from "react";
import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/require-auth";
import { FakeCheckoutView } from "@/components/payments/fake-checkout-view";

export const metadata: Metadata = {
  title: "Pago de prueba",
};

// The session is resolved client-side from an HttpOnly cookie.
export const instant = false;

export default function FakeCheckoutPage() {
  return (
    <RequireAuth roles={["mentee"]}>
      <Suspense
        fallback={<p className="text-muted px-5 py-10 text-sm">Cargando…</p>}
      >
        <FakeCheckoutView />
      </Suspense>
    </RequireAuth>
  );
}
