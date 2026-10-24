"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClassName } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { resetPassword } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/errors";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 12) {
      setError("La contraseña debe tener al menos 12 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setSubmitting(true);

    try {
      await resetPassword({ token, password });
      setSuccess(true);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="space-y-5">
        <Alert tone="error">
          Este enlace no incluye un token de recuperación válido.
        </Alert>
        <Link
          href="/forgot-password"
          className={buttonClassName({ className: "w-full" })}
        >
          Solicitar un enlace nuevo
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-5">
        <Alert tone="success">
          Tu contraseña se actualizó. Ya puedes iniciar sesión con la nueva.
        </Alert>
        <Link
          href="/login"
          className={buttonClassName({ className: "w-full" })}
        >
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <TextField
        id="password"
        label="Nueva contraseña"
        type="password"
        autoComplete="new-password"
        hint="Mínimo 12 caracteres."
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />

      <TextField
        id="confirmPassword"
        label="Repite la nueva contraseña"
        type="password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        required
      />

      {error ? <Alert tone="error">{error}</Alert> : null}

      <Button type="submit" size="lg" className="w-full" loading={submitting}>
        Guardar contraseña
      </Button>

      <p className="text-muted text-center text-sm">
        <Link
          href="/forgot-password"
          className="text-brand-700 font-semibold underline-offset-4 hover:underline"
        >
          Solicitar otro enlace
        </Link>
      </p>
    </form>
  );
}
