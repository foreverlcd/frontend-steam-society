import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "border-line text-ink placeholder:text-muted/70 focus:border-brand-500 focus:ring-brand-500/10 disabled:bg-brand-50/60 aria-invalid:border-danger-500 aria-invalid:focus:border-danger-500 aria-invalid:focus:ring-danger-500/10 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm shadow-sm transition outline-none focus:ring-4",
        className,
      )}
      {...props}
    />
  );
}
