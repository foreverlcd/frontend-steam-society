"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/errors";
import {
  sendFakePaymentResult,
  type FakePaymentOutcome,
} from "@/lib/api/payments";

function formatAmount(amount: string | null, currency: string | null): string {
  const minor = Number(amount);

  if (!Number.isFinite(minor) || !currency) {
    return "";
  }

  try {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency,
    }).format(minor / 100);
  } catch {
    return "";
  }
}

/**
 * Stand-in for a provider's hosted checkout while payments run with the fake
 * adapter. A real provider redirects to its own page instead.
 */
export function FakeCheckoutView() {
  const params = useSearchParams();
  const router = useRouter();
  const ref = params.get("ref");
  const amount = formatAmount(params.get("amount"), params.get("currency"));
  const [busy, setBusy] = useState<FakePaymentOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handle(outcome: FakePaymentOutcome) {
    if (!ref) {
      return;
    }

    setBusy(outcome);
    setError(null);

    try {
      await sendFakePaymentResult(ref, outcome);
      router.push(
        `/dashboard/bookings?payment=${outcome === "paid" ? "paid" : "failed"}`,
      );
    } catch (caught: unknown) {
      setError(getErrorMessage(caught));
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg px-5 py-10 sm:px-8">
      <p className="text-brand-700 text-xs font-semibold tracking-[0.18em] uppercase">
        Entorno de pruebas
      </p>
      <h1 className="text-ink mt-2 text-3xl font-semibold tracking-tight">
        Pago simulado
      </h1>
      <p className="text-muted mt-3 text-sm leading-6">
        Esta pantalla reemplaza a la pasarela mientras no haya un proveedor
        real. No se cobra dinero.
      </p>

      {!ref ? (
        <Alert tone="error" className="mt-6">
          Falta la referencia del pago. Vuelve a tus reservas e inténtalo otra
          vez.
        </Alert>
      ) : (
        <div className="border-line mt-6 rounded-2xl border bg-white p-5 shadow-sm">
          {amount ? (
            <p className="text-ink text-2xl font-semibold">{amount}</p>
          ) : null}
          <p className="text-muted mt-1 text-xs break-all">Referencia: {ref}</p>

          {error ? (
            <Alert tone="error" className="mt-4">
              {error}
            </Alert>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              type="button"
              loading={busy === "paid"}
              disabled={busy !== null}
              onClick={() => void handle("paid")}
            >
              Simular pago aprobado
            </Button>
            <Button
              type="button"
              variant="secondary"
              loading={busy === "failed"}
              disabled={busy !== null}
              onClick={() => void handle("failed")}
            >
              Simular pago rechazado
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
