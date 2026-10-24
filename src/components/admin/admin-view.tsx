"use client";

import { useAuth } from "@/lib/auth/auth-context";

export function AdminView() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8">
      <header className="max-w-2xl">
        <p className="text-brand-700 text-xs font-semibold tracking-[0.18em] uppercase">
          Administración
        </p>
        <h1 className="text-ink mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Panel de mentoras
        </h1>
        <p className="text-muted mt-3 text-sm leading-6">
          Desde aquí se revisarán y aprobarán los perfiles de las mentoras.
        </p>
      </header>

      <section className="border-line mt-8 rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-ink text-base font-semibold">
              Bandeja de revisión
            </h2>
            <p className="text-muted mt-1 max-w-xl text-sm leading-6">
              La bandeja de revisión todavía no está conectada en esta versión.
              La sesión de administración ya está activa.
            </p>
          </div>
          <span className="bg-brand-50 text-brand-700 inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold">
            Próximamente
          </span>
        </div>
      </section>

      <p className="text-muted mt-5 text-xs">
        Sesión iniciada como {user.email}.
      </p>
    </div>
  );
}
