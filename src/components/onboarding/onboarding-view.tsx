"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { QuestionField } from "@/components/forms/question-field";
import { getErrorMessage, isUnauthorized } from "@/lib/api/errors";
import { updateOnboarding, type OnboardingData } from "@/lib/api/onboarding";
import {
  buildAnswersPayload,
  findFirstStepWithMissing,
  getMissingQuestionLabels,
  validateStep,
  type FieldErrors,
} from "@/lib/onboarding/answers";
import { useOnboarding } from "@/lib/onboarding/use-onboarding";
import { useAuth } from "@/lib/auth/auth-context";
import { OnboardingComplete } from "./onboarding-complete";
import { OnboardingProgress } from "./onboarding-progress";

function OnboardingLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8">
      <div className="border-line rounded-3xl border bg-white p-6 shadow-sm">
        <div className="text-muted flex items-center gap-3 text-sm">
          <Spinner className="size-4" />
          <span>Cargando tu onboarding...</span>
        </div>
      </div>
    </div>
  );
}

function OnboardingError({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
      <Alert tone="error">
        {message ?? "No pudimos cargar tu onboarding."}
      </Alert>
      <Button type="button" className="mt-4" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  );
}

function OnboardingWizard({
  data,
  setData,
  onReload,
}: {
  data: OnboardingData;
  setData: (data: OnboardingData) => void;
  onReload: () => void;
}) {
  const { refresh } = useAuth();
  const [answers, setAnswers] = useState<Record<string, unknown>>(() => ({
    ...data.answers,
  }));
  const [stepIndex, setStepIndex] = useState(() =>
    findFirstStepWithMissing(data.steps, data.completion.missing),
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [stepIndex]);

  function handleAnswerChange(code: string, value: unknown) {
    setAnswers((current) => {
      const next = { ...current, [code]: value };

      if (code === "primaryAreaId" && current.primaryAreaId !== value) {
        next.areaIds = [];
      }

      return next;
    });

    setFieldErrors((current) => {
      if (!current[code] && !(code === "primaryAreaId" && current.areaIds)) {
        return current;
      }

      const next = { ...current };
      delete next[code];

      if (code === "primaryAreaId") {
        delete next.areaIds;
      }

      return next;
    });

    setFormError(null);
  }

  function focusFirstInvalid() {
    if (typeof window.requestAnimationFrame !== "function") {
      return;
    }

    window.requestAnimationFrame(() => {
      formRef.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus();
    });
  }

  function goToStep(nextIndex: number) {
    if (nextIndex < 0 || nextIndex >= data.steps.length) {
      return;
    }

    setStepIndex(nextIndex);
    setFieldErrors({});
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) {
      return;
    }

    const currentStep = data.steps[stepIndex];

    if (!currentStep) {
      return;
    }

    const errors = validateStep(currentStep, answers, data.options);

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("Revisa las respuestas marcadas.");
      focusFirstInvalid();
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const next = await updateOnboarding({
        version: data.version,
        answers: buildAnswersPayload(data.steps, answers, data.options),
      });

      setData(next);
      setAnswers({ ...next.answers });
      setFieldErrors({});

      if (
        next.completion.complete &&
        (!reviewing || stepIndex === next.steps.length - 1)
      ) {
        setReviewing(false);
        return;
      }

      if (stepIndex === next.steps.length - 1) {
        const missingLabels = getMissingQuestionLabels(
          next.steps,
          next.completion.missing,
        );

        setFormError(
          missingLabels.length > 0
            ? `Aún faltan respuestas obligatorias: ${missingLabels.join(", ")}.`
            : "Aún faltan respuestas obligatorias.",
        );
        setStepIndex(
          findFirstStepWithMissing(next.steps, next.completion.missing),
        );
        return;
      }

      setStepIndex(stepIndex + 1);
    } catch (caught) {
      if (isUnauthorized(caught)) {
        await refresh();
        return;
      }

      setFormError(getErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  if (data.completion.complete && !reviewing) {
    return (
      <OnboardingComplete
        data={data}
        onReview={() => {
          setReviewing(true);
          setStepIndex(0);
          setFieldErrors({});
          setFormError(null);
        }}
      />
    );
  }

  const step = data.steps[stepIndex];

  if (!step) {
    return (
      <OnboardingError
        message="No pudimos encontrar este paso."
        onRetry={onReload}
      />
    );
  }

  const isMentor = data.role === "mentor";
  const isLastStep = stepIndex === data.steps.length - 1;
  const submitLabel = isLastStep
    ? reviewing
      ? "Guardar cambios"
      : "Finalizar onboarding"
    : "Guardar y continuar";

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8 sm:py-10">
      <header className="max-w-2xl">
        <p className="text-brand-700 text-xs font-semibold tracking-[0.18em] uppercase">
          Onboarding
        </p>
        <h1 className="text-ink mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Completa tu perfil
        </h1>
        <p className="text-muted mt-3 text-sm leading-6">
          {isMentor
            ? "Cuéntanos sobre tu experiencia para preparar tu perfil de mentora."
            : "Cuéntanos qué buscas para recomendarte mentoras afines a tus intereses."}
        </p>
      </header>

      <div className="mt-6">
        <OnboardingProgress
          steps={data.steps}
          currentIndex={stepIndex}
          missing={data.completion.missing}
        />
      </div>

      {reviewing ? (
        <Alert tone="info" className="mt-5">
          Estás revisando tus respuestas. Los cambios se guardan al continuar.
        </Alert>
      ) : null}

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="mt-6 flex flex-col gap-6"
        noValidate
      >
        <section className="border-line rounded-3xl border bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-1.5">
            <p className="text-muted text-xs font-semibold tracking-[0.14em] uppercase">
              Paso {stepIndex + 1}
            </p>
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="text-ink text-xl font-semibold tracking-tight focus:outline-none"
            >
              {step.title}
            </h2>
          </div>

          <div className="mt-6 flex flex-col gap-6">
            {step.questions.map((question) => (
              <QuestionField
                key={question.code}
                question={question}
                answers={answers}
                options={data.options}
                error={fieldErrors[question.code]}
                onChange={handleAnswerChange}
              />
            ))}
          </div>

          {formError ? (
            <Alert tone="error" className="mt-6">
              {formError}
            </Alert>
          ) : null}

          <div className="border-line mt-7 flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => goToStep(stepIndex - 1)}
              disabled={stepIndex === 0 || saving}
            >
              Atrás
            </Button>
            <Button
              type="submit"
              size="lg"
              loading={saving}
              className="sm:min-w-48"
            >
              {submitLabel}
            </Button>
          </div>

          <p className="text-muted mt-3 text-xs">
            Guardamos tus respuestas al continuar. Puedes volver a editarlas
            después.
          </p>
        </section>
      </form>
    </div>
  );
}

export function OnboardingView() {
  const { data, status, error, reload, setData } = useOnboarding();

  if (status === "loading") {
    return <OnboardingLoading />;
  }

  if (status === "error" || !data) {
    return <OnboardingError message={error} onRetry={reload} />;
  }

  if (data.steps.length === 0) {
    return (
      <OnboardingError
        message="No hay pasos de onboarding disponibles."
        onRetry={reload}
      />
    );
  }

  return <OnboardingWizard data={data} setData={setData} onReload={reload} />;
}
