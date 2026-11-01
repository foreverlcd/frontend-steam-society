import type { CatalogMentor, CatalogOffering } from "@/lib/api/catalog";

export function mentorDisplayName(
  mentor: Pick<CatalogMentor, "firstName" | "lastName">,
): string {
  return (
    [mentor.firstName, mentor.lastName].filter(Boolean).join(" ") ||
    "Mentora de Steam Society"
  );
}

export function formatPrice(
  offering: Pick<CatalogOffering, "isFree" | "priceMinor" | "currency">,
): string {
  if (offering.isFree) {
    return "Gratis";
  }

  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: offering.currency,
    maximumFractionDigits: 2,
  }).format(offering.priceMinor / 100);
}

export function formatDateTime(value: string, timezone?: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
    ...(timezone ? { timeZone: timezone } : {}),
  }).format(date);
}

export function formatAreas(mentor: Pick<CatalogMentor, "areas">): string {
  return mentor.areas.map((area) => area.name).join(" · ") || "Sin áreas";
}

export function formatLanguages(
  mentor: Pick<CatalogMentor, "languages">,
): string {
  return (
    mentor.languages.map((language) => language.name).join(" · ") ||
    "Sin idiomas"
  );
}
