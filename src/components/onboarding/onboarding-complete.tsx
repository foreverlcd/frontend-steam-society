"use client";

import Link from "next/link";
import type { OnboardingData } from "@/lib/api/onboarding";
import { Button, buttonClassName } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function OnboardingComplete({
  data,
  onReview,
}: {
  data: OnboardingData;
  onReview: () => void;
}) {
  const isMentor = data.role === "mentor";

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8">
      <section className="border-success-200 bg-success-50/60 rounded-3xl border p-6 shadow-sm sm:p-8">
        <span
          aria-hidden="true"
          className="bg-success-700 grid size-11 place-items-center rounded-full text-lg font-bold text-white"
        >
          ✓
        </span>
        <p className="text-success-700 mt-5 text-xs font-semibold tracking-[0.18em] uppercase">
          Onboarding completo
        </p>
        <h1 className="text-ink mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Tus respuestas están guardadas
        </h1>
        <p className="text-muted mt-3 max-w-2xl text-sm leading-6">
          {isMentor
            ? "Ya tenemos la información base para tu perfil de mentora. Puedes revisarla cuando quieras."
            : "Ya tenemos la información base para recomendarte mentoras afines. Puedes revisarla cuando quieras."}
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/dashboard" className={buttonClassName({ size: "lg" })}>
            Volver al dashboard
          </Link>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={onReview}
          >
            Revisar respuestas
          </Button>
        </div>
      </section>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {data.steps.map((step) => (
          <div
            key={step.code}
            className="border-line rounded-2xl border bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-ink text-sm font-semibold">{step.title}</p>
              <Badge tone="success">Completado</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
