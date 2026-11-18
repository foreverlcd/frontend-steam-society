import type { FaqItem } from "@/lib/marketing/faq";

/** Native disclosure: works without JavaScript and is readable by crawlers. */
export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-line border-line divide-y rounded-3xl border bg-white">
      {items.map((item) => (
        <details key={item.question} className="group px-5 py-1 sm:px-7">
          <summary className="text-ink focus-visible:ring-brand-500 flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg py-4 text-left text-base font-semibold focus-visible:ring-2 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
            {item.question}
            <span
              aria-hidden="true"
              className="border-line text-brand-700 grid size-7 shrink-0 place-items-center rounded-full border text-lg leading-none transition group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="text-muted pb-5 text-sm leading-7 sm:text-base">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
