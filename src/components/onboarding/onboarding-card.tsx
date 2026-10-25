"use client";

import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClassName } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { useOnboarding } from "@/lib/onboarding/use-onboarding";
import { cn } from "@/lib/cn";

export function OnboardingCard() {
  const { data, status, error, reload } = useOnboarding();

  if (status === "loading") {
    return (
      <section className="border-line rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
        <div className="text-muted flex items-center gap-3 text-sm">
          <Spinner className="size-4" />
          <span>Cargando tu onboarding...</span>
        </div>
      </section>
    );
  }

  if (status === "error" || !data) {
    return (
      <section className="border-line rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
        <Alert tone="error">
          {error ?? "No pudimos cargar tu onboarding."}
        </Alert>
        <Button type="button" className="mt-4" onClick={reload}>
          Reintentar
        </Button>
      </section>
    );
  }

  const requiredQuestions = data.steps
    .flatMap((step) => step.questions)
    .filter((question) => question.required);
  const requiredCodes = new Set(
    requiredQuestions.map((question) => question.code),
  );
  const missingRequired = data.completion.missing.filter((code) =>
    requiredCodes.has(code),
  );
  const completed = requiredQuestions.length - missingRequired.length;
  const isComplete = data.completion.complete;

  return (
    <section
      className={cn(
        "rounded-3xl border p-5 shadow-sm sm:p-6",
        isComplete
          ? "border-success-200 bg-success-50/60"
          : "border-brand-200 bg-brand-50/60",
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-brand-700 text-xs font-semibold tracking-[0.18em] uppercase">
              Onboarding
            </p>
            <Badge tone={isComplete ? "success" : "brand"}>
              {isComplete
                ? "Completo"
                : `${completed}/${requiredQuestions.length}`}
            </Badge>
          </div>

          <h2 className="text-ink mt-2 text-xl font-semibold tracking-tight">
            {isComplete
              ? "Tus respuestas están guardadas"
              : "Completa tu onboarding"}
          </h2>

          <p className="text-muted mt-2 text-sm leading-6">
            {isComplete
              ? "Ya tenemos tu información base. Puedes revisarla cuando quieras."
              : `Te faltan ${missingRequired.length} respuestas obligatorias para terminar. Son unos minutos.`}
          </p>

          {!isComplete ? (
            <div className="mt-4">
              <Progress
                value={completed}
                max={requiredQuestions.length}
                label="Progreso del onboarding"
              />
            </div>
          ) : null}
        </div>

        <Link
          href="/onboarding"
          className={buttonClassName({
            size: "md",
            className: "shrink-0",
          })}
        >
          {isComplete ? "Revisar respuestas" : "Continuar onboarding"}
        </Link>
      </div>
    </section>
  );
}
