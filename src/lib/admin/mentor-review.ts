import type { AdminMentor, MentorStatus } from "@/lib/api/admin-mentors";
import type {
  OnboardingOptions,
  OnboardingQuestion,
} from "@/lib/api/onboarding";

export const MENTOR_STATUS_LABELS: Record<MentorStatus, string> = {
  draft: "Borrador",
  pending_review: "Pendiente de revisión",
  approved: "Aprobada",
  rejected: "Rechazada",
  suspended: "Suspendida",
};

export const MENTOR_STATUS_FILTERS: Array<{
  value: MentorStatus | "all";
  label: string;
}> = [
  { value: "pending_review", label: "Pendientes" },
  { value: "approved", label: "Aprobadas" },
  { value: "rejected", label: "Rechazadas" },
  { value: "suspended", label: "Suspendidas" },
  { value: "draft", label: "Borradores" },
  { value: "all", label: "Todas" },
];

export function mentorDisplayName(
  mentor: Pick<AdminMentor, "firstName" | "lastName" | "email">,
): string {
  const name = [mentor.firstName, mentor.lastName].filter(Boolean).join(" ");

  return name || mentor.email;
}

export function formatDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
  }).format(date);
}

export function formatAnswer(
  question: OnboardingQuestion,
  answer: unknown,
  options: OnboardingOptions,
): string {
  if (answer === undefined || answer === null || answer === "") {
    return "Sin responder";
  }

  if (Array.isArray(answer)) {
    if (answer.length === 0) {
      return "Sin responder";
    }

    return answer
      .map((value) => formatSingleAnswer(question, value, options))
      .join(", ");
  }

  return formatSingleAnswer(question, answer, options);
}

function formatSingleAnswer(
  question: OnboardingQuestion,
  answer: unknown,
  options: OnboardingOptions,
): string {
  const value = String(answer);

  switch (question.type) {
    case "single_select":
    case "multi_select": {
      return (
        question.options?.find((option) => option.value === value)?.label ??
        value
      );
    }

    case "area_single":
    case "area_multi": {
      return options.areas.find((area) => area.id === value)?.name ?? value;
    }

    case "language_single": {
      return (
        options.languages.find((language) => language.code === value)?.name ??
        value
      );
    }

    default:
      return value;
  }
}
