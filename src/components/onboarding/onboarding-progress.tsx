import type { OnboardingStep } from "@/lib/api/onboarding";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { isStepComplete } from "@/lib/onboarding/answers";
import { cn } from "@/lib/cn";

export function OnboardingProgress({
  steps,
  currentIndex,
  missing,
}: {
  steps: OnboardingStep[];
  currentIndex: number;
  missing: string[];
}) {
  const completedSteps = steps.filter((step) =>
    isStepComplete(step, missing),
  ).length;
  const totalSteps = Math.max(steps.length, 1);
  const percent = Math.round((completedSteps / totalSteps) * 100);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted text-xs font-medium">
          Paso {currentIndex + 1} de {steps.length}
        </p>
        <Badge tone={completedSteps === steps.length ? "success" : "brand"}>
          {percent}% completado
        </Badge>
      </div>

      <Progress
        value={completedSteps}
        max={totalSteps}
        label="Progreso del onboarding"
      />

      <ol className="hidden gap-2 sm:grid sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => {
          const complete = isStepComplete(step, missing);
          const active = index === currentIndex;

          return (
            <li
              key={step.code}
              aria-current={active ? "step" : undefined}
              className={cn(
                "rounded-xl border px-3 py-2 text-xs",
                active
                  ? "border-brand-300 bg-brand-50 text-brand-800"
                  : "border-line text-muted bg-white",
              )}
            >
              <span className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold",
                    complete
                      ? "bg-success-50 text-success-700"
                      : active
                        ? "bg-brand-600 text-white"
                        : "bg-canvas text-muted",
                  )}
                >
                  {complete ? "✓" : index + 1}
                </span>
                <span className="font-medium">{step.title}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
