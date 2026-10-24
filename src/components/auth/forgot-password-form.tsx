"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { forgotPassword } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/errors";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }

    setSubmitting(true);

    try {
      await forgotPassword({ email: trimmedEmail });
      setSent(true);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-5">
        <Alert tone="success">
          Si el correo está registrado, recibirás un enlace para restablecer tu
          contraseña. Revisa también tu carpeta de spam.
        </Alert>
        <Link
          href="/login"
          className="text-brand-700 inline-flex text-sm font-semibold underline-offset-4 hover:underline"
        >
          Volver a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <TextField
        id="email"
        label="Correo electrónico"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="tu@correo.com"
        hint="Te enviaremos un enlace de un solo uso."
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />

      {error ? <Alert tone="error">{error}</Alert> : null}

      <Button type="submit" size="lg" className="w-full" loading={submitting}>
        Enviar enlace
      </Button>

      <p className="text-muted text-center text-sm">
        <Link
          href="/login"
          className="text-brand-700 font-semibold underline-offset-4 hover:underline"
        >
          Volver a iniciar sesión
        </Link>
      </p>
    </form>
  );
}
