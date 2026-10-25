import { apiFetch } from "./client";

export type OnboardingRole = "mentor" | "mentee";

export type OnboardingQuestionType =
  | "number"
  | "text"
  | "url"
  | "single_select"
  | "multi_select"
  | "area_single"
  | "area_multi"
  | "language_single";

export interface OnboardingOption {
  value: string;
  label: string;
}

export interface OnboardingQuestion {
  code: string;
  label: string;
  type: OnboardingQuestionType;
  required: boolean;
  maxSelections?: number;
  options?: OnboardingOption[];
  help?: string;
}

export interface OnboardingStep {
  code: string;
  title: string;
  questions: OnboardingQuestion[];
}

export interface OnboardingArea {
  id: string;
  name: string;
  parentId: string | null;
}

export interface OnboardingLanguage {
  code: string;
  name: string;
}

export interface OnboardingCompletion {
  complete: boolean;
  missing: string[];
}

export interface OnboardingOptions {
  areas: OnboardingArea[];
  languages: OnboardingLanguage[];
}

export interface OnboardingData {
  version: number;
  role: OnboardingRole;
  steps: OnboardingStep[];
  answers: Record<string, unknown>;
  completion: OnboardingCompletion;
  options: OnboardingOptions;
}

export interface OnboardingUpdateInput {
  version: number;
  answers: Record<string, unknown>;
}

export function getOnboarding(signal?: AbortSignal): Promise<OnboardingData> {
  return apiFetch<OnboardingData>("/me/onboarding", { signal });
}

export function updateOnboarding(
  input: OnboardingUpdateInput,
): Promise<OnboardingData> {
  return apiFetch<OnboardingData>("/me/onboarding", {
    method: "PUT",
    json: input,
  });
}
