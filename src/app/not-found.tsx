import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { buttonClassName } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo />
      <div className="space-y-2">
        <p className="text-brand-700 text-xs font-semibold tracking-[0.18em] uppercase">
          Error 404
        </p>
        <h1 className="text-ink text-3xl font-semibold tracking-tight">
          No encontramos esta página
        </h1>
        <p className="text-muted max-w-md text-sm leading-6">
          Puede que el enlace haya cambiado o que la página ya no exista.
        </p>
      </div>
      <Link href="/" className={buttonClassName()}>
        Volver al inicio
      </Link>
    </main>
  );
}
