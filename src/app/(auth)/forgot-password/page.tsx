import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
};

// The session is resolved client-side from an HttpOnly cookie.
export const instant = false;

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-brand-700 text-xs font-semibold tracking-[0.18em] uppercase">
          Recupera tu acceso
        </p>
        <h1 className="text-ink text-3xl font-semibold tracking-tight">
          ¿Olvidaste tu contraseña?
        </h1>
        <p className="text-muted text-sm leading-6">
          Escribe el correo con el que te registraste y te enviaremos un enlace
          para crear una nueva.
        </p>
      </header>

      <ForgotPasswordForm />
    </div>
  );
}
