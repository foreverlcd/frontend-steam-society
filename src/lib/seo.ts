import type { FaqItem } from "@/lib/marketing/faq";
import { absoluteUrl } from "@/lib/site";

/**
 * Serializes structured data for a `<script type="application/ld+json">` tag.
 * `<` is escaped so no string inside can close the script element.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function faqPageSchema(items: FaqItem[]) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function breadcrumbSchema(name: string, path: string) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: absoluteUrl("/"),
      },
      { "@type": "ListItem", position: 2, name, item: absoluteUrl(path) },
    ],
  };
}
