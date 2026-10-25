"use client";

import type {
  OnboardingOptions,
  OnboardingQuestion,
} from "@/lib/api/onboarding";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ChoiceCard } from "@/components/ui/choice-card";
import { TextField } from "@/components/ui/text-field";
import {
  getAreaChildren,
  getAreaRoots,
  getStringAnswer,
  getStringArrayAnswer,
} from "@/lib/onboarding/answers";

function getDescribedBy(
  question: OnboardingQuestion,
  error?: string,
): string | undefined {
  const ids = [
    question.help ? `${question.code}-help` : null,
    error ? `${question.code}-error` : null,
  ].filter(Boolean);

  return ids.length > 0 ? ids.join(" ") : undefined;
}

function GroupHeader({
  question,
  error,
}: {
  question: OnboardingQuestion;
  error?: string;
}) {
  return (
    <>
      <legend className="text-ink text-sm font-medium">
        {question.label}{" "}
        <Badge tone={question.required ? "brand" : "neutral"}>
          {question.required ? "Obligatorio" : "Opcional"}
        </Badge>
      </legend>
      {question.help ? (
        <p id={`${question.code}-help`} className="text-muted mt-1 text-xs">
          {question.help}
        </p>
      ) : null}
      {error ? (
        <p
          id={`${question.code}-error`}
          role="alert"
          className="text-danger-700 mt-1 text-xs font-medium"
        >
          {error}
        </p>
      ) : null}
    </>
  );
}

function toggleSelection(
  selected: string[],
  value: string,
  maxSelections?: number,
): string[] {
  if (selected.includes(value)) {
    return selected.filter((item) => item !== value);
  }

  if (maxSelections && selected.length >= maxSelections) {
    return selected;
  }

  return [...selected, value];
}

function SingleSelectField({
  question,
  answers,
  error,
  onChange,
}: {
  question: OnboardingQuestion;
  answers: Record<string, unknown>;
  error?: string;
  onChange: (code: string, value: unknown) => void;
}) {
  const options = question.options ?? [];
  const value = getStringAnswer(answers, question.code);
  const describedBy = getDescribedBy(question, error);

  return (
    <fieldset
      aria-describedby={describedBy}
      aria-required={question.required || undefined}
      className="flex flex-col gap-3"
    >
      <GroupHeader question={question} error={error} />
      {options.length === 0 ? (
        <Alert tone="error">
          No hay opciones disponibles para esta pregunta.
        </Alert>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((option) => (
            <ChoiceCard
              key={option.value}
              id={`${question.code}-${option.value}`}
              name={question.code}
              type="radio"
              value={option.value}
              checked={value === option.value}
              invalid={Boolean(error)}
              describedBy={describedBy}
              onChange={() => onChange(question.code, option.value)}
              title={option.label}
            />
          ))}
        </div>
      )}
    </fieldset>
  );
}

function MultiSelectField({
  question,
  answers,
  error,
  onChange,
}: {
  question: OnboardingQuestion;
  answers: Record<string, unknown>;
  error?: string;
  onChange: (code: string, value: unknown) => void;
}) {
  const options = question.options ?? [];
  const selected = getStringArrayAnswer(answers, question.code);
  const maxReached =
    question.maxSelections !== undefined &&
    selected.length >= question.maxSelections;
  const describedBy = getDescribedBy(question, error);

  return (
    <fieldset
      aria-describedby={describedBy}
      aria-required={question.required || undefined}
      className="flex flex-col gap-3"
    >
      <GroupHeader question={question} error={error} />
      {options.length === 0 ? (
        <Alert tone="error">
          No hay opciones disponibles para esta pregunta.
        </Alert>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((option) => {
            const checked = selected.includes(option.value);

            return (
              <ChoiceCard
                key={option.value}
                id={`${question.code}-${option.value}`}
                name={question.code}
                type="checkbox"
                value={option.value}
                checked={checked}
                disabled={!checked && maxReached}
                invalid={Boolean(error)}
                describedBy={describedBy}
                onChange={() =>
                  onChange(
                    question.code,
                    toggleSelection(
                      selected,
                      option.value,
                      question.maxSelections,
                    ),
                  )
                }
                title={option.label}
              />
            );
          })}
        </div>
      )}
      {question.maxSelections && !question.help ? (
        <p className="text-muted text-xs">
          Puedes elegir hasta {question.maxSelections} opciones.
        </p>
      ) : null}
    </fieldset>
  );
}

function AreaSingleField({
  question,
  answers,
  options,
  error,
  onChange,
}: {
  question: OnboardingQuestion;
  answers: Record<string, unknown>;
  options: OnboardingOptions;
  error?: string;
  onChange: (code: string, value: unknown) => void;
}) {
  const roots = getAreaRoots(options.areas);
  const value = getStringAnswer(answers, question.code);
  const describedBy = getDescribedBy(question, error);

  return (
    <fieldset
      aria-describedby={describedBy}
      aria-required={question.required || undefined}
      className="flex flex-col gap-3"
    >
      <GroupHeader question={question} error={error} />
      {roots.length === 0 ? (
        <Alert tone="error">No hay áreas disponibles en este momento.</Alert>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {roots.map((area) => (
            <ChoiceCard
              key={area.id}
              id={`${question.code}-${area.id}`}
              name={question.code}
              type="radio"
              value={area.id}
              checked={value === area.id}
              invalid={Boolean(error)}
              describedBy={describedBy}
              onChange={() => onChange(question.code, area.id)}
              title={area.name}
            />
          ))}
        </div>
      )}
    </fieldset>
  );
}

function AreaMultiField({
  question,
  answers,
  options,
  error,
  onChange,
}: {
  question: OnboardingQuestion;
  answers: Record<string, unknown>;
  options: OnboardingOptions;
  error?: string;
  onChange: (code: string, value: unknown) => void;
}) {
  const primaryAreaId = getStringAnswer(answers, "primaryAreaId");
  const children = primaryAreaId
    ? getAreaChildren(options.areas, primaryAreaId)
    : [];
  const selected = getStringArrayAnswer(answers, question.code);
  const maxReached =
    question.maxSelections !== undefined &&
    selected.length >= question.maxSelections;
  const describedBy = getDescribedBy(question, error);

  return (
    <fieldset
      aria-describedby={describedBy}
      aria-required={question.required || undefined}
      className="flex flex-col gap-3"
    >
      <GroupHeader question={question} error={error} />
      {!primaryAreaId ? (
        <p className="border-line bg-canvas text-muted rounded-xl border border-dashed px-4 py-3 text-xs">
          Elige primero un área principal para ver sus subáreas.
        </p>
      ) : children.length === 0 ? (
        <Alert tone="info">
          Esta área todavía no tiene subáreas disponibles.
        </Alert>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {children.map((area) => {
            const checked = selected.includes(area.id);

            return (
              <ChoiceCard
                key={area.id}
                id={`${question.code}-${area.id}`}
                name={question.code}
                type="checkbox"
                value={area.id}
                checked={checked}
                disabled={!checked && maxReached}
                invalid={Boolean(error)}
                describedBy={describedBy}
                onChange={() =>
                  onChange(
                    question.code,
                    toggleSelection(selected, area.id, question.maxSelections),
                  )
                }
                title={area.name}
              />
            );
          })}
        </div>
      )}
      {question.maxSelections && !question.help ? (
        <p className="text-muted text-xs">
          Puedes elegir hasta {question.maxSelections} subáreas.
        </p>
      ) : null}
    </fieldset>
  );
}

function LanguageSingleField({
  question,
  answers,
  options,
  error,
  onChange,
}: {
  question: OnboardingQuestion;
  answers: Record<string, unknown>;
  options: OnboardingOptions;
  error?: string;
  onChange: (code: string, value: unknown) => void;
}) {
  const selected = getStringArrayAnswer(answers, question.code);
  const describedBy = getDescribedBy(question, error);

  return (
    <fieldset
      aria-describedby={describedBy}
      aria-required={question.required || undefined}
      className="flex flex-col gap-3"
    >
      <GroupHeader question={question} error={error} />
      {options.languages.length === 0 ? (
        <Alert tone="error">No hay idiomas disponibles en este momento.</Alert>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {options.languages.map((language) => (
            <ChoiceCard
              key={language.code}
              id={`${question.code}-${language.code}`}
              name={question.code}
              type="radio"
              value={language.code}
              checked={selected[0] === language.code}
              invalid={Boolean(error)}
              describedBy={describedBy}
              onChange={() => onChange(question.code, [language.code])}
              title={language.name}
              description={language.code.toUpperCase()}
            />
          ))}
        </div>
      )}
    </fieldset>
  );
}

export function QuestionField({
  question,
  answers,
  options,
  error,
  onChange,
}: {
  question: OnboardingQuestion;
  answers: Record<string, unknown>;
  options: OnboardingOptions;
  error?: string;
  onChange: (code: string, value: unknown) => void;
}) {
  switch (question.type) {
    case "text":
    case "url":
    case "number": {
      const raw = answers[question.code];
      const value =
        typeof raw === "string" || typeof raw === "number" ? String(raw) : "";
      const inputType =
        question.type === "url"
          ? "url"
          : question.type === "number"
            ? "number"
            : "text";

      return (
        <TextField
          id={question.code}
          label={question.label}
          type={inputType}
          required={question.required}
          hint={question.help}
          error={error}
          value={value}
          onChange={(event) => onChange(question.code, event.target.value)}
          inputMode={
            question.type === "url"
              ? "url"
              : question.type === "number"
                ? "numeric"
                : undefined
          }
          autoComplete={
            question.code === "city"
              ? "address-level2"
              : question.code === "linkedinUrl"
                ? "url"
                : undefined
          }
          placeholder={
            question.code === "city"
              ? "Ej. Lima"
              : question.code === "linkedinUrl"
                ? "https://www.linkedin.com/in/..."
                : undefined
          }
        />
      );
    }

    case "single_select":
      return (
        <SingleSelectField
          question={question}
          answers={answers}
          error={error}
          onChange={onChange}
        />
      );

    case "multi_select":
      return (
        <MultiSelectField
          question={question}
          answers={answers}
          error={error}
          onChange={onChange}
        />
      );

    case "area_single":
      return (
        <AreaSingleField
          question={question}
          answers={answers}
          options={options}
          error={error}
          onChange={onChange}
        />
      );

    case "area_multi":
      return (
        <AreaMultiField
          question={question}
          answers={answers}
          options={options}
          error={error}
          onChange={onChange}
        />
      );

    case "language_single":
      return (
        <LanguageSingleField
          question={question}
          answers={answers}
          options={options}
          error={error}
          onChange={onChange}
        />
      );

    default:
      return (
        <Alert tone="error">
          No pudimos mostrar esta pregunta. Recarga la página para continuar.
        </Alert>
      );
  }
}
