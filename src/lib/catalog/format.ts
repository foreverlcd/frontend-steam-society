import type {
  CatalogMentor,
  CatalogOffering,
  RecommendationOffering,
} from "@/lib/api/catalog";

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

export function formatDayHeading(day: string): string {
  const date = new Date(`${day}T12:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return day;
  }

  const text = new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  })
    .format(date)
    .replace(",", "");

  return text.charAt(0).toUpperCase() + text.slice(1);
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

export function matchLabel(score: number): string {
  if (score >= 80) {
    return "Muy buena coincidencia";
  }

  if (score >= 60) {
    return "Buena coincidencia";
  }

  return "Coincidencia";
}

export function priceLabel(offerings: RecommendationOffering[]): string {
  const lowest = offerings.reduce((best, offering) =>
    offering.priceMinor < best.priceMinor ? offering : best,
  );

  if (lowest.isFree || lowest.priceMinor === 0) {
    return "Sesión gratuita";
  }

  return `Desde ${formatPrice(lowest)}`;
}
