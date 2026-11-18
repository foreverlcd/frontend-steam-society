import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Section({
  id,
  className,
  children,
  tone = "plain",
  labelledBy,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
  tone?: "plain" | "soft" | "ink";
  labelledBy?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(
        "scroll-mt-20",
        tone === "soft" && "border-line border-y bg-white/70",
        tone === "ink" && "bg-ink text-white",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        {children}
      </div>
    </section>
  );
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  lead,
  align = "left",
  tone = "dark",
}: {
  id?: string;
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  tone?: "dark" | "light";
}) {
  return (
    <header
      className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}
    >
      {eyebrow ? (
        <p
          className={cn(
            "text-xs font-semibold tracking-[0.18em] uppercase",
            tone === "light" ? "text-accent-300" : "text-brand-700",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        id={id}
        className={cn(
          "mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl",
          tone === "light" ? "text-white" : "text-ink",
        )}
      >
        {title}
      </h2>
      {lead ? (
        <p
          className={cn(
            "mt-4 text-base leading-7 sm:text-lg",
            tone === "light" ? "text-white/75" : "text-muted",
          )}
        >
          {lead}
        </p>
      ) : null}
    </header>
  );
}
