import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { RequireGuest } from "@/components/auth/require-guest";

// Auth screens are fully client-side (session lives in an HttpOnly cookie).
// They are allowed to block while the client resolves the session.
export const instant = false;

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <RequireGuest>
      <main className="min-h-dvh lg:grid lg:grid-cols-[1.05fr_0.95fr]">
        <section className="bg-ink relative hidden overflow-hidden p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div
            aria-hidden="true"
            className="bg-brand-500/30 absolute -top-24 -right-20 size-80 rounded-full blur-3xl"
          />
          <div
            aria-hidden="true"
            className="bg-accent-500/20 absolute -bottom-28 -left-24 size-96 rounded-full blur-3xl"
          />

          <Link
            href="/"
            className="focus-visible:ring-offset-ink relative z-10 w-fit rounded-lg focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <Logo tone="light" />
          </Link>

          <div className="relative z-10 max-w-lg">
            <p className="text-accent-300 text-xs font-semibold tracking-[0.2em] uppercase">
              Mentorías STEAM
            </p>
            <h2 className="mt-4 text-4xl leading-tight font-semibold tracking-tight text-balance">
              Crecer también es tener a alguien que te acompañe.
            </h2>
            <p className="mt-5 text-sm leading-6 text-white/70">
              Steam Society acerca a más mujeres a carreras STEAM con
              conversaciones honestas, experiencia compartida y una comunidad
              que suma.
            </p>
            <blockquote className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-6 text-white/80">
              “No necesitas tenerlo todo resuelto. Solo necesitas el siguiente
              paso y alguien que te ayude a verlo.”
            </blockquote>
          </div>

          <p className="relative z-10 text-xs text-white/50">
            Perú primero. Latinoamérica después.
          </p>
        </section>

        <section className="flex min-h-dvh flex-col px-5 py-8 sm:px-8 lg:px-12">
          <div className="lg:hidden">
            <Link
              href="/"
              className="focus-visible:ring-brand-500 focus-visible:ring-offset-canvas inline-flex rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <Logo />
            </Link>
          </div>

          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
            {children}
          </div>

          <p className="text-muted text-center text-xs">
            Steam Society · Un espacio para aprender y compartir.
          </p>
        </section>
      </main>
    </RequireGuest>
  );
}
