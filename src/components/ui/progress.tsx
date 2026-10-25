import { cn } from "@/lib/cn";

export function Progress({
  value,
  max = 100,
  label,
  className,
}: {
  value: number;
  max?: number;
  label: string;
  className?: string;
}) {
  const safeMax = Math.max(max, 1);
  const clamped = Math.min(Math.max(value, 0), safeMax);
  const percent = Math.round((clamped / safeMax) * 100);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={clamped}
      aria-valuetext={`${percent}%`}
      className={cn("bg-brand-100 h-2 overflow-hidden rounded-full", className)}
    >
      <div
        className="bg-brand-600 h-full rounded-full transition-[width]"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
