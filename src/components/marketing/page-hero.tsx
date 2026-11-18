import Link from "next/link";
import type { ReactNode } from "react";
import { buttonClassName } from "@/components/ui/button";

export function PageHero({
  eyebrow,
  title,
  lead,
  primary,
  secondary,
}: {
  eyebrow: string;
  title: ReactNode;
  lead: ReactNode;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <section className="relative">
      <div
        aria-hidden="true"
        className="bg-brand-300/25 absolute -top-10 right-0 size-80 rounded-full blur-3xl"
      />
      <div className="relative mx-auto w-full max-w-4xl px-5 pt-14 pb-16 text-center sm:px-8 sm:pt-20 sm:pb-20">
        <p className="text-brand-700 text-xs font-semibold tracking-[0.18em] uppercase">
          {eyebrow}
        </p>
        <h1 className="text-ink mt-4 text-4xl leading-[1.06] font-semibold tracking-tight text-balance sm:text-5xl">
          {title}
        </h1>
        <p className="text-muted mx-auto mt-6 max-w-2xl text-base leading-7 sm:text-lg">
          {lead}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={primary.href} className={buttonClassName({ size: "lg" })}>
            {primary.label}
          </Link>
          {secondary ? (
            <Link
              href={secondary.href}
              className={buttonClassName({ variant: "secondary", size: "lg" })}
            >
              {secondary.label}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function CardGrid({
  items,
}: {
  items: Array<{ title: string; body: string; tag?: string }>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <article
          key={item.title}
          className="border-line rounded-3xl border bg-white p-6"
        >
          {item.tag ? (
            <span className="bg-brand-50 text-brand-700 rounded-full px-2.5 py-1 text-xs font-semibold">
              {item.tag}
            </span>
          ) : null}
          <h3
            className={`text-ink text-lg font-semibold ${item.tag ? "mt-3" : ""}`}
          >
            {item.title}
          </h3>
          <p className="text-muted mt-2 text-sm leading-6">{item.body}</p>
        </article>
      ))}
    </div>
  );
}

export function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <li
          key={item}
          className="border-line text-ink flex gap-3 rounded-2xl border bg-white p-4 text-sm leading-6"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="text-brand-600 mt-0.5 size-5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m5 10.5 3 3 7-7" />
          </svg>
          {item}
        </li>
      ))}
    </ul>
  );
}

export function NumberedSteps({
  steps,
}: {
  steps: Array<{ title: string; body: string }>;
}) {
  return (
    <ol className="grid gap-4 md:grid-cols-3">
      {steps.map((step, index) => (
        <li
          key={step.title}
          className="border-line bg-canvas rounded-3xl border p-6"
        >
          <span className="text-brand-600 font-mono text-sm font-semibold">
            0{index + 1}
          </span>
          <h3 className="text-ink mt-3 text-lg font-semibold">{step.title}</h3>
          <p className="text-muted mt-2 text-sm leading-6">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}
