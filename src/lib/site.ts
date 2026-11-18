/** Public site facts shared by metadata, sitemap, robots, llms.txt and JSON-LD. */

const FALLBACK_SITE_URL = "http://localhost:3001";

function normalizeSiteUrl(value: string | undefined): string {
  const raw = (value ?? "").trim() || FALLBACK_SITE_URL;
  return raw.replace(/\/+$/, "");
}

/** Absolute origin of the web app, e.g. https://app.example.pe (no trailing slash). */
export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

export const SITE_NAME = "Steam Society";

export const SITE_TAGLINE = "Mentorías 1 a 1 para mujeres en STEAM";

export const SITE_DESCRIPTION =
  "Steam Society conecta a mujeres y niñas de Perú y Latinoamérica con mentoras de ciencia, tecnología, ingeniería, arte y matemáticas (STEAM) para conversar 1 a 1 por videollamada.";

export const SITE_LOCALE = "es_PE";

/** Version of the privacy notice and terms; matches the API's LEGAL_TERMS_VERSION. */
export const LEGAL_VERSION = "2026-11-18";

/** Human date of the legal texts, shown on the legal pages. */
export const LEGAL_UPDATED_LABEL = "18 de noviembre de 2026";

export interface PublicRoute {
  path: string;
  title: string;
  description: string;
  priority: number;
  changeFrequency: "weekly" | "monthly" | "yearly";
}

/** Indexable public pages. The private app (dashboard, admin, call) is not listed. */
export const PUBLIC_ROUTES: PublicRoute[] = [
  {
    path: "/",
    title: "Inicio",
    description: SITE_DESCRIPTION,
    priority: 1,
    changeFrequency: "weekly",
  },
  {
    path: "/para-mentees",
    title: "Para mentees",
    description:
      "Cómo encontrar una mentora STEAM, reservar una sesión 1 a 1 y qué esperar de la conversación.",
    priority: 0.9,
    changeFrequency: "monthly",
  },
  {
    path: "/para-mentoras",
    title: "Para mentoras",
    description:
      "Cómo ser mentora en Steam Society: requisitos, revisión del perfil, horarios y sesiones.",
    priority: 0.9,
    changeFrequency: "monthly",
  },
  {
    path: "/mentors",
    title: "Mentoras",
    description:
      "Catálogo público de mentoras aprobadas, con filtros por área, idioma y precio.",
    priority: 0.8,
    changeFrequency: "weekly",
  },
  {
    path: "/help",
    title: "Ayuda y seguridad",
    description:
      "Cómo reportar o bloquear a alguien, reglas de la comunidad y contactos de emergencia en Perú.",
    priority: 0.6,
    changeFrequency: "monthly",
  },
  {
    path: "/privacidad",
    title: "Política de privacidad",
    description:
      "Qué datos personales trata Steam Society, para qué, con quién y cómo ejercer tus derechos.",
    priority: 0.3,
    changeFrequency: "yearly",
  },
  {
    path: "/terminos",
    title: "Términos y condiciones",
    description: "Reglas de uso de Steam Society para mentees y mentoras.",
    priority: 0.3,
    changeFrequency: "yearly",
  },
  {
    path: "/cookies",
    title: "Política de cookies",
    description:
      "Steam Society usa una sola cookie necesaria para mantener la sesión. Sin publicidad ni analítica.",
    priority: 0.2,
    changeFrequency: "yearly",
  },
];

export function absoluteUrl(path: string): string {
  return path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}
