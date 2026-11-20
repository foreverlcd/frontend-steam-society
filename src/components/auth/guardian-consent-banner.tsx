"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { resendGuardianConsent } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/auth-context";

type ResendState = "idle" | "editing" | "sending" | "sent";

/**
 * Under-14 users wait for their parent or guardian to authorize from the
 * e-mailed link; booking and submitting a profile are blocked until then.
 */
export function GuardianConsentBanner() {
  const { user } = useAuth();
  const [state, setState] = useState<ResendState>("idle");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!user?.guardianConsentPending) {
    return null;
  }

  async function resend(corrected?: string) {
    setState("sending");
    setError(null);
    try {
      await resendGuardianConsent(corrected);
      setState("sent");
    } catch (caught) {
      setError(getErrorMessage(caught));
      setState(corrected ? "editing" : "idle");
    }
  }

  function handleCorrect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = guardianEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Ingresa un correo válido.");
      return;
    }
    void resend(trimmed);
  }

  return (
    <div
      role="status"
      className="border-brand-200 bg-brand-50 text-brand-800 border-b"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-3 text-sm sm:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {state === "sent"
              ? "Listo, enviamos un enlace nuevo. El anterior ya no sirve."
              : "Tu madre, padre o tutor debe autorizar tu cuenta desde el correo que le enviamos. Hasta entonces no puedes reservar sesiones."}
            {error ? (
              <span className="text-danger-700 block">{error}</span>
            ) : null}
          </p>
          {state === "idle" || state === "sending" ? (
            <div className="flex shrink-0 gap-4">
              <button
                type="button"
                onClick={() => void resend()}
                disabled={state === "sending"}
                className="text-brand-700 min-h-11 font-semibold underline-offset-4 hover:underline disabled:opacity-60"
              >
                {state === "sending" ? "Enviando..." : "Reenviar enlace"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setState("editing");
                }}
                disabled={state === "sending"}
                className="text-brand-700 min-h-11 font-semibold underline-offset-4 hover:underline disabled:opacity-60"
              >
                Cambiar correo
              </button>
            </div>
          ) : null}
        </div>
        {state === "editing" ? (
          <form
            onSubmit={handleCorrect}
            noValidate
            className="flex flex-col gap-2 sm:flex-row sm:items-end"
          >
            <div className="sm:w-80">
              <TextField
                id="guardian-email-fix"
                label="Correo correcto de tu madre, padre o tutor"
                type="email"
                inputMode="email"
                autoComplete="off"
                value={guardianEmail}
                onChange={(event) => setGuardianEmail(event.target.value)}
              />
            </div>
            <Button type="submit">Enviar enlace</Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
