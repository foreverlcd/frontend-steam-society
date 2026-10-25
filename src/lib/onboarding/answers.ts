import type {
  OnboardingArea,
  OnboardingLanguage,
  OnboardingOptions,
  OnboardingQuestion,
  OnboardingStep,
} from "@/lib/api/onboarding";

export type AnswerMap = Record<string, unknown>;
export type FieldErrors = Record<string, string>;

export const PRIMARY_AREA_CODE = "primaryAreaId";
export const SUBAREA_CODE = "areaIds";

export function getStringAnswer(answers: AnswerMap, code: string): string {
  const value = answers[code];

  return typeof value === "string" ? value : "";
}

export function getStringArrayAnswer(
  answers: AnswerMap,
  code: string,
): string[] {
  const value = answers[code];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export function getAreaRoots(areas: OnboardingArea[]): OnboardingArea[] {
  return areas.filter((area) => area.parentId === null);
}

export function getAreaChildren(
  areas: OnboardingArea[],
  parentId: string,
): OnboardingArea[] {
  return areas.filter((area) => area.parentId === parentId);
}

export function findAreaName(
  areas: OnboardingArea[],
  areaId: string,
): string | null {
  return areas.find((area) => area.id === areaId)?.name ?? null;
}

export function findLanguageName(
  languages: OnboardingLanguage[],
  code: string,
): string | null {
  return languages.find((language) => language.code === code)?.name ?? null;
}

export function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateQuestion(
  question: OnboardingQuestion,
  answers: AnswerMap,
  options: OnboardingOptions,
): string | null {
  switch (question.type) {
    case "text":
    case "url": {
      const value = getStringAnswer(answers, question.code).trim();

      if (question.required && !value) {
        return "Completa este campo.";
      }

      if (question.type === "url" && value && !isValidUrl(value)) {
        return "Ingresa una URL válida (por ejemplo, https://...).";
      }

      return null;
    }

    case "number": {
      const raw = answers[question.code];
      const value =
        typeof raw === "number" || typeof raw === "string"
          ? String(raw).trim()
          : "";

      if (question.required && !value) {
        return "Completa este campo.";
      }

      if (value && !Number.isFinite(Number(value))) {
        return "Ingresa un número válido.";
      }

      return null;
    }

    case "single_select": {
      const value = getStringAnswer(answers, question.code);

      if (!value) {
        return question.required ? "Elige una opción." : null;
      }

      if (!(question.options ?? []).some((option) => option.value === value)) {
        return "Elige una opción válida.";
      }

      return null;
    }

    case "multi_select": {
      const selected = getStringArrayAnswer(answers, question.code);

      if (question.required && selected.length === 0) {
        return "Elige al menos una opción.";
      }

      if (question.maxSelections && selected.length > question.maxSelections) {
        return `Elige hasta ${question.maxSelections} opciones.`;
      }

      if (
        selected.some(
          (value) =>
            !(question.options ?? []).some((option) => option.value === value),
        )
      ) {
        return "Hay una opción no válida.";
      }

      return null;
    }

    case "area_single": {
      const value = getStringAnswer(answers, question.code);

      if (!value) {
        return question.required ? "Elige un área principal." : null;
      }

      if (!getAreaRoots(options.areas).some((area) => area.id === value)) {
        return "Elige un área principal válida.";
      }

      return null;
    }

    case "area_multi": {
      const primaryAreaId = getStringAnswer(answers, PRIMARY_AREA_CODE);
      const selected = getStringArrayAnswer(answers, question.code);

      if (!primaryAreaId) {
        return question.required ? "Elige un área principal primero." : null;
      }

      if (question.required && selected.length === 0) {
        return "Elige al menos una subárea.";
      }

      if (question.maxSelections && selected.length > question.maxSelections) {
        return `Elige hasta ${question.maxSelections} subáreas.`;
      }

      const validAreaIds = new Set(
        getAreaChildren(options.areas, primaryAreaId).map((area) => area.id),
      );

      if (selected.some((areaId) => !validAreaIds.has(areaId))) {
        return "Elige subáreas del área principal.";
      }

      return null;
    }

    case "language_single": {
      const selected = getStringArrayAnswer(answers, question.code);

      if (question.required && selected.length === 0) {
        return "Elige un idioma.";
      }

      if (selected.length > 1) {
        return "Elige solo un idioma.";
      }

      if (
        selected.length === 1 &&
        !options.languages.some((language) => language.code === selected[0])
      ) {
        return "Elige un idioma válido.";
      }

      return null;
    }
  }
}

export function validateStep(
  step: OnboardingStep,
  answers: AnswerMap,
  options: OnboardingOptions,
): FieldErrors {
  const errors: FieldErrors = {};

  for (const question of step.questions) {
    const error = validateQuestion(question, answers, options);

    if (error) {
      errors[question.code] = error;
    }
  }

  return errors;
}

export function buildAnswersPayload(
  steps: OnboardingStep[],
  answers: AnswerMap,
  options: OnboardingOptions,
): AnswerMap {
  const payload: AnswerMap = {};
  const primaryAreaId = getStringAnswer(answers, PRIMARY_AREA_CODE);
  const subAreaIds = getStringArrayAnswer(answers, SUBAREA_CODE);
  const validRootIds = new Set(
    getAreaRoots(options.areas).map((area) => area.id),
  );
  const validChildIds = new Set(
    getAreaChildren(options.areas, primaryAreaId).map((area) => area.id),
  );
  const hasValidAreaPair =
    validRootIds.has(primaryAreaId) &&
    subAreaIds.some((areaId) => validChildIds.has(areaId));

  for (const step of steps) {
    for (const question of step.questions) {
      const value = answers[question.code];

      switch (question.type) {
        case "text":
        case "url": {
          const text = typeof value === "string" ? value.trim() : "";

          if (text) {
            payload[question.code] = text;
          }
          break;
        }

        case "number": {
          if (value === undefined || value === null || value === "") {
            break;
          }

          const number = Number(value);

          if (Number.isFinite(number)) {
            payload[question.code] = number;
          }
          break;
        }

        case "single_select": {
          if (
            typeof value === "string" &&
            (question.options ?? []).some((option) => option.value === value)
          ) {
            payload[question.code] = value;
          }
          break;
        }

        case "multi_select": {
          if (!Array.isArray(value)) {
            break;
          }

          const selected = getStringArrayAnswer(answers, question.code).filter(
            (item) =>
              (question.options ?? []).some((option) => option.value === item),
          );

          if (question.required && selected.length === 0) {
            break;
          }

          payload[question.code] = selected;
          break;
        }

        case "area_single": {
          if (question.code === PRIMARY_AREA_CODE) {
            if (hasValidAreaPair) {
              payload[question.code] = primaryAreaId;
            }
            break;
          }

          if (typeof value === "string" && validRootIds.has(value)) {
            payload[question.code] = value;
          }
          break;
        }

        case "area_multi": {
          if (question.code === SUBAREA_CODE) {
            if (hasValidAreaPair) {
              payload[question.code] = subAreaIds.filter((areaId) =>
                validChildIds.has(areaId),
              );
            }
            break;
          }

          const selected = getStringArrayAnswer(answers, question.code).filter(
            (areaId) => validChildIds.has(areaId),
          );

          if (selected.length > 0) {
            payload[question.code] = selected;
          }
          break;
        }

        case "language_single": {
          const selected = getStringArrayAnswer(answers, question.code).filter(
            (code) =>
              options.languages.some((language) => language.code === code),
          );

          if (selected.length === 1) {
            payload[question.code] = selected;
          }
          break;
        }
      }
    }
  }

  return payload;
}

export function findFirstStepWithMissing(
  steps: OnboardingStep[],
  missing: string[],
): number {
  const missingCodes = new Set(missing);
  const index = steps.findIndex((step) =>
    step.questions.some((question) => missingCodes.has(question.code)),
  );

  return index >= 0 ? index : 0;
}

export function getMissingQuestionLabels(
  steps: OnboardingStep[],
  missing: string[],
): string[] {
  const labels = new Map<string, string>();

  for (const step of steps) {
    for (const question of step.questions) {
      labels.set(question.code, question.label);
    }
  }

  return missing.map((code) => labels.get(code) ?? code);
}

export function isStepComplete(
  step: OnboardingStep,
  missing: string[],
): boolean {
  const missingCodes = new Set(missing);

  return !step.questions.some(
    (question) => question.required && missingCodes.has(question.code),
  );
}
