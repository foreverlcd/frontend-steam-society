"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { buttonClassName } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { homePathForRole } from "@/lib/auth/roles";

export function PublicHeader() {
  const { user, status } = useAuth();
  const homePath = user ? homePathForRole(user.role) : "/dashboard";

  return (
    <header className="border-line bg-canvas/85 sticky top-0 z-20 border-b backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Link
          href="/"
          className="focus-visible:ring-brand-500 focus-visible:ring-offset-canvas rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <Logo />
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/mentors"
            className="text-muted hover:bg-brand-50 hover:text-ink rounded-lg px-3 py-2 text-sm font-medium transition"
          >
            Mentoras
          </Link>
          {status === "authenticated" && user ? (
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
              <Link
                href="/register"
                className={buttonClassName({
                  size: "sm",
                  className: "hidden sm:inline-flex",
                })}
              >
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
