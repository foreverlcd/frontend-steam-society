"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { homePathForRole, roleLabel } from "@/lib/auth/roles";

export function AppHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) {
    return null;
  }

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
  const homePath = homePathForRole(user.role);
  const homeLabel = user.role === "admin" ? "Panel" : "Inicio";

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await logout();
    } finally {
      setLoggingOut(false);
      router.replace("/login");
    }
  }

  return (
    <header className="border-line bg-canvas/85 sticky top-0 z-20 border-b backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Link
          href={homePath}
          className="focus-visible:ring-brand-500 focus-visible:ring-offset-canvas rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          <Link
            href={homePath}
            className="text-muted hover:bg-brand-50 hover:text-ink rounded-lg px-3 py-2 text-sm font-medium transition"
          >
            {homeLabel}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-ink text-sm font-medium">{displayName}</p>
            <p className="text-muted text-xs">{roleLabel(user.role)}</p>
          </div>
          <span
            aria-hidden="true"
            className="bg-brand-100 text-brand-700 grid size-9 place-items-center rounded-full text-sm font-semibold"
          >
            {displayName.slice(0, 1).toUpperCase()}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            loading={loggingOut}
            onClick={() => void handleLogout()}
          >
            Salir
          </Button>
        </div>
      </div>
    </header>
  );
}
