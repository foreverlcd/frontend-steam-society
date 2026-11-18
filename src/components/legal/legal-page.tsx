import Link from "next/link";
import type { ReactNode } from "react";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema } from "@/lib/seo";
import { LEGAL_UPDATED_LABEL } from "@/lib/site";

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

/** Shared frame for the privacy, terms and cookie pages, with a table of contents. */
export function LegalPage({
  title,
  path,
  intro,
  sections,
}: {
  title: string;
  path: string;
  intro: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <div className="min-h-dvh">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [breadcrumbSchema(title, path)],
        }}
      />
      <PublicHeader />
      <main
        id="contenido"
        className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[16rem_1fr] lg:py-16"
      >
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav aria-label="En esta página">
            <p className="text-ink text-sm font-semibold">En esta página</p>
            <ol className="mt-3 space-y-1.5 text-sm">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-muted hover:text-ink transition"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <p className="text-muted mt-6 text-xs">
            Ver también:{" "}
            <Link href="/privacidad" className="underline">
              Privacidad
            </Link>{" "}
            ·{" "}
            <Link href="/terminos" className="underline">
              Términos
            </Link>{" "}
            ·{" "}
            <Link href="/cookies" className="underline">
              Cookies
            </Link>
          </p>
        </aside>

        <article className="max-w-3xl">
          <header>
            <h1 className="text-ink text-4xl font-semibold tracking-tight">
              {title}
            </h1>
            <p className="text-muted mt-2 text-sm">
              Última actualización: {LEGAL_UPDATED_LABEL}
            </p>
            <p
              role="note"
              className="border-accent-300 bg-accent-100/60 text-ink mt-6 rounded-2xl border p-4 text-sm leading-6"
            >
              <strong>Versión preliminar.</strong> Este texto describe cómo
              funciona hoy la plataforma y está pendiente de revisión legal. Si
              cambia algo importante, te avisaremos antes de que aplique.
            </p>
            <div className="text-muted mt-6 space-y-4 text-base leading-7">
              {intro}
            </div>
          </header>

          <div className="mt-10 space-y-10">
            {sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-title`}
                className="scroll-mt-24"
              >
                <h2
                  id={`${section.id}-title`}
                  className="text-ink text-xl font-semibold tracking-tight"
                >
                  {index + 1}. {section.title}
                </h2>
                <div className="legal-prose text-muted mt-3 space-y-3 text-[0.95rem] leading-7">
                  {section.body}
                </div>
              </section>
            ))}
          </div>
        </article>
      </main>
      <PublicFooter />
    </div>
  );
}
