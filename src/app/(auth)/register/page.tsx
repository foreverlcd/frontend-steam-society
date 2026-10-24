import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Crear cuenta",
};

// The session is resolved client-side from an HttpOnly cookie.
export const instant = false;

export default function RegisterPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-brand-700 text-xs font-semibold tracking-[0.18em] uppercase">
          Tu próximo paso
        </p>
        <h1 className="text-ink text-3xl font-semibold tracking-tight">
          Crea tu cuenta
        </h1>
        <p className="text-muted text-sm leading-6">
          Cuéntanos un poco de ti. Después podrás completar tu perfil y elegir
          tus intereses.
        </p>
      </header>

      <RegisterForm />

      <p className="text-muted text-center text-sm">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          className="text-brand-700 font-semibold underline-offset-4 hover:underline"
        >
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
