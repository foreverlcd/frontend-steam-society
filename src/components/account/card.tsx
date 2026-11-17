import type { ReactNode } from "react";

/** White panel used by every section of the Security page. */
export function Card({ children }: { children: ReactNode }) {
  return (
    <section className="border-line space-y-4 rounded-2xl border bg-white p-5 sm:p-6">
      {children}
    </section>
  );
}
