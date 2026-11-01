"use client";

import Link from "next/link";
import { OnboardingCard } from "@/components/onboarding/onboarding-card";
import { RecommendationsSection } from "@/components/dashboard/recommendations-section";
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
          Tu cuenta ya está lista. Este es tu espacio para avanzar con
          intención, un paso a la vez.
        </p>
      </header>

      <div className="mt-8">
        <OnboardingCard />
      </div>

      <div className="mt-5">
        <RecommendationsSection />
      </div>

      <nav
        aria-label="Accesos rápidos"
        className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        {isMentor ? (
          <>
            <QuickLink
              href="/dashboard/profile"
              title="Mi perfil"
              description="Edita y envía tu perfil a revisión."
            />
            <QuickLink
              href="/dashboard/offerings"
              title="Ofertas"
              description="Crea y archiva tus sesiones."
            />
            <QuickLink
              href="/dashboard/availability"
              title="Disponibilidad"
              description="Define tus horarios semanales."
            />
            <QuickLink
              href="/dashboard/bookings"
              title="Reservas"
              description="Acepta, rechaza o completa sesiones."
            />
          </>
        ) : (
          <>
            <QuickLink
              href="/mentors"
              title="Catálogo"
              description="Explora mentoras y horarios."
            />
            <QuickLink
              href="/dashboard/bookings"
              title="Mis reservas"
              description="Revisa el estado de tus sesiones."
            />
            <QuickLink
              href="/dashboard/profile"
              title="Mi perfil"
              description="Actualiza tus objetivos e intereses."
            />
            <QuickLink
              href="/onboarding"
              title="Onboarding"
              description="Revisa tus respuestas."
            />
          </>
        )}
      </nav>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
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
              ? "Con tu onboarding listo, el siguiente paso es completar tu perfil, definir disponibilidad y enviarlo a revisión."
              : "Con tus intereses y objetivos, el siguiente paso es descubrir mentoras afines a lo que buscas."}
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
              Tus respuestas, siempre editables.
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
    </div>
  );
}

function QuickLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="border-line hover:border-brand-300 hover:bg-brand-50/40 rounded-2xl border bg-white p-4 transition"
    >
      <span className="text-ink block text-sm font-semibold">{title}</span>
      <span className="text-muted mt-1 block text-xs leading-5">
        {description}
      </span>
    </Link>
  );
}
