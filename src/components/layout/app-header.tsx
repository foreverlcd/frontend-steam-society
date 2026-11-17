"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
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
  const navItems = navItemsForRole(user.role, homePath);

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

        <nav
          aria-label="Navegación principal"
          className="hidden items-center gap-1 sm:flex"
        >
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.label}
            </NavLink>
          ))}
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

      <nav
        aria-label="Navegación principal"
        className="border-line mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto border-t px-3 sm:hidden"
      >
        {navItems.map((item) => (
          <NavLink key={item.href} href={item.href} className="shrink-0">
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}

interface NavItem {
  href: string;
  label: string;
}

function navItemsForRole(role: string, homePath: string): NavItem[] {
  const home = { href: homePath, label: role === "admin" ? "Panel" : "Inicio" };

  if (role === "mentee") {
    return [
      home,
      { href: "/mentors", label: "Mentoras" },
      { href: "/dashboard/bookings", label: "Reservas" },
      { href: "/dashboard/profile", label: "Perfil" },
    ];
  }

  if (role === "mentor") {
    return [
      home,
      { href: "/dashboard/offerings", label: "Ofertas" },
      { href: "/dashboard/availability", label: "Disponibilidad" },
      { href: "/dashboard/bookings", label: "Reservas" },
      { href: "/dashboard/profile", label: "Perfil" },
    ];
  }

  return [home];
}

function NavLink({
  href,
  children,
  className,
}: {
  href: string;
  children: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "text-muted hover:bg-brand-50 hover:text-ink inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium whitespace-nowrap transition sm:min-h-0 sm:py-2",
        className,
      )}
    >
      {children}
    </Link>
  );
}
