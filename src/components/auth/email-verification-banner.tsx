"use client";

import { useState } from "react";
import { resendEmailVerification } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/auth-context";

type ResendState = "idle" | "sending" | "sent" | "failed";

/** Reminds unverified users; booking and submitting a profile need it. */
export function EmailVerificationBanner() {
  const { user } = useAuth();
  const [state, setState] = useState<ResendState>("idle");
  const [error, setError] = useState<string | null>(null);

  if (!user || user.emailVerified) {
    return null;
  }

  async function handleResend() {
    setState("sending");
    setError(null);

    try {
      await resendEmailVerification();
      setState("sent");
    } catch (caught) {
      setError(getErrorMessage(caught));
      setState("failed");
    }
  }

  return (
    <div
      role="status"
      className="border-brand-200 bg-brand-50 text-brand-800 border-b"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>
          {state === "sent"
            ? `Te enviamos un enlace nuevo a ${user.email}. El anterior ya no sirve.`
            : `Confirma tu correo (${user.email}) para reservar o enviar tu perfil a revisión.`}
          {error ? (
            <span className="text-danger-700 block">{error}</span>
          ) : null}
        </p>
        {state !== "sent" ? (
          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={state === "sending"}
            className="text-brand-700 min-h-11 shrink-0 font-semibold underline-offset-4 hover:underline disabled:opacity-60"
          >
            {state === "sending" ? "Enviando..." : "Reenviar enlace"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
