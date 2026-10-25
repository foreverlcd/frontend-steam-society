"use client";

import { cn } from "@/lib/cn";

export function ChoiceCard({
  id,
  name,
  type,
  value,
  checked,
  onChange,
  title,
  description,
  disabled = false,
  invalid = false,
  describedBy,
}: {
  id: string;
  name: string;
  type: "radio" | "checkbox";
  value: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description?: string;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "focus-within:ring-brand-500/30 flex cursor-pointer gap-3 rounded-2xl border p-4 transition focus-within:ring-2",
        checked
          ? "border-brand-500 bg-brand-50 ring-brand-500/20 ring-2"
          : "border-line hover:border-brand-300 bg-white",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        checked={checked}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.checked)}
        className="accent-brand-600 mt-1 size-4 shrink-0"
      />
      <span className="min-w-0">
        <span className="text-ink block text-sm font-semibold">{title}</span>
        {description ? (
          <span className="text-muted mt-0.5 block text-xs leading-5">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}
