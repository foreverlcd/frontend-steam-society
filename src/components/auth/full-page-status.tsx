import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { Spinner } from "@/components/ui/spinner";

export function FullPageStatus({
  message = "Cargando...",
  loading = true,
  children,
}: {
  message?: string;
  loading?: boolean;
  children?: ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
      <Logo />
      {loading ? (
        <div className="text-muted flex items-center gap-3 text-sm">
          <Spinner className="size-4" />
          <span>{message}</span>
        </div>
      ) : (
        <p className="text-muted max-w-sm text-sm">{message}</p>
      )}
      {children}
    </main>
  );
}
