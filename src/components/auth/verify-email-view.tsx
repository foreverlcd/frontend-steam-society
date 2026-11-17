"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClassName } from "@/components/ui/button";
import { verifyEmail } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/auth-context";
import { homePathForRole } from "@/lib/auth/roles";

type VerifyState = "idle" | "submitting" | "verified" | "failed";

/**
 * Landing page of the emailed link. The token is single-use, so it is sent
 * on an explicit click: mail scanners that open links do not burn it.
 */
export function VerifyEmailView() {
  const token = useSearchParams().get("token") ?? "";
  const { user, refresh } = useAuth();
  const [state, setState] = useState<VerifyState>("idle");
  const [error, setError] = useState<string | null>(null);
  const continueHref = user ? homePathForRole(user.role) : "/login";

  async function handleVerify() {
    setState("submitting");
    setError(null);

    try {
      await verifyEmail(token);
    } catch (caught) {
      setError(getErrorMessage(caught));
      setState("failed");
      return;
    }

    setState("verified");
    // The token is spent: refresh the banner state, but never show a failure.
    if (user) await refresh().catch(() => undefined);
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-5 py-10">
      <Logo />
      <header className="space-y-2">
        <h1 className="text-ink text-3xl font-semibold tracking-tight">
          Confirma tu correo
        </h1>
        <p className="text-muted text-sm leading-6">
          Así sabemos que el correo es tuyo y podemos avisarte de tus reservas.
        </p>
      </header>

      {!token ? (
        <Alert tone="error">
          Este enlace no está completo. Ábrelo de nuevo desde el correo o pide
          uno nuevo desde tu cuenta.
        </Alert>
      ) : null}

      {state === "verified" ? (
        <>
          <Alert tone="success">Listo, tu correo quedó confirmado.</Alert>
          <Link
            href={continueHref}
            className={buttonClassName({ size: "lg", className: "w-full" })}
          >
            {user ? "Continuar" : "Iniciar sesión"}
          </Link>
        </>
      ) : token ? (
        <>
          {error ? <Alert tone="error">{error}</Alert> : null}
          <Button
            type="button"
            size="lg"
            className="w-full"
            loading={state === "submitting"}
            onClick={() => void handleVerify()}
          >
            Confirmar mi correo
          </Button>
        </>
      ) : null}

      {state === "failed" || !token ? (
        <Link
          href={continueHref}
          className="text-brand-700 text-center text-sm font-semibold underline-offset-4 hover:underline"
        >
          {user ? "Ir a mi cuenta" : "Ir a iniciar sesión"}
        </Link>
      ) : null}
    </main>
  );
}
