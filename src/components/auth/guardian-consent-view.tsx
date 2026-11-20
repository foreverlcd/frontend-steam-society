"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { confirmGuardianConsent } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/errors";

type ConsentState = "idle" | "submitting" | "confirmed" | "failed";

/**
 * Landing page of the link e-mailed to the parent or guardian of an under-14
 * user. Opening it changes nothing: the adult reads what they authorize and
 * confirms with an explicit click (mail scanners do not burn the token).
 */
export function GuardianConsentView() {
  const token = useSearchParams().get("token") ?? "";
  const [state, setState] = useState<ConsentState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setState("submitting");
    setError(null);

    try {
      await confirmGuardianConsent(token);
      setState("confirmed");
    } catch (caught) {
      setError(getErrorMessage(caught));
      setState("failed");
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-6 px-5 py-10">
      <Logo />
      <header className="space-y-2">
        <h1 className="text-ink text-3xl font-semibold tracking-tight">
          Autoriza la cuenta de tu hija o hijo
        </h1>
        <p className="text-muted text-sm leading-6">
          Una persona menor de 14 años creó una cuenta en Steam Society y nos
          dio tu correo. La ley peruana pide tu autorización para que usemos sus
          datos.
        </p>
      </header>

      <section className="border-line space-y-3 rounded-2xl border bg-white p-5 text-sm leading-6">
        <h2 className="text-ink font-semibold">Qué autorizas</h2>
        <ul className="text-muted list-disc space-y-1 pl-5">
          <li>
            Que use Steam Society para conversar 1 a 1 por videollamada con
            mentoras de ciencia, tecnología, ingeniería, arte y matemáticas.
          </li>
          <li>
            Que guardemos los datos de su cuenta: nombre, correo, fecha de
            nacimiento, sus intereses y sus reservas.
          </li>
          <li>
            Las videollamadas no se graban y el chat de la llamada no se guarda.
          </li>
        </ul>
        <p className="text-muted">
          Lee la{" "}
          <Link
            href="/privacidad"
            className="text-brand-700 font-semibold underline-offset-4 hover:underline"
          >
            política de privacidad
          </Link>{" "}
          y los{" "}
          <Link
            href="/terminos"
            className="text-brand-700 font-semibold underline-offset-4 hover:underline"
          >
            términos
          </Link>
          . Si después cambias de opinión, escríbenos desde{" "}
          <Link
            href="/help"
            className="text-brand-700 font-semibold underline-offset-4 hover:underline"
          >
            Ayuda
          </Link>{" "}
          y eliminaremos la cuenta.
        </p>
      </section>

      {!token ? (
        <Alert tone="error">
          Este enlace no está completo. Ábrelo de nuevo desde el correo.
        </Alert>
      ) : null}

      {state === "confirmed" ? (
        <Alert tone="success">
          Gracias. La cuenta quedó autorizada y ya puede reservar sesiones.
        </Alert>
      ) : token ? (
        <>
          {error ? <Alert tone="error">{error}</Alert> : null}
          <Button
            type="button"
            size="lg"
            className="w-full"
            loading={state === "submitting"}
            onClick={() => void handleConfirm()}
          >
            Autorizo
          </Button>
          <p className="text-muted text-center text-xs leading-5">
            Si no conoces esta cuenta o no quieres autorizarla, cierra esta
            página. No se hará nada.
          </p>
        </>
      ) : null}
    </main>
  );
}
