import { cn } from "@/lib/cn";

export function Logo({
  className,
  markOnly = false,
  tone = "dark",
}: {
  className?: string;
  markOnly?: boolean;
  tone?: "dark" | "light";
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden="true"
        className="from-brand-600 via-brand-500 to-accent-500 relative grid size-9 place-items-center rounded-2xl bg-gradient-to-br text-sm font-black text-white shadow-sm"
      >
        S
        <span className="bg-accent-300 ring-canvas absolute -top-1 -right-1 size-2 rounded-full ring-2" />
      </span>
      {markOnly ? null : (
        <span
          className={cn(
            "text-[1.05rem] font-semibold tracking-tight",
            tone === "light" ? "text-white" : "text-ink",
          )}
        >
          Steam Society
        </span>
      )}
    </span>
  );
}
