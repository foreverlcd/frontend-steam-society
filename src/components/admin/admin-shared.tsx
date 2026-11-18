"use client";

import type { ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import type { BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { UserStatus } from "@/lib/api/types";
import { cn } from "@/lib/cn";

export const PANEL_CLASS =
  "border-line rounded-3xl border bg-white p-5 shadow-sm sm:p-6";

export const FIELD_CLASS =
  "border-line text-ink placeholder:text-muted/70 focus:border-brand-500 focus:ring-brand-500/10 aria-invalid:border-danger-500 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm shadow-sm transition outline-none focus:ring-4";

export function AdminPageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="max-w-2xl">
      <p className="text-brand-700 text-xs font-semibold tracking-[0.18em] uppercase">
        Administración
      </p>
      <h1 className="text-ink mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h1>
      <p className="text-muted mt-3 text-sm leading-6">{description}</p>
    </header>
  );
}

export function AdminPage({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      {children}
    </div>
  );
}

export function LoadingBlock({ message }: { message: string }) {
  return (
    <div className="text-muted flex items-center gap-3 px-1 py-6 text-sm">
      <Spinner className="size-4" />
      <span>{message}</span>
    </div>
  );
}

export function EmptyBlock({ children }: { children: ReactNode }) {
  return (
    <p className="border-line bg-canvas text-muted mt-4 rounded-2xl border border-dashed px-4 py-8 text-center text-sm">
      {children}
    </p>
  );
}

export function ErrorBlock({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="mt-4">
      <Alert tone="error">{message}</Alert>
      <Button type="button" className="mt-3" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  );
}

export function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ReadonlyArray<{ value: T; label: string; count?: number }>;
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "focus-visible:ring-brand-500 rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-visible:ring-2 focus-visible:outline-none",
              active
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-line text-muted hover:border-brand-300 hover:text-ink bg-white",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function LoadMore({
  hasMore,
  loading,
  error,
  onLoadMore,
}: {
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  onLoadMore: () => void;
}) {
  return (
    <>
      {hasMore ? (
        <Button
          type="button"
          variant="secondary"
          className="mt-4 w-full"
          loading={loading}
          onClick={onLoadMore}
        >
          Cargar más
        </Button>
      ) : null}
      {error ? (
        <Alert tone="error" className="mt-4">
          {error}
        </Alert>
      ) : null}
    </>
  );
}

/** Required free-text reason with a live counter and a minimum length. */
export function ReasonField({
  id,
  label,
  value,
  onChange,
  minLength,
  maxLength,
  placeholder,
  hint,
  showError,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  minLength: number;
  maxLength: number;
  placeholder?: string;
  hint?: string;
  showError?: boolean;
}) {
  const tooShort = value.trim().length < minLength;
  const invalid = Boolean(showError && tooShort);
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-ink text-sm font-medium">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        maxLength={maxLength}
        rows={3}
        required
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${hintId} ${errorId}` : hintId}
        onChange={(event) => onChange(event.target.value)}
        className={FIELD_CLASS}
        placeholder={placeholder}
      />
      <p id={hintId} className="text-muted text-xs">
        {hint ? `${hint} ` : ""}
        {value.length}/{maxLength}
      </p>
      {invalid ? (
        <p
          id={errorId}
          role="alert"
          className="text-danger-700 text-xs font-medium"
        >
          {minLength > 1
            ? `Escribe al menos ${minLength} caracteres.`
            : "Este campo es obligatorio."}
        </p>
      ) : null}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: "neutral" | "attention" | "danger";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        tone === "attention"
          ? "border-brand-300 bg-brand-50"
          : tone === "danger"
            ? "border-danger-200 bg-danger-50"
            : "border-line bg-white",
      )}
    >
      <p className="text-muted text-xs font-medium">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold tabular-nums",
          tone === "danger" ? "text-danger-700" : "text-ink",
        )}
      >
        {value}
      </p>
      {hint ? <p className="text-muted mt-1 text-xs">{hint}</p> : null}
    </div>
  );
}

export function userStatusTone(status: UserStatus): BadgeTone {
  if (status === "active") {
    return "success";
  }

  if (status === "suspended" || status === "deleted") {
    return "danger";
  }

  return "brand";
}
