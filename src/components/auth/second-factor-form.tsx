"use client";

import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { getErrorMessage } from "@/lib/api/errors";
import { isApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";

type ProofKind = "code" | "recoveryCode";

/** Second login step: authenticator code, or a recovery code as fallback. */
export function SecondFactorForm({ onRestart }: { onRestart: () => void }) {
  const { completeSecondFactor } = useAuth();
  const [proofKind, setProofKind] = useState<ProofKind>("code");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [challengeExpired, setChallengeExpired] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const trimmed = value.replace(/\s+/g, "");

    if (proofKind === "code" && !/^\d{6}$/.test(trimmed)) {
      setError("Ingresa los 6 dígitos que muestra tu app.");
      return;
    }

    if (proofKind === "recoveryCode" && trimmed.length < 10) {
      setError("Ingresa uno de tus códigos de recuperación.");
      return;
    }

    setSubmitting(true);

    try {
      await completeSecondFactor(
        proofKind === "code" ? { code: trimmed } : { recoveryCode: trimmed },
      );
    } catch (caught) {
      setChallengeExpired(
        isApiError(caught) && caught.code === "MFA_CHALLENGE_EXPIRED",
      );
      setError(getErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  function switchProof() {
    setProofKind((current) => (current === "code" ? "recoveryCode" : "code"));
    setValue("");
    setError(null);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <p className="text-muted text-sm leading-6">
        {proofKind === "code"
          ? "Abre tu app de autenticación y escribe el código de 6 dígitos de Steam Society."
          : "Escribe uno de los códigos de recuperación que guardaste. Cada uno sirve una sola vez."}
      </p>

      {proofKind === "code" ? (
        <TextField
          key="code"
          id="mfa-code"
          label="Código de verificación"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          autoFocus
          required
        />
      ) : (
        <TextField
          key="recovery"
          id="mfa-recovery-code"
          label="Código de recuperación"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="ABCDE-FGHIJ"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          autoFocus
          required
        />
      )}

      {error ? <Alert tone="error">{error}</Alert> : null}

      {challengeExpired ? (
        <Button type="button" size="lg" className="w-full" onClick={onRestart}>
          Volver a iniciar sesión
        </Button>
      ) : (
        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          Verificar
        </Button>
      )}

      <div className="flex flex-col items-center gap-2 text-sm">
        <button
          type="button"
          onClick={switchProof}
          className="text-brand-700 min-h-11 font-medium underline-offset-4 hover:underline"
        >
          {proofKind === "code"
            ? "No tengo mi teléfono: usar un código de recuperación"
            : "Usar el código de mi app"}
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="text-muted min-h-11 underline-offset-4 hover:underline"
        >
          Volver
        </button>
      </div>
    </form>
  );
}
