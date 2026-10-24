"use client";

import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { getErrorMessage } from "@/lib/api/errors";
import type { PublicRole } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/cn";

const ROLE_OPTIONS: Array<{
  value: PublicRole;
  label: string;
  description: string;
}> = [
  {
    value: "mentee",
    label: "Busco mentoría",
    description: "Quiero aprender y avanzar en mi camino STEAM.",
  },
  {
    value: "mentor",
    label: "Quiero ser mentora",
    description: "Quiero compartir mi experiencia con otras mujeres.",
  },
];

function todayIsoDate(): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${today.getFullYear()}-${month}-${day}`;
}

export function RegisterForm() {
  const { register } = useAuth();
  const [role, setRole] = useState<PublicRole>("mentee");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const maxBirthDate = todayIsoDate();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }

    if (!birthDate) {
      setError("Ingresa tu fecha de nacimiento.");
      return;
    }

    if (birthDate > maxBirthDate) {
      setError("La fecha de nacimiento no puede estar en el futuro.");
      return;
    }

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
      await register({
        email: trimmedEmail,
        password,
        role,
        birthDate,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <fieldset className="space-y-2">
        <legend className="text-ink text-sm font-medium">Quiero...</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {ROLE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={cn(
                "focus-within:ring-brand-500/30 cursor-pointer rounded-xl border p-3 transition focus-within:ring-2",
                role === option.value
                  ? "border-brand-500 bg-brand-50 ring-brand-500/20 ring-2"
                  : "border-line hover:border-brand-300 bg-white",
              )}
            >
              <input
                type="radio"
                name="role"
                value={option.value}
                checked={role === option.value}
                onChange={() => setRole(option.value)}
                className="sr-only"
              />
              <span className="text-ink block text-sm font-semibold">
                {option.label}
              </span>
              <span className="text-muted mt-0.5 block text-xs">
                {option.description}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="firstName"
          label="Nombre (opcional)"
          autoComplete="given-name"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
        />
        <TextField
          id="lastName"
          label="Apellido (opcional)"
          autoComplete="family-name"
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
        />
      </div>

      <TextField
        id="email"
        label="Correo electrónico"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="tu@correo.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />

      <TextField
        id="birthDate"
        label="Fecha de nacimiento"
        type="date"
        autoComplete="bday"
        max={maxBirthDate}
        value={birthDate}
        onChange={(event) => setBirthDate(event.target.value)}
        required
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="password"
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          hint="Mínimo 12 caracteres."
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <TextField
          id="confirmPassword"
          label="Repite la contraseña"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}

      <Button type="submit" size="lg" className="w-full" loading={submitting}>
        Crear cuenta
      </Button>
    </form>
  );
}
