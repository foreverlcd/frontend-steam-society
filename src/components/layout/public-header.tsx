"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { buttonClassName } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { homePathForRole } from "@/lib/auth/roles";

const NAV_LINKS = [
  { href: "/para-mentees", label: "Para mentees" },
  { href: "/para-mentoras", label: "Para mentoras" },
  { href: "/mentors", label: "Mentoras" },
  { href: "/help", label: "Ayuda" },
];

const LINK_CLASS =
  "text-muted hover:bg-brand-50 hover:text-ink focus-visible:ring-brand-500 rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:ring-2 focus-visible:outline-none";

export function PublicHeader() {
  const { user, status } = useAuth();
  const homePath = user ? homePathForRole(user.role) : "/dashboard";
  const signedIn = status === "authenticated" && user;

  return (
    <header className="border-line bg-canvas/85 sticky top-0 z-20 border-b backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Link
          href="/"
          aria-label="Steam Society, inicio"
          className="focus-visible:ring-brand-500 focus-visible:ring-offset-canvas rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <Logo />
        </Link>

        <nav
          aria-label="Principal"
          className="hidden items-center gap-1 lg:flex"
        >
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={LINK_CLASS}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {signedIn ? (
            <Link href={homePath} className={buttonClassName({ size: "sm" })}>
              Ir a mi panel
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-ink hover:bg-brand-50 rounded-xl px-3 py-2 text-sm font-semibold transition"
              >
                Iniciar sesión
              </Link>
              {/* Wrapper: `hidden` on the link itself would fight its `inline-flex`. */}
              <span className="hidden sm:inline">
                <Link
                  href="/register"
                  className={buttonClassName({ size: "sm" })}
                >
                  Crear cuenta
                </Link>
              </span>
            </>
          )}

          <details className="group relative lg:hidden">
            <summary
              aria-label="Abrir menú"
              className="border-line text-ink hover:bg-brand-50 focus-visible:ring-brand-500 grid size-10 cursor-pointer list-none place-items-center rounded-xl border bg-white focus-visible:ring-2 focus-visible:outline-none [&::-webkit-details-marker]:hidden"
            >
              <MenuIcon />
            </summary>
            <nav
              aria-label="Menú"
              className="border-line absolute right-0 mt-2 flex w-56 flex-col rounded-2xl border bg-white p-2 shadow-xl"
            >
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className={LINK_CLASS}>
                  {link.label}
                </Link>
              ))}
              {signedIn ? null : (
                <Link
                  href="/register"
                  className="text-brand-700 hover:bg-brand-50 rounded-lg px-3 py-2 text-sm font-semibold sm:hidden"
                >
                  Crear cuenta
                </Link>
              )}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}
