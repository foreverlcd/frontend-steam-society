import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

// The session is resolved client-side from an HttpOnly cookie.
export const instant = false;

export default function LoginPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-brand-700 text-xs font-semibold tracking-[0.18em] uppercase">
          Bienvenida de nuevo
        </p>
        <h1 className="text-ink text-3xl font-semibold tracking-tight">
          Inicia sesión
        </h1>
        <p className="text-muted text-sm leading-6">
          Entra para continuar tu camino en Steam Society.
        </p>
      </header>

      <LoginForm />

      <p className="text-muted text-center text-sm">
        ¿Aún no tienes cuenta?{" "}
        <Link
          href="/register"
          className="text-brand-700 font-semibold underline-offset-4 hover:underline"
        >
          Crear una cuenta
        </Link>
      </p>
    </div>
  );
}
