"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { roleLabel, userStatusLabel } from "@/lib/auth/roles";
import { cn } from "@/lib/cn";

function statusClasses(status: string): string {
  if (status === "active") {
    return "bg-success-50 text-success-700";
  }

  if (status === "suspended") {
    return "bg-danger-50 text-danger-700";
  }

  return "bg-brand-50 text-brand-700";
}

export function DashboardView() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
  const isMentor = user.role === "mentor";

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8">
      <header className="max-w-2xl">
        <p className="text-brand-700 text-xs font-semibold tracking-[0.18em] uppercase">
          Tu espacio
        </p>
        <h1 className="text-ink mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Hola, {displayName}
        </h1>
        <p className="text-muted mt-3 text-sm leading-6">
          Tu cuenta ya está lista. Pronto podrás completar tu perfil y empezar a
          conectar con la comunidad.
        </p>
      </header>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="border-line rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-ink text-base font-semibold">Tu cuenta</h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-muted text-xs font-medium">Correo</dt>
              <dd className="text-ink mt-1 text-sm break-all">{user.email}</dd>
            </div>
            <div>
              <dt className="text-muted text-xs font-medium">Rol</dt>
              <dd className="text-ink mt-1 text-sm">{roleLabel(user.role)}</dd>
            </div>
            <div>
              <dt className="text-muted text-xs font-medium">Estado</dt>
              <dd className="mt-1">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                    statusClasses(user.status),
                  )}
                >
                  {userStatusLabel(user.status)}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-muted text-xs font-medium">Nombre</dt>
              <dd className="text-ink mt-1 text-sm">{displayName}</dd>
            </div>
          </dl>
        </section>

        <section className="bg-ink rounded-3xl p-6 text-white shadow-sm">
          <p className="text-accent-300 text-xs font-semibold tracking-[0.18em] uppercase">
            Lo que viene
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">
            {isMentor
              ? "Prepara tu perfil de mentora"
              : "Encuentra a tu mentora"}
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/70">
            {isMentor
              ? "Completarás tus áreas, experiencia y disponibilidad. Después podrás enviar tu perfil a revisión."
              : "Completarás tus intereses y objetivos para que podamos recomendarte mentoras afines."}
          </p>
          <ul className="mt-5 space-y-3 text-sm text-white/80">
            <li className="flex gap-2">
              <span aria-hidden="true" className="text-accent-300">
                •
              </span>
              Onboarding guiado, paso a paso.
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true" className="text-accent-300">
                •
              </span>
              Tu perfil siempre editable.
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true" className="text-accent-300">
                •
              </span>
              Acompañamiento con intención.
            </li>
          </ul>
        </section>
      </div>

      <section className="border-brand-200 bg-brand-50/60 mt-5 rounded-3xl border border-dashed p-6">
        <h2 className="text-ink text-sm font-semibold">Siguiente paso</h2>
        <p className="text-muted mt-1 max-w-2xl text-sm leading-6">
          El onboarding y la edición de perfil se conectarán en la siguiente
          entrega. Mientras tanto, tu sesión ya está funcionando.
        </p>
      </section>
    </div>
  );
}
