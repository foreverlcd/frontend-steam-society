import Link from "next/link";
import type { ReactNode } from "react";

// Buttons on the dark band; `buttonClassName` colours would clash here.
const ON_DARK =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-700 focus-visible:outline-none";

export function CtaBand({
  title,
  lead,
  primary,
  secondary,
}: {
  title: ReactNode;
  lead: ReactNode;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <section className="px-5 pb-20 sm:px-8">
      <div className="from-brand-800 via-brand-700 to-brand-600 relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-gradient-to-br px-6 py-14 text-center sm:px-12 sm:py-16">
        <div
          aria-hidden="true"
          className="bg-accent-500/40 absolute -top-16 -right-10 size-56 rounded-full blur-3xl"
        />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl">
            {title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/80">
            {lead}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={primary.href}
              className={`${ON_DARK} text-brand-800 hover:bg-brand-50 bg-white shadow-sm`}
            >
              {primary.label}
            </Link>
            {secondary ? (
              <Link
                href={secondary.href}
                className={`${ON_DARK} border border-white/40 text-white hover:bg-white/10`}
              >
                {secondary.label}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
