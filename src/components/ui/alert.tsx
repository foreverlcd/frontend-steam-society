import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type AlertTone = "error" | "success" | "info";

const TONE_CLASSES: Record<AlertTone, string> = {
  error: "border-danger-200 bg-danger-50 text-danger-700",
  success: "border-success-200 bg-success-50 text-success-700",
  info: "border-brand-200 bg-brand-50 text-brand-800",
};

export function Alert({
  tone = "info",
  className,
  children,
}: {
  tone?: AlertTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}
