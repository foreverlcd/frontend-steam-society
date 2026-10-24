import { Suspense } from "react";
import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Nueva contraseña",
};

// The session is resolved client-side from an HttpOnly cookie.
export const instant = false;

export default function ResetPasswordPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-brand-700 text-xs font-semibold tracking-[0.18em] uppercase">
          Casi listo
        </p>
        <h1 className="text-ink text-3xl font-semibold tracking-tight">
          Crea una nueva contraseña
        </h1>
        <p className="text-muted text-sm leading-6">
          Elige una contraseña segura de al menos 12 caracteres.
        </p>
      </header>

      <Suspense
        fallback={<p className="text-muted text-sm">Cargando enlace...</p>}
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
