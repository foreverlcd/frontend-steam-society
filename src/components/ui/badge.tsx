import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "brand" | "success" | "danger";

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-canvas text-muted",
  brand: "bg-brand-50 text-brand-700",
  success: "bg-success-50 text-success-700",
  danger: "bg-danger-50 text-danger-700",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
