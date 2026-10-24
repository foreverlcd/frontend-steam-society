"use client";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo />
      <div className="space-y-2">
        <p className="text-brand-700 text-xs font-semibold tracking-[0.18em] uppercase">
          Algo salió mal
        </p>
        <h1 className="text-ink text-3xl font-semibold tracking-tight">
          No pudimos cargar esta página
        </h1>
        <p className="text-muted max-w-md text-sm leading-6">
          Inténtalo de nuevo. Si el problema continúa, vuelve más tarde.
        </p>
      </div>
      <Button type="button" onClick={reset}>
        Reintentar
      </Button>
    </main>
  );
}
